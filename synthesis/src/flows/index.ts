import { z } from "genkit";
import { ai, db, JOBS_COLLECTION, USE_CLOUD_STORAGE, USE_FIRESTORE } from "../config";
import { podcastOptionsSchema } from "../schemas/podcast";
import { summarizeSourcesFlow } from "./summarizeSource";
import { synthesizeAudioFlow } from "./synthesizeAudio";
import { discussionHooksFlow } from "./generateHooks";
import { generateScriptFlow } from "./generateScript";

export enum JobStatus {
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}


const endToEndPodcastInputSchema = z.object({
  sourceTexts: z.array(z.string()),
  jobId: z.string(),
  options: podcastOptionsSchema,
});

const endToEndPodcastOutputSchema = z.object({
  audioFileName: z.string(),
  script: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
    })
  ),
  storageUrl: z.string(),
});

export const endToEndPodcastFlow = ai.defineFlow(
  {
    name: "endToEndPodcastFlow", 
    inputSchema: endToEndPodcastInputSchema,
    outputSchema: endToEndPodcastOutputSchema,
  },
  async (input: z.infer<typeof endToEndPodcastInputSchema>) => {
    let timer = Date.now();
    const metrics: Record<string, number> = {};

    const logJobStatus = (status: JobStatus, data: any = {}) => {
      console.log(db, USE_CLOUD_STORAGE, USE_FIRESTORE)
      if (db) {
        const jobRef = db.collection(JOBS_COLLECTION).doc(input.jobId);
        return jobRef.set(data, { merge: true });
      } else {
        console.log(`Job ${input.jobId} status update:`, { status, ...data });
        return Promise.resolve();
      }
    };

    await logJobStatus(JobStatus.QUEUED, {
      status: JobStatus.QUEUED,
      jobId: input.jobId,
      createdAt: Date.now()
    });

    try {
      await logJobStatus(JobStatus.PROCESSING, {
        status: JobStatus.PROCESSING,
        currentStep: 'Generating summary',
        startTime: Date.now()
      });

      const summaryResult = await summarizeSourcesFlow({
        sourceTexts: input.sourceTexts,
      });
      metrics.summarize = Date.now() - timer;
      timer = Date.now();

      await logJobStatus(JobStatus.PROCESSING, {
        currentStep: 'Generating discussion hooks'
      });

      const hooksResult = await discussionHooksFlow({
        summary: summaryResult.combinedSummary, 
      });
      metrics.hooks = Date.now() - timer;
      timer = Date.now();

      await logJobStatus(JobStatus.PROCESSING, {
        currentStep: 'Generating script'
      });

      const scriptResult = await generateScriptFlow({
        summary: summaryResult.combinedSummary,
        hooks: hooksResult.hooks,
        options: input.options,
      });
      metrics.script = Date.now() - timer;
      timer = Date.now();

      await logJobStatus(JobStatus.PROCESSING, {
        currentStep: 'Synthesizing audio'
      });

      const audioResult = await synthesizeAudioFlow({
        script: scriptResult.script,
        speakers: input.options.speakers,
        moderator: 'moderator' in input.options ? input.options.moderator : undefined,
        options: input.options,
      });
      metrics.audio = Date.now() - timer;

      await logJobStatus(JobStatus.COMPLETED, {
        status: JobStatus.COMPLETED,
        currentStep: '',
        metrics,
        completedAt: Date.now(),
        summary: summaryResult.combinedSummary,
        hooks: hooksResult.hooks,
        script: scriptResult.script,
        audioUrl: audioResult.storageUrl
      });

      return {
        audioFileName: audioResult.audioFileName,
        script: scriptResult.script,
        storageUrl: audioResult.storageUrl
      };
    } catch (error) {
      await logJobStatus(JobStatus.ERROR, {
        status: JobStatus.ERROR,
        error: error instanceof Error ? error.message : String(error),
        failedAt: Date.now()
      });
      throw error;
    }
  }
);
