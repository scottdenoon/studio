
'use server'
import { headers } from 'next/headers'
import { createOrRetrieveCustomer, createCheckoutSession } from '@/services/stripe'
import { auth } from '@/lib/firebase/client';

export async function POST(req: Request) {
    const { priceId } = await req.json();

    const user = auth.currentUser;
    if (!user) {
        return new Response(JSON.stringify({ error: 'User must be logged in to subscribe.' }), { status: 401 });
    }

    try {
        const customerId = await createOrRetrieveCustomer({
            userId: user.uid,
            email: user.email!,
        });

        const origin = headers().get('origin') || 'http://localhost:3000';
        const session = await createCheckoutSession({
            customerId,
            priceId,
            successUrl: `${origin}/`,
            cancelUrl: `${origin}/pricing`,
        });

        return new Response(JSON.stringify({ sessionId: session.id }), { status: 200 });

    } catch (err: any) {
        console.error("Error creating checkout session:", err);
        return new Response(JSON.stringify({ error: 'Could not create checkout session.' }), { status: 500 });
    }
}
