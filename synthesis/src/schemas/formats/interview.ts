import { z } from "genkit";
import { basePodcastOptionsSchema } from "../base";

export const interviewPodcastOptionsSchema = basePodcastOptionsSchema.extend({
    format: z.literal("interview"),
    
    // The guest being interviewed. AI will frame the interview around this speaker.
    // If omitted, AI picks the most relevant guest from `speakers[]`.
    intervieweeName: z.string().optional(),
    
    // The topic or guiding question for the interview.
    // If omitted, AI infers a topic based on input content.
    topic: z.string().optional(),
    // If true, multiple interviewers take turns asking questions.
    // If false, the first "host" in `speakers[]` is the only interviewer.
    rotatingInterviewers: z.boolean().optional(),
    
    // Max number of questions in the interview.
    // Defaults to 10 if unspecified.
    // Min: 3, Max: 20
    maxQuestions: z.number().optional()
  });
