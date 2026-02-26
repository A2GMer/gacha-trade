import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * 取引完了時にデポジット（Auth Hold）を解放（課金なし）
 * POST /api/deposit/release
 * Body: { tradeId: string }
 */
export async function POST(request: NextRequest) {
    try {
        const stripe = getStripe();
        const { tradeId } = await request.json();
        if (!tradeId) {
            return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: trade } = await supabase
            .from("trades")
            .select("proposer_payment_intent_id, receiver_payment_intent_id")
            .eq("id", tradeId)
            .single();

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        const results: { id: string; status: string }[] = [];

        for (const piId of [trade.proposer_payment_intent_id, trade.receiver_payment_intent_id]) {
            if (piId) {
                try {
                    const pi = await stripe.paymentIntents.cancel(piId);
                    results.push({ id: piId, status: pi.status });
                } catch (e: any) {
                    results.push({ id: piId, status: `error: ${e.message}` });
                }
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Deposit release error:", error);
        return NextResponse.json({ error: "Failed to release deposit" }, { status: 500 });
    }
}
