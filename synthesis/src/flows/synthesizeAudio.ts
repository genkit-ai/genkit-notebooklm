import { z } from "genkit";
import { ai, storage, tts } from "../config";
import { podcastOptionsSchema } from "../schemas/podcast";
import fs from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { uploadFileToStorage } from "../util";
import { moderatorSchema, speakerSchema } from "../schemas/base";
import { USE_CLOUD_STORAGE } from "../config";
const defaultVoiceId = "en-US-Journey-D"; // fallback voice

type PodcastScriptLine = {
  speaker: string;
  text: string;
}

enum AudioEncoding {
  MP3 = "MP3",
  AUDIO_ENCODING_UNSPECIFIED = "AUDIO_ENCODING_UNSPECIFIED", 
  LINEAR16 = "LINEAR16",
  OGG_OPUS = "OGG_OPUS",
  MULAW = "MULAW",
  ALAW = "ALAW",
  PCM = "PCM",
}

const synthesizeAudioInputSchema = z.object({
  script: z.array(
    z.object({
      speaker: z.string(),
      text: z.string()
    })
  ),
  moderator: moderatorSchema.optional(),
  speakers: z.array(speakerSchema),
  options: podcastOptionsSchema
});

const synthesizeAudioOutputSchema = z.object({
  audioFileName: z.string(),
  storageUrl: z.string(),
});

function getVoiceIdForSpeaker(speakerName: string, speakers: z.infer<typeof speakerSchema>[], moderator?: z.infer<typeof moderatorSchema>): string {
  // First check if this is the moderator
  if (moderator && moderator.name === speakerName) {
    return moderator.voiceId || defaultVoiceId;
  }
  // Then check regular speakers
  const speaker = speakers.find(s => s.name === speakerName);
  return speaker?.voiceId || defaultVoiceId;
}

export const synthesizeAudioFlow = ai.defineFlow(
  {
    name: "synthesizeAudioFlow",
    inputSchema: synthesizeAudioInputSchema,
    outputSchema: synthesizeAudioOutputSchema,
  },
  async (inputValues: z.infer<typeof synthesizeAudioInputSchema>) => {
    const { script, speakers, moderator, options } = inputValues;

    const outputFileName = `podcast_audio_${options.title || uuidv4()}.mp3`;
    const storagePath = `${options.audioStorage}/${outputFileName}`;
    const bucketName = options.bucketName;
    let storageUrl = "";
    if (bucketName && USE_CLOUD_STORAGE) {
      const bucket = storage?.bucket(bucketName);
      storageUrl = await synthesizePodcastAudio(script, bucket, bucketName, outputFileName, storagePath, speakers, moderator);
    } else {
      storageUrl = "";
    }
    return { audioFileName: outputFileName, storageUrl };
  }
);

/**
 * This function loops through each line of the final podcast script,
 * synthesizes the audio for each line, and writes out separate mp3 segments.
 * Finally, it merges all segments into a single mp3 file named "finalPodcast.mp3".
 */
