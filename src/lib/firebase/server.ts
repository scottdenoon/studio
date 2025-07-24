import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config();

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountKey) {
        const credentials = JSON.parse(
            Buffer.from(serviceAccountKey, 'base64').toString('ascii')
        );

        return admin.initializeApp({
            credential: admin.credential.cert(credentials),
        });
    }

    // Default initialization for managed environments like Firebase App Hosting
    // where credentials should be discovered automatically.
    return admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error);
    // If initialization fails, we might be in an unauthenticated server environment.
    // Instead of throwing, we return a null object or handle it gracefully
    // so the app doesn't crash on startup. However, subsequent DB calls will fail.
    // For this app, we will let it throw during startup to fail fast.
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

initializeFirebaseAdmin();

const db = getFirestore();

export { admin, db, Timestamp };
