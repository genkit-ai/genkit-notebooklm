# Open-Source NotebookLM Sample 

Build your own NotebookLM-style application using this sample as a starting point. Powered by [Genkit](https://genkit.dev).

Here's an [example](https://github.com/genkit-ai/genkit-notebooklm/raw/refs/heads/main/synthesis_podcast_audio_expert-interview.mp3) - interview generated from an LLM research paper on L1 regularization.


## Prerequisites
Before getting started, you'll need:

1. **Enable Cloud Text-to-Speech API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your project
   - Navigate to "APIs & Services" > "Library" 
   - Search for "Cloud Text-to-Speech API"
   - Click "Enable"

2. **Get a Makersuite API Key**
   - Visit [Google AI Studio](https://makersuite.google.com)
   - Click "Get API Key" in the top right
   - Create a new API key or use an existing one
   - Copy the API key - you'll need this for the `.env` file
3. **Firebase Project (OPTIONAL)**
   - Comes batteries included - easily store generated podcast metadata in Firestore and Cloud Storage (however, is fully optional)
   - A Firebase project with Blaze (pay-as-you-go) plan enabled
   - Firebase CLI installed (`npm install -g firebase-tools`)
   - Logged in to Firebase (`firebase login`)
   - Enable Firestore Database in your Firebase Console
   - Enable Cloud Storage in your Firebase Console

## Quickstart
Here's how can you can quickly get started and see your first podcast uploaded to Cloud Storage:

1. Create a .env file:
```bash
vim synthesis/.env
```

2. Grab your API Key from makersuite.google.com, and paste it in the .env:
```bash
GOOGLE_API_KEY=xxxxx
```

3. Go to Firebase Console, navigate to Project Settings > Service Accounts, click "Generate New Private Key" to download your admin SDK credentials as a JSON file. Save this file as `credentials.json` in your `synthesis/` directory.

4. Run the test command:
```bash
cd synthesis
ts-node src/examples/llm-paper-summary/index.ts
```

5. You can serve the synthesize() method as an Express server:
```bash
cd synthesis
ts-node src/server.ts
```

## What's Included?  
- **AI-powered synthesis utilities** – Out-of-the-box utilities for converting diverse input sources (PDFs, text, and more coming soon) into structured, consumable audio formats like roundtable discussions, formal debates, and expert interviews. This codebase is meant to be used as a starting point for your own customizable pipelines.
- **Serverless backend (Cloud Run)** – Built to deploy on Cloud Run, so you can easily spin up a Serverless API that your frontends can consume.
- **Next.js boilerplate UI** – So that you can build your own NotebookLM-inspired experience. Easily deployable to Firebase App Hosting.

Get started quickly, customize as needed, and bring AI-powered research synthesis to your own applications.  

## Who is This For?  

This starter kit is designed for developers, startups, and researchers looking to integrate AI-powered content synthesis into their applications without building everything from scratch.  

## Usage
You can easily generate AI-powered podcasts from any text content by configuring the synthesis options. The system is flexible and can handle various podcast formats including:

1. One-on-one interviews
2. Multi-speaker roundtables 
3. Moderated panel discussions
4. And more...

To generate a podcast:

1. Create a podcast configuration object defining your desired format and speakers (see examples below)
2. Prepare your input text (can be a PDF, string, or array of strings)
3. Call the synthesis function:

```
// Roundtable podcast
// Custom speakers with specified TTS voices
// Includes a moderator
export const simpleRoundtableConfig = {
  format: "roundtable",
  title: "ai-trends-roundtable",
  speakers: [
    {
      name: "Dr. Sarah Chen",
      voiceId: "en-US-Neural2-F",
      background: "AI Researcher"
    },
    {
      name: "Mark Thompson",
      voiceId: "en-US-Neural2-D",
      background: "Tech Journalist"
    },
    {
      name: "Lisa Wong",
      voiceId: "en-US-Journey-F",
      background: "AI Ethics Expert"
    }
  ],
  moderator: {
    name: "Michael Brooks",
    voiceId: "en-US-Journey-D",
    style: "facilitating"
  },
  discussionStyle: "expert_panel",
  structure: "moderated_topics",
  bucketName: "your-storage-bucket.firebasestorage.app",
  transcriptStorage: "transcripts",
  audioStorage: "audio"
};
```

This example configures a roundtable discussion with multiple speakers, a moderator, and storage settings.

Here's an interview format example:

```
// Interview podcast
// Tech reporter interviewing an AI Reseracher
export const simpleInterviewConfig = {
  format: "interview",
  title: "ai-expert-interview",
  speakers: [
    {
      name: "Dr. James Wilson",
      voiceId: "en-US-Neural2-D",
      background: "AI Research Director"
    },
    {
      name: "Emily Parker",
      voiceId: "en-US-Journey-F",
      background: "Tech Reporter"
    }
  ],
  interviewStyle: "freeform",
  intervieweeName: "Dr. James Wilson",
  topic: "Future of AI Technology",
  maxQuestions: 5,
  bucketName: "your-storage-bucke.firebasestorage.app",
  transcriptStorage: "transcripts",
  audioStorage: "audio"
};
```
This example shows an interview format where a tech reporter interviews an AI researcher.

Here's a debate format example that structures a discussion between experts with opposing views:

```
export const ethicalDebateConfig = {
  format: "debate",
  title: "ethical-debate",
  speakers: [
    { 
      name: "Professor Smith", 
      voiceId: "en-US-Journey-D",
      background: "AI Safety Expert at Oxford" 
    },
    { 
      name: "Dr. Zhang", 
      voiceId: "en-US-Neural2-D",
      background: "AI Development Lead at OpenAI" 
    }
  ],
  debateTopic: "AI Safety vs Innovation Speed",
  debateStructure: "formal",
  numRounds: 3,
  moderator: {
    name: "Rachel Adams",
    voiceId: "en-US-Journey-F",
    style: "neutral",
    openingRemarks: true,
    closingRemarks: true
  },
  sides: [
    {
      sideName: "Safety First",
      speakers: ["Professor Smith"],
      keyPoints: [
        "We must implement rigorous testing protocols before deploying AI systems",
        "AI alignment and value learning need to be solved before scaling capabilities",
        "Historical examples show rushing technology leads to unintended consequences"
      ]
    },
    {
      sideName: "Innovation Priority", 
      speakers: ["Dr. Zhang"],
      keyPoints: [
        "Slowing AI progress cedes ground to less responsible actors",
        "AI can solve urgent challenges in healthcare, climate change, and poverty",
        "Robust AI development processes already exist - we need execution not delay"
      ]
    }
  ],
  bucketName: "your-storage-bucket.firebasestorage.app",
  transcriptStorage: "transcripts",
  audioStorage: "audio"
}; 
```
> **Note**: For detailed configuration schemas and options for each podcast format, see the TypeScript interfaces in `src/schemas/*.ts`