export async function synthesizePodcastAudio(
  script: PodcastScriptLine[],
  bucket: any | null,
  bucketName: string, 
  outputFileName: string,
  storagePath: string,
  speakers: z.infer<typeof speakerSchema>[] = [],
  moderator?: z.infer<typeof moderatorSchema>,
) {
  console.log('Starting audio synthesis for', script.length, 'sections');
  const concurrency = 3;
  const startTime = Date.now();
  const synthesisMetrics = {
    totalSegments: 0,
    avgSegmentTime: 0,
    mergeTime: 0,
    uploadTime: 0,
    retries: 0,
  };

  // Add line count metrics
  const totalLines = script.length;
  synthesisMetrics.totalSegments = totalLines;
  console.log(`Total lines to synthesize: ${totalLines}`);

  // Add retry helper function
  const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying... attempts left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return withRetry(fn, retries - 1, delayMs * 2); // Exponential backoff
      }
      throw error;
    }
  };

  const processSegment = async ({ line, segmentIndex }: { line: PodcastScriptLine, segmentIndex: number }) => {
    const segmentStart = Date.now();
    const segmentFileName = `segment_${segmentIndex}_${line.speaker}.mp3`;
    
    await withRetry(async () => {
      console.log(`Synthesizing audio for segment ${segmentIndex}`);
      // Get voice name and infer language code from speaker
      const name = getVoiceIdForSpeaker(line.speaker, speakers, moderator);
      const languageCode = name.split('-')[0] + '-' + name.split('-')[1];
      const [response] = await tts.synthesizeSpeech({
        input: { text: line.text },
        voice: {languageCode, name},
        audioConfig: {
          audioEncoding: AudioEncoding.MP3,
          effectsProfileId: ["small-bluetooth-speaker-class-device"],
          pitch: 0,
          speakingRate: 1,
        },
      });
      
      if (!response.audioContent) {
        throw new Error("No audio content received");
      }
      
      await fs.writeFile(segmentFileName, response.audioContent, "binary");
    });

    const segmentTime = Date.now() - segmentStart;
    synthesisMetrics.avgSegmentTime = (synthesisMetrics.avgSegmentTime * (segmentIndex) + segmentTime) / (segmentIndex + 1);
    return segmentFileName;
  };

  const segmentFiles = [];
  const allSegments = script.map((line, index) => ({
    line,
    segmentIndex: index
  }));

  async function processBatch(
    segments: { line: PodcastScriptLine, segmentIndex: number }[], 
    processSegment: (segment: { line: PodcastScriptLine, segmentIndex: number }) => Promise<string>
  ) {
    return Promise.all(segments.map(processSegment));
  }

  for (let i = 0; i < allSegments.length; i += concurrency) {
    const batch = allSegments.slice(i, i + concurrency);
    const batchResults = await processBatch(batch, processSegment);
    segmentFiles.push(...batchResults);

    // Add delay between batches if there are more segments to process
    const hasMoreSegments = i + concurrency < allSegments.length;
    if (hasMoreSegments) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('Merging', segmentFiles.length, 'audio segments...');
  const mergeStart = Date.now();
  await mergeAudioFiles(segmentFiles, outputFileName);
  synthesisMetrics.mergeTime = Date.now() - mergeStart;
  
  console.log('Uploading merged file to storage...');
  const uploadStart = Date.now();
  let finalOutputPath;
  if (USE_CLOUD_STORAGE && bucket) {
    const finalOutputFileName = outputFileName;
    await uploadFileToStorage(bucket, finalOutputFileName, storagePath);
    synthesisMetrics.uploadTime = Date.now() - uploadStart;
    console.log('Generating shareable download URL...');
    finalOutputPath = `gs://${bucketName}/${storagePath}`;
    console.log('Generated Google Storage URL:', finalOutputPath);

    // Clean up local files after upload
    console.log('Cleaning up temporary files...');
    await Promise.all(
      segmentFiles.map(file =>
        fs.unlink(file).catch(err =>
          console.warn("Could not remove temp file:", file, err)
        )
      )
    );
    await fs.unlink(outputFileName).catch(err =>
      console.warn("Could not remove merged file:", outputFileName, err)
    );
  } else {
    finalOutputPath = outputFileName;
    // Only clean up segment files when keeping final output
    console.log('Cleaning up temporary segment files...');
    await Promise.all(
      segmentFiles.map(file =>
        fs.unlink(file).catch(err =>
          console.warn("Could not remove temp file:", file, err)
        )
      )
    );
  }
  console.log('Cleanup complete');

  // Add audio synthesis metrics
  console.log('\n=== Audio Synthesis Metrics ===');
  console.log(`Total segments processed: ${synthesisMetrics.totalSegments}`);
  console.log(`Average segment time: ${synthesisMetrics.avgSegmentTime.toFixed(1)}ms`);
  console.log(`Merge time: ${synthesisMetrics.mergeTime}ms`);
  console.log(`Upload time: ${synthesisMetrics.uploadTime}ms`);
  console.log(`Retry attempts: ${synthesisMetrics.retries}`);
  console.log(`Total audio processing time: ${Date.now() - startTime}ms\n`);

  return finalOutputPath;
}

// Helper function to promisify ffmpeg merge operation
async function mergeAudioFiles(segmentFiles: string[], outputFileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    
    segmentFiles.forEach(file => command.input(file));

    command
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .mergeToFile(path.join(process.cwd(), outputFileName), path.join(process.cwd(), 'tmp'));
  });
}