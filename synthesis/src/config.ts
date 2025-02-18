import * as admin from 'firebase-admin';
import textToSpeech, { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { gemini15Flash } from "@genkit-ai/googleai";
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export const USE_CLOUD_STORAGE = true;
export const USE_FIRESTORE = true;

let db: admin.firestore.Firestore | null;
let firebaseAdmin: admin.app.App | null;
let storage: admin.storage.Storage | null;
let authConfig: admin.AppOptions;

if (process.env.NODE_ENV === 'production') {
  authConfig = {
    credential: admin.credential.applicationDefault()
  };
} else {
  const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf-8'));
  authConfig = {
    credential: admin.credential.cert(credentials)
  };
}

if (USE_CLOUD_STORAGE || USE_FIRESTORE) {
  if (!admin.apps.length) {
    admin.initializeApp(authConfig);
  }
  firebaseAdmin = admin.app();
} else {
  firebaseAdmin = null;
}

if (USE_CLOUD_STORAGE && !!firebaseAdmin) {
  storage = firebaseAdmin.storage();
} else {
  storage = null;
}

if (USE_FIRESTORE && !!firebaseAdmin) {
  db = firebaseAdmin.firestore();
} else {
  db = null;
}

let ttsCredentials;
let tts: TextToSpeechClient;

if (process.env.NODE_ENV === 'production') {
  tts = new textToSpeech.TextToSpeechClient();
} else {
  ttsCredentials = JSON.parse(fs.readFileSync('credentials.json', 'utf-8'));
  tts = new textToSpeech.TextToSpeechClient({
    credentials: ttsCredentials
  });
}

export const JOBS_COLLECTION = "jobs";

export { firebaseAdmin, storage, db, tts };

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});
