import { z } from "genkit";
import { ai } from "../../config";
import { gemini15Flash } from "@genkit-ai/googleai";
import { interviewPodcastOptionsSchema } from "../../schemas/formats/interview";


const finalPodcastScriptInputSchema = z.object({
  summary: z.string(),
  hooks: z.array(z.string()),
  options: interviewPodcastOptionsSchema
});

const finalPodcastScriptOutputSchema = z.object({
  script: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
    })
  ),
});

export const interviewPodcastScriptFlow = ai.defineFlow(
  {
    name: "interviewPodcastScriptFlow",
    inputSchema: finalPodcastScriptInputSchema,
    outputSchema: finalPodcastScriptOutputSchema,
  },
  async (inputValues: z.infer<typeof finalPodcastScriptInputSchema>) => {
    const { summary, hooks, options } = inputValues;

    const speakerIntros = options.speakers.map((speaker: { name: string; background?: string }) => 
      speaker.background ? 
        `${speaker.name} (${speaker.background})` :
        `${speaker.name}`
    ).join(', ');

    const prompt = `
      Create an interview-style podcast script featuring these speakers:
      ${speakerIntros}

      ${options.intervieweeName ? 
        `The main interviewee is: ${options.intervieweeName}` :
        'Select the most relevant speaker as the interviewee based on the content.'}

      ${options.topic ?
        `The interview topic is: ${options.topic}` :
        'The interview topic should be inferred from the input content.'}

      The script should:
      - Include thoughtful questions and detailed responses
      - Use direct quotes and specific examples
      - Create natural conversation flow
      - Balance depth with accessibility
      - Returns valid JSON array (speaker + lines)
      ${options.rotatingInterviewers ?
        'Multiple interviewers should take turns asking questions.' :
        'The first listed host should be the primary interviewer.'}

      ${options.maxQuestions ?
        `Include approximately ${options.maxQuestions} main questions.` :
        'Include approximately 10 main questions in the interview.'}

      These scripts should be based on the following input sources (summarized below):
      ====== BEGIN SUMMARY ======
      ${summary}
      ====== END SUMMARY ======

      These are some conversational hooks that you can use for inspiration to develop the script:
      ====== BEGIN HOOKS ======
      ${hooks.join("\n")}
      ====== END HOOKS ======
    `;

    const scriptResponse = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: { temperature: 0.8 },
      output: { schema: finalPodcastScriptOutputSchema },
    });

    const script = scriptResponse.output?.script || [];
    return { script };
  }
);