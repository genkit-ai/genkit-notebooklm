import { z } from "genkit";
import { ai, storage } from "../config";
import { uploadFileToStorage } from "../util";
import { roundtablePodcastScriptFlow } from "./formats/roundtable";
import { debatePodcastScriptFlow } from "./formats/debate";
import { interviewPodcastScriptFlow } from "./formats/interview";
import fs from "fs/promises";
import { podcastOptionsSchema } from "../schemas/podcast";

export const generateScriptFlow = ai.defineFlow(
  {
    name: "generateScriptFlow",
    inputSchema: z.object({
      summary: z.string(),
      hooks: z.array(z.string()),
      options: podcastOptionsSchema
    }),
    outputSchema: z.object({
      script: z.array(z.object({
        speaker: z.string(),
        text: z.string()
      })),
      storageUrl: z.string().optional()
    })
  },
  async (input) => {
    let scriptResult;
    switch (input.options.format) {
      case "roundtable":
        scriptResult = await roundtablePodcastScriptFlow({
          summary: input.summary,
          options: input.options,
          hooks: input.hooks,
        });
        break;
      case "debate":
        scriptResult = await debatePodcastScriptFlow({
          summary: input.summary,
          options: input.options,
          hooks: input.hooks,
        });
        break;
      case "interview":
        scriptResult = await interviewPodcastScriptFlow({
          summary: input.summary,
          options: input.options,
          hooks: input.hooks,
        });
        break;
      default:
        throw new Error(`Unsupported podcast format`);
    }

    if (!scriptResult.script) {
      throw new Error("Script generation failed - no script content returned");
    }

    let storageUrl;
    if (storage) {
      // Upload transcript to storage
      const transcriptFileName = `transcript_${Date.now()}.json`;
      const storagePath = `${input.options.transcriptStorage}/${transcriptFileName}`;
      const bucket = storage.bucket(input.options.bucketName);
      const transcriptContent = JSON.stringify(scriptResult.script, null, 2);
      await fs.writeFile(transcriptFileName, transcriptContent);
      
      storageUrl = await uploadFileToStorage(bucket, transcriptFileName, storagePath);
      
      // Cleanup temp file
      await fs.unlink(transcriptFileName).catch(err =>
        console.warn("Could not remove transcript file:", transcriptFileName, err)
      );
    }

    return {
      script: scriptResult.script,
      storageUrl
    };
  }
);