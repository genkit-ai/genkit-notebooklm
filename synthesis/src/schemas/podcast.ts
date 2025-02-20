import { z } from "genkit";
import { interviewPodcastOptionsSchema } from "./formats/interview";
import { roundtablePodcastOptionsSchema } from "./formats/roundtable";
import { debatePodcastOptionsSchema } from "./formats/debate";

// Defines a discriminated union of podcast format options, using the "format" field as the discriminator.
// This allows type-safe handling of the different podcast formats (interview, roundtable, debate)
// while ensuring the correct options schema is used for each format.
export const podcastOptionsSchema = z.discriminatedUnion("format", [
  interviewPodcastOptionsSchema,
  roundtablePodcastOptionsSchema,
  debatePodcastOptionsSchema
]);

export type InterviewPodcastOptions = z.infer<typeof interviewPodcastOptionsSchema>;
export type RoundtablePodcastOptions = z.infer<typeof roundtablePodcastOptionsSchema>;
export type DebatePodcastOptions = z.infer<typeof debatePodcastOptionsSchema>;
export type PodcastOptions = InterviewPodcastOptions | RoundtablePodcastOptions | DebatePodcastOptions;

export type OutputType =
//  | "summary"
  | "podcast";

// Define the valid output configurations
export type OutputConfig =
//  | { type: "summary"; options: SummaryOptions }
  | { type: "podcast"; options: PodcastOptions }


/**
 * Main Synthesis Request
 */
export interface SynthesisRequest {
    /** The input source(s) for synthesis */
    input: string | string[]; // Supports multiple sources (PDFs, URLs, etc.)
    /** The desired output formats */
    output: OutputConfig[]; // Supports multiple output types in a single request
  }

export interface SynthesisResult {
  //studyGuide?: StudyGuideSection[];
  podcast?: PodcastResult;
}

// TODO: Need to figure out how to handle remote storage of the actual files generated
export interface PodcastResult {
  transcript: string;
  storageUrl: string;
  audioFilename: string;
}
