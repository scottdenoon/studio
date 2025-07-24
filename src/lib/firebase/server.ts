import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Check if the app is already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      // This can happen in development environments with hot-reloading
      console.log('Firebase Admin already initialized.');
    } else {
      console.error('Firebase Admin initialization error:', error);
    }
  }
}

const db = getFirestore();

export { admin, db, Timestamp };
