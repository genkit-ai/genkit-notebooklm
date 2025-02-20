import { z } from "zod";

export const speakerSchema = z.object({
  name: z.string(),
  voiceId: z.string().optional(),
  background: z.string().optional(),
});

export const basePodcastOptionsSchema = z.object({
  speakers: z.array(speakerSchema),
  transcriptStorage: z.string().optional(),
  audioStorage: z.string().optional(),
  title: z.string().optional(),
  bucketName: z.string().optional(),
});

export const moderatorSchema = z.object({
  name: z.string(),
  voiceId: z.string().optional(),
  style: z.string(),
  gender: z.enum(["male", "female"]).optional(),
  speakingTime: z.number().min(1).max(10).optional(),
  openingRemarks: z.boolean().optional(),
  closingRemarks: z.boolean().optional()
});

