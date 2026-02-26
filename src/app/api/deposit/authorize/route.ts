import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const DEPOSIT_AMOUNT = parseInt(process.env.STRIPE_DEPOSIT_AMOUNT || "300");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * 取引成立時にデポジット（Auth Hold）を作成
 * POST /api/deposit/authorize
 * Body: { tradeId: string, userId: string }
 */
export async function POST(request: NextRequest) {
    try {
        const stripe = getStripe();
        const { tradeId, userId } = await request.json();

        if (!tradeId || !userId) {
            return NextResponse.json({ error: "tradeId and userId are required" }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: DEPOSIT_AMOUNT,
            currency: "jpy",
            capture_method: "manual",
            metadata: {
                tradeId,
                userId,
                type: "gacha_trade_deposit",
            },
            description: `ガチャトレード取引デポジット（取引ID: ${tradeId}）`,
        });

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: trade } = await supabase
            .from("trades")
            .select("proposer_id, receiver_id")
            .eq("id", tradeId)
            .single();

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        const column = trade.proposer_id === userId
            ? "proposer_payment_intent_id"
            : "receiver_payment_intent_id";

        await supabase.from("trades").update({ [column]: paymentIntent.id }).eq("id", tradeId);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error("Deposit authorize error:", error);
        return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 });
    }
}
