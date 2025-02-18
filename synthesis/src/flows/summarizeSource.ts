import { z } from "genkit";
import { ai } from "../config";
import { gemini15Flash } from "@genkit-ai/googleai";

// Flow #1: Summarize Source
const summarizeSourceInputSchema = z.object({
  sourceText: z.string(),
});

const summarizeSourceOutputSchema = z.object({
  summary: z.string(),
  quotesBlock: z.string(),
  outlineBlock: z.string(),
});

export const summarizeSourceFlow = ai.defineFlow(
  {
    name: "summarizeSourceFlow",
    inputSchema: summarizeSourceInputSchema,
    outputSchema: summarizeSourceOutputSchema,
  },
  async (inputValues: z.infer<typeof summarizeSourceInputSchema>) => {
    const { sourceText } = inputValues;

    const prompt = `
      You have a piece of text.
      1) Summarize it (2-3 paragraphs).
      2) Provide a short list of direct quotes or excerpts.
      3) Give a bullet-list outline of the key points.

      Source:
      ${sourceText}
    `;

    const summaryResponse = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: { temperature: 0.8 },
      output: { schema: summarizeSourceOutputSchema },
    });

    const summary = summaryResponse.output?.summary || "";
    const quotesBlock = summaryResponse.output?.quotesBlock || "";
    const outlineBlock = summaryResponse.output?.outlineBlock || "";

    return { summary, quotesBlock, outlineBlock };
  }
);

export const summarizeSourcesFlow = ai.defineFlow(
  {
    name: "summarizeSourcesFlow",
    inputSchema: z.object({
      sourceTexts: z.array(z.string())
    }),
    outputSchema: z.object({
      combinedSummary: z.string()
    })
  },
  async (input) => {
    const { sourceTexts } = input;

    // Summarize each source independently
    const summaryResults = await Promise.all(
      sourceTexts.map((sourceText: string) => 
        summarizeSourceFlow({ sourceText })
      )
    );
    
    // Combine the summaries
    const combinedSummary = "------ BEGIN INPUT SOURCE SUMMARIES ------\n" +
      summaryResults.map((result: { summary: string, quotesBlock: string }, index: number) => 
        `SOURCE #${index + 1}:\nSummary: ${result.summary}\nQuotes: ${result.quotesBlock}`
      ).join("\n------------\n") +
      "\n------ END INPUT SOURCE SUMMARIES -----";

    return {
      combinedSummary
    };
  }
);