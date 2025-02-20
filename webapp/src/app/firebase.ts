import { initializeApp, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import dotenv from 'dotenv';

dotenv.config();

// Replace with your own configuration
const firebaseConfig = {
  apiKey: "xxxxx",
  authDomain: "xxxxx.firebaseapp.com", 
  projectId: "xxxxx",
  storageBucket: "xxxxx.firebasestorage.app",
  messagingSenderId: "xxxxx",
  appId: "xxxxx"
};

export const bucketName = firebaseConfig.storageBucket;
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(getApp());

if (process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}