
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const serviceAccount = process.env.SERVICE_ACCOUNT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    // Explicitly pass the service account ID for authentication.
    // This is read from the `serviceAccount` field in apphosting.yaml.
    credential: serviceAccount ? admin.credential.applicationDefault() : undefined,
    serviceAccountId: serviceAccount,
  });
}

const db = getFirestore();

export { admin, db, Timestamp };
