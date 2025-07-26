// src/services/stripe.ts

// REMOVE THIS LINE: import { stripe } from '@/lib/firebase/server'
// Keep the db import if you use db in this file, otherwise remove it too.
import { db, stripe } from '@/lib/firebase/server' // Keep this if you use 'db' below

// --- Customer Management ---
export async function createOrRetrieveCustomer({ userId, email }: { userId: string, email: string }): Promise<string> {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists && userDoc.data()?.stripeCustomerId) {
        return userDoc.data()!.stripeCustomerId;
    }

    const newCustomer = await stripe.customers.create({ email });
    await userRef.update({ stripeCustomerId: newCustomer.id });
    
    return newCustomer.id;
}

// --- Checkout Session ---
export async function createCheckoutSession({ customerId, priceId, successUrl, cancelUrl }: {
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
}): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
            price: priceId,
            quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
    });
}
