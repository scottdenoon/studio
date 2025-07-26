
'use server'
import { stripe } from '@/lib/firebase/server'
import { updateUserRole } from '@/services/firestore'
import { logActivity } from '@/services/logging'
import { headers } from 'next/headers'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = req.headers.get('Stripe-Signature') as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Stripe webhook signature error: ${err.message}`)
        await logActivity("ERROR", "Stripe webhook signature validation failed", { error: err.message });
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const session = event.data.object as any;

    try {
        if (event.type === 'checkout.session.completed') {
            const customerId = session.customer;
            if (!customerId) {
                throw new Error("Missing customer ID in checkout session.")
            }
            // Find user in your DB by stripe_customer_id
            await updateUserRole(customerId, 'premium');
            await logActivity("INFO", "User upgraded to premium via Stripe", { customerId });
        }
    } catch (err: any) {
        await logActivity("ERROR", "Stripe webhook processing error", { error: err.message, eventType: event.type });
        return new Response(JSON.stringify({ error: 'Webhook processing failed.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
}
