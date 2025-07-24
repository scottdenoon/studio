
'use server';

import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export { admin, db, Timestamp };
