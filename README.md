# Open-Source NotebookLM Sample 

Build your own NotebookLM-style application using this experimental project as a starting point. Powered by [Genkit](https://genkit.dev).

Here's an [example](https://github.com/genkit-ai/genkit-notebooklm/raw/refs/heads/main/synthesis_podcast_audio_expert-interview.mp3) - interview generated from an LLM research paper on L1 regularization.

## Quickstart
Here's how can you can quickly get started and see your first podcast uploaded to Cloud Storage:

1. **Enable Cloud Text-to-Speech API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your project
   - Navigate to "APIs & Services" > "Library" 
   - Search for "Cloud Text-to-Speech API"
   - Click "Enable". It should take you to the details page for this API.
   - Navigate to "Credentials" and click on "+ Create Credentials" > "Service Account".
   - Use "genkit-notebooklm" for the service account name, no roles, and click "Create & Continue". It should take you back to the API Details page.
   - Navigate to "Service Accounts" section of the page, click on the service account you just created, and click "Keys" > "Add Key" > "Create New Key".
   - Download the key in JSON format, and rename it "credentials.json". Put this JSON file in the `synthesis/` directory.


2. **Create a .env file**
```bash
vim synthesis/.env
```

3. **Get a Gemini API Key**
   - Create a new API Key or copy an existing one from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Paste it into the above .env file:
     
```bash
GOOGLE_API_KEY=xxxxx
```

5. **Run the test command**
```bash
cd synthesis
ts-node src/examples/llm-paper-summary/index.ts
```

6. **You can serve the synthesize() method as an Express server**
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

This sample is designed to be a starting point for developers, startups, and researchers looking to integrate AI-powered content synthesis into their applications without building everything from scratch.

## Usage
You can easily generate AI-powered podcasts from any text content by configuring the synthesis options. The system is flexible and can handle various podcast formats including:

1. One-on-one interviews
2. Multi-speaker roundtables 
3. Moderated panel discussions
4. And more...

To generate a podcast:

1. Create a podcast configuration object defining your desired format and speakers (see examples below)
2. Prepare your input sources. Each source can be either: gs:// URL (pdf only) OR the raw source text as a string).
3. Define your podcast configuration - this library gives you control over the final generated content format.
4. Call the synthesis method.

## Example podcast configurations

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

## OPTIONAL: Demo Web App & Firebase Integrations 
We bundled a demo web app that you can use to make your own, custom version of NotebookLM! To use it, you'll need to set up the following:

### Firebase Configurations
`synthesis/src/config.ts` has `USE_FIRESTORE` and `USE_STORAGE` configurations. 

1. `USE_FIRESTORE`: 
- If turned on, the synthesize() method will store job metadata inside Firestore. Information such as generated transcript, discussion hooks, etc. are included as metadata.
- The current podcast generation step is reported in the job metadata and updated while podcast generation is in progress. This helps you support frontends that show interactive status updates.

2. `USE_STORAGE`: 
- If turned on, the synthesize() method will upload the generated podcast to Cloud Storage. The specific location can be defined via the podcast options.
- If turned on, the server can also accept gs:// URLs as sources. If the files at those source bucket locations are either .pdf or .txt format, they will be included in the generated podcast.

### Web App
You can cd into `webapp/` folder. The easiest way to test it out is to run your Express server locally, and point the web app to the local URL. To do that you can follow these steps:

1. Update `webapp/config.ts` to include the correct `firebaseConfig` values from the Firebase Console.
2. Create a `webapp/.env` file and include BACKEND_HOST=localhost:3000 (or whatever port you've configured your Express server to run on).
