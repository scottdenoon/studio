import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Check if the app is already initialized to prevent errors in development environments with hot-reloading.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
    // In a managed environment, this should not fail.
    // Logging the error for debugging purposes.
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = getFirestore();

export { admin, db, Timestamp };
