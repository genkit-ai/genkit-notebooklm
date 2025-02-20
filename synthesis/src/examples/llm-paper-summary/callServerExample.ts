import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';
import axios from 'axios';

const dataBuffer = fs.readFileSync(path.join(__dirname, 'regularization.pdf'));

async function getPdfText() {
  const data = await pdf(dataBuffer);
  return data.text;
}

async function loadInput() {
  const sourceText = await getPdfText();
  return sourceText;
}

const url = "localhost:3000/api/synthesis";
//const url = "https://<CLOUD_RUN_URL>/api/synthesis";

async function main() {
  const inputText = await loadInput();
  const expertInterviewConfig = {
    format: "interview",
    title: "expert-interview",
    speakers: [
      { 
        name: "Dr. Mahsa Taheri", 
        voiceId: "en-US-Journey-D",
        background: "AI Researcher at University of Hamburg" 
      },
      { 
        name: "Sarah Chen", 
        voiceId: "en-US-Journey-F",
        background: "Senior Tech Journalist at TechReview" 
      }
    ],
    intervieweeName: "Dr. Mahsa Taheri",
    topic: "L1 Regularization Breakthroughs",
    maxQuestions: 24,
    bucketName: "xxxx.firebasestorage.app",
    transcriptStorage: "transcripts",
    audioStorage: "audio"
  }; 
  const req = {
    jobId: 'llm-paper-summary',
    input: inputText,
    output: [{type: "podcast", options: expertInterviewConfig}]
  };

  try {
    const response = await axios.post(url, req, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
