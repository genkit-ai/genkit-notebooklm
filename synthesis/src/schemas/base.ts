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
  bucketName: z.string(),
});

export const moderatorSchema = z.object({
  name: z.string(),
  voiceId: z.string().optional(),
  style: z.enum(["neutral", "assertive", "facilitating"]),
  gender: z.enum(["male", "female"]).optional(),
  speakingTime: z.number().min(1).max(10).optional(),
  openingRemarks: z.boolean().optional(),
  closingRemarks: z.boolean().optional()
});

