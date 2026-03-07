import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
    createServiceRoleClient,
    getAuthenticatedUser,
    isAdminUser,
} from "@/lib/api-auth";

async function ensureAdminOrCron(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return { ok: true as const };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    const isAdmin = await isAdminUser(user.id);
    if (!isAdmin) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    return { ok: true as const };
}

export async function POST(request: NextRequest) {
    try {
        const auth = await ensureAdminOrCron(request);
        if (!auth.ok) {
            return auth.response;
        }

        const { tradeId, violatorId } = await request.json();
        if (!tradeId || !violatorId) {
            return NextResponse.json({ error: "tradeId and violatorId are required" }, { status: 400 });
        }

        const supabaseAdmin = createServiceRoleClient();
        const { data: trade, error: tradeError } = await supabaseAdmin
            .from("trades")
            .select("proposer_id, receiver_id, proposer_payment_intent_id, receiver_payment_intent_id")
            .eq("id", tradeId)
            .maybeSingle();

        if (tradeError) {
            console.error("Failed to load trade for capture:", tradeError);
            return NextResponse.json({ error: "Failed to load trade" }, { status: 500 });
        }

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        if (violatorId !== trade.proposer_id && violatorId !== trade.receiver_id) {
            return NextResponse.json({ error: "violatorId is not part of this trade" }, { status: 400 });
        }

        const piId =
            trade.proposer_id === violatorId
                ? trade.proposer_payment_intent_id
                : trade.receiver_payment_intent_id;

        const otherPiId =
            trade.proposer_id === violatorId
                ? trade.receiver_payment_intent_id
                : trade.proposer_payment_intent_id;

        const stripe = getStripe();
        const results: { action: string; id: string; status: string }[] = [];

        if (piId) {
            try {
                const captured = await stripe.paymentIntents.capture(piId);
                results.push({ action: "capture", id: piId, status: captured.status });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                results.push({ action: "capture", id: piId, status: `error: ${message}` });
            }
        }

        if (otherPiId) {
            try {
                const cancelled = await stripe.paymentIntents.cancel(otherPiId, {
                    cancellation_reason: "requested_by_customer",
                });
                results.push({ action: "release", id: otherPiId, status: cancelled.status });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                results.push({ action: "release", id: otherPiId, status: `error: ${message}` });
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
            console.error("Failed to clear payment intent ids after capture:", clearError);
        }
        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Deposit capture error:", error);
        return NextResponse.json({ error: "Failed to capture deposit" }, { status: 500 });
    }
}

