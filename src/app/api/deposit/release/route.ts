import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
    createServiceRoleClient,
    getAuthenticatedUser,
    isAdminUser,
} from "@/lib/api-auth";

export async function POST(request: NextRequest) {
    try {
        const { tradeId } = await request.json();
        if (!tradeId) {
            return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
        }

        const cronSecret = process.env.CRON_SECRET;
        const authHeader = request.headers.get("authorization");
        const hasCronAuth = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

        const user = hasCronAuth ? null : await getAuthenticatedUser();
        if (!hasCronAuth && !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = createServiceRoleClient();
        const { data: trade, error: tradeError } = await supabaseAdmin
            .from("trades")
            .select(
                "proposer_id, receiver_id, proposer_payment_intent_id, receiver_payment_intent_id"
            )
            .eq("id", tradeId)
            .maybeSingle();

        if (tradeError) {
            console.error("Failed to load trade for release:", tradeError);
            return NextResponse.json({ error: "Failed to load trade" }, { status: 500 });
        }

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        if (!hasCronAuth && user) {
            const isParticipant =
                trade.proposer_id === user.id || trade.receiver_id === user.id;
            if (!isParticipant) {
                const isAdmin = await isAdminUser(user.id);
                if (!isAdmin) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }
            }
        }

        const stripe = getStripe();
        const results: { id: string; status: string }[] = [];

        for (const piId of [
            trade.proposer_payment_intent_id,
            trade.receiver_payment_intent_id,
        ]) {
            if (!piId) {
                continue;
            }

            try {
                const pi = await stripe.paymentIntents.cancel(piId, {
                    cancellation_reason: "requested_by_customer",
                });
                results.push({ id: piId, status: pi.status });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                results.push({ id: piId, status: `error: ${message}` });
            }
        }

        const { error: clearError } = await supabaseAdmin
            .from("trades")
            .update({
                proposer_payment_intent_id: null,
                receiver_payment_intent_id: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", tradeId);

        if (clearError) {
            console.error("Failed to clear payment intent ids:", clearError);
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Deposit release error:", error);
        return NextResponse.json({ error: "Failed to release deposit" }, { status: 500 });
    }
}
