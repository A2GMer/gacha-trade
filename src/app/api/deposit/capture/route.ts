import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * 未発送者のデポジットをキャプチャ（実課金）
 * POST /api/deposit/capture
 * Body: { tradeId: string, violatorId: string }
 */
export async function POST(request: NextRequest) {
    try {
        const stripe = getStripe();
        const { tradeId, violatorId } = await request.json();
        if (!tradeId || !violatorId) {
            return NextResponse.json({ error: "tradeId and violatorId are required" }, { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: trade } = await supabase
            .from("trades")
            .select("proposer_id, receiver_id, proposer_payment_intent_id, receiver_payment_intent_id")
            .eq("id", tradeId)
            .single();

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        const piId = trade.proposer_id === violatorId
            ? trade.proposer_payment_intent_id
            : trade.receiver_payment_intent_id;

        const otherPiId = trade.proposer_id === violatorId
            ? trade.receiver_payment_intent_id
            : trade.proposer_payment_intent_id;

        const results: { action: string; id: string; status: string }[] = [];

        if (piId) {
            try {
                const captured = await stripe.paymentIntents.capture(piId);
                results.push({ action: "capture", id: piId, status: captured.status });
            } catch (e: any) {
                results.push({ action: "capture", id: piId, status: `error: ${e.message}` });
            }
        }

        if (otherPiId) {
            try {
                const cancelled = await stripe.paymentIntents.cancel(otherPiId);
                results.push({ action: "release", id: otherPiId, status: cancelled.status });
            } catch (e: any) {
                results.push({ action: "release", id: otherPiId, status: `error: ${e.message}` });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Deposit capture error:", error);
        return NextResponse.json({ error: "Failed to capture deposit" }, { status: 500 });
    }
}
