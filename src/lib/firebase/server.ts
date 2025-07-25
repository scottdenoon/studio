
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// In the App Hosting environment, the Admin SDK is automatically initialized
// with the correct credentials. No explicit configuration is needed.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export { admin, db, Timestamp };
