import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  // This is the standard way to initialize in a managed environment like App Hosting.
  // It will automatically use the service account associated with the backend.
  return admin.initializeApp();
}

initializeFirebaseAdmin();

const db = getFirestore();

export { admin, db, Timestamp };
