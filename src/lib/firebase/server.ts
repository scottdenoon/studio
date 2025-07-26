
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import Stripe from 'stripe';

// In the App Hosting environment, the Admin SDK is automatically initialized
// with the correct credentials. No explicit configuration is needed.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
    typescript: true,
});


export { admin, db, Timestamp };
