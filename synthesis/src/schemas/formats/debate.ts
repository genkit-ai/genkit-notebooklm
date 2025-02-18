import { z } from "genkit";
import { basePodcastOptionsSchema, moderatorSchema } from "../base";

export const debateSideSchema = z.object({
    sideName: z.string(),
    speakers: z.array(z.string()),
    description: z.string().optional(),
    keyPoints: z.array(z.string()).optional()
  });
  
  export const debatePodcastOptionsSchema = basePodcastOptionsSchema.extend({
    format: z.literal("debate"),
    debateTopic: z.string().optional(),
    debateStructure: z.enum(["formal", "open"]).optional(),
    numRounds: z.number().min(1).max(10).optional(),
    moderator: moderatorSchema.optional(),
    autoAssignSides: z.boolean().optional(),
    sides: z.array(debateSideSchema).optional()
  });