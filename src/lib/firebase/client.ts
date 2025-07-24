
"use client"

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import getConfig from 'next/config';


// IMPORTANT: Your .env file must be populated with credentials prefixed with NEXT_PUBLIC_
const { publicRuntimeConfig } = getConfig();
const firebaseConfig = publicRuntimeConfig.firebaseConfig;

// It's better to throw an error here to catch missing configuration during development.
// In a production environment, these variables should be set in your hosting provider's settings.
if (!firebaseConfig?.apiKey) {
    throw new Error("Missing Firebase configuration. Make sure all NEXT_PUBLIC_FIREBASE_* environment variables are set and passed through next.config.js.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
