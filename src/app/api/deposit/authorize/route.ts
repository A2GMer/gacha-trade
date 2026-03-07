import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient, getAuthenticatedUser, validateSameOrigin } from "@/lib/api-auth";

const DEPOSIT_AMOUNT = parseInt(process.env.STRIPE_DEPOSIT_AMOUNT || "300", 10);

export async function POST(request: NextRequest) {
    try {
        const originCheck = validateSameOrigin(request);
        if (!originCheck.ok) {
            return NextResponse.json({ error: originCheck.error }, { status: originCheck.status });
        }

        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tradeId } = await request.json();
        if (!tradeId || typeof tradeId !== "string") {
            return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
        }

        const supabaseAdmin = createServiceRoleClient();
        const { data: trade, error: tradeError } = await supabaseAdmin
            .from("trades")
            .select("id, status, proposer_id, receiver_id, proposer_payment_intent_id, receiver_payment_intent_id")
            .eq("id", tradeId)
            .maybeSingle();

        if (tradeError) {
            console.error("Failed to load trade for deposit authorization:", tradeError);
            return NextResponse.json({ error: "Failed to load trade" }, { status: 500 });
        }

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        const isProposer = trade.proposer_id === user.id;
        const isReceiver = trade.receiver_id === user.id;
        if (!isProposer && !isReceiver) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!["PROPOSED", "ACCEPTED"].includes(trade.status)) {
            return NextResponse.json({ error: "Trade is not in an authorizable status" }, { status: 409 });
        }

        const existingIntentId = isProposer
            ? trade.proposer_payment_intent_id
            : trade.receiver_payment_intent_id;

        if (existingIntentId) {
            return NextResponse.json({ error: "Deposit already authorized" }, { status: 409 });
        }

        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: DEPOSIT_AMOUNT,
            currency: "jpy",
            capture_method: "manual",
            metadata: {
                tradeId,
                userId: user.id,
                type: "gacha_trade_deposit",
            },
            description: `Gacha trade deposit (tradeId: ${tradeId})`,
        });

        const column = isProposer
            ? "proposer_payment_intent_id"
            : "receiver_payment_intent_id";

        const { error: updateError } = await supabaseAdmin
            .from("trades")
            .update({
                [column]: paymentIntent.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", tradeId);

        if (updateError) {
            console.error("Failed to persist payment intent:", updateError);
            try {
                await stripe.paymentIntents.cancel(paymentIntent.id, {
                    cancellation_reason: "abandoned",
                });
            } catch (cancelError) {
                console.error("Failed to rollback payment intent:", cancelError);
            }
            return NextResponse.json({ error: "Failed to save deposit authorization" }, { status: 500 });
        }

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error("Deposit authorize error:", error);
        return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 });
    }
}
