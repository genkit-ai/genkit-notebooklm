import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';
import { synthesize } from '../../synthesis';
import { InterviewPodcastOptions, SynthesisRequest } from '../../schemas/podcast';

const dataBuffer = fs.readFileSync(path.join(__dirname, 'regularization.pdf'));

async function getPdfText() {
  const data = await pdf(dataBuffer);
  return data.text;
}

async function loadInput() {
  const sourceText = await getPdfText();
  return sourceText;
}

async function main() {
  const inputText = await loadInput();
  const expertInterviewConfig: InterviewPodcastOptions = {
    format: "interview",
    title: "expert-interview",
    speakers: [
      { 
        name: "Dr. James Wilson", 
        voiceId: "en-US-Journey-D",
        background: "AI Research Lead at Stanford" 
      },
      { 
        name: "Sarah Chen", 
        voiceId: "en-US-Journey-F",
        background: "Senior Tech Journalist at TechReview" 
      }
    ],
    intervieweeName: "Dr. James Wilson",
    topic: "Latest Breakthroughs in AI Research",
    maxQuestions: 8,
    bucketName: "smarthome-d6e27.firebasestorage.app",
    transcriptStorage: "transcripts",
    audioStorage: "audio"
  }; 
  const req: SynthesisRequest = {
    jobId: 'llm-paper-summary',
    input: inputText,
    output: [{type: "podcast", options: expertInterviewConfig}]
  }
  const result = await synthesize(req);
  console.log(result);
}

main();


