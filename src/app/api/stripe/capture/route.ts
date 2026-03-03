import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe (requires secret key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2026-02-25.clover",
});

// Using Service Role Key to bypass RLS for admin actions
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function POST(req: NextRequest) {
    try {
        const { paymentIntentId, tradeId, reason } = await req.json();

        if (!paymentIntentId || !tradeId) {
            return NextResponse.json(
                { error: "paymentIntentId and tradeId are required." },
                { status: 400 }
            );
        }

        // 1. Capture the payment intent
        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

        // 2. Record the capture in the database for auditing
        // In a real production app, we should probably record this in an audit log / transaction table.
        // For now, logging will suffice.
        console.log(`Captured payment intent ${paymentIntentId} for trade ${tradeId}. Reason: ${reason}`);

        return NextResponse.json({ success: true, paymentIntent });
    } catch (error: any) {
        console.error("Error capturing payment intent:", error);
        return NextResponse.json(
            { error: error.message || "Failed to capture payment intent" },
            { status: 500 }
        );
    }
}
