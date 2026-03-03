import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe (requires secret key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
    try {
        const { paymentIntentId, tradeId, reason } = await req.json();

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: "paymentIntentId is required." },
                { status: 400 }
            );
        }

        // 1. Retrieve the payment intent to check its status
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (pi.status === "requires_capture") {
            // 2. Cancel the payment intent to release the authorization hold
            const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
                cancellation_reason: reason || "requested_by_customer"
            });
            console.log(`Canceled payment intent ${paymentIntentId} for trade ${tradeId}. Reason: ${reason}`);
            return NextResponse.json({ success: true, paymentIntent: canceledIntent });
        } else if (pi.status === "canceled") {
            // Already canceled, treat as success
            return NextResponse.json({ success: true, paymentIntent: pi, note: "Already canceled" });
        } else {
            console.warn(`Attempted to cancel payment intent ${paymentIntentId}, but status is ${pi.status}`);
            return NextResponse.json(
                { error: `Cannot cancel payment intent in status: ${pi.status}` },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error("Error canceling payment intent:", error);
        return NextResponse.json(
            { error: error.message || "Failed to cancel payment intent" },
            { status: 500 }
        );
    }
}
