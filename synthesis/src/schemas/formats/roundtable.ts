import { z } from "genkit";
import { basePodcastOptionsSchema, moderatorSchema } from "../base";

export const roundtablePodcastOptionsSchema = basePodcastOptionsSchema.extend({
    format: z.literal("roundtable"),
    discussionStyle: z.enum([
      "expert_panel", // In-depth discussion with domain experts
      "founders_chat", // Candid discussions between startup founders
      "trend_analysis", // Discussion focused on analyzing current trends
      "industry_roundtable", // Professionals discussing an industry challenge
      "brainstorm_session", // Free-flowing discussion of ideas & problem-solving
    ]),
    structure: z.enum([
      "open_discussion", // No strict topic control, speakers talk naturally
      "moderated_topics", // AI-guided transitions between structured topics
    ]),
    moderator: moderatorSchema.optional() // Optional moderator to guide discussion and ensure balanced speaking time
  });
  