import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, validateCronRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
    const cronAuth = validateCronRequest(request);
    if (!cronAuth.ok) {
        return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
    }

    try {
        const supabaseAdmin = createServiceRoleClient();

        const { data: overdueTrades, error: overdueError } = await supabaseAdmin
            .from("trades")
            .select(
                "id, proposer_id, receiver_id, proposer_shipped, receiver_shipped, shipment_deadline"
            )
            .in("status", ["ACCEPTED", "SHIPPED"])
            .lt("shipment_deadline", new Date().toISOString())
            .not("shipment_deadline", "is", null);

        if (overdueError) {
            console.error("Failed to fetch overdue trades:", overdueError);
            return NextResponse.json({ error: "Failed to fetch overdue trades" }, { status: 500 });
        }

        if (!overdueTrades || overdueTrades.length === 0) {
            return NextResponse.json({ checked: 0, actions: [] });
        }

        const actions: { tradeId: string; action: string; violatorId: string }[] = [];
        const authHeader = request.headers.get("authorization") || "";

        for (const trade of overdueTrades) {
            const violators: string[] = [];

            if (!trade.proposer_shipped) {
                violators.push(trade.proposer_id);
            }
            if (!trade.receiver_shipped) {
                violators.push(trade.receiver_id);
            }

            if (violators.length === 0) {
                continue;
            }

            for (const violatorId of violators) {
                try {
                    const captureRes = await fetch(
                        new URL("/api/deposit/capture", request.url).toString(),
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: authHeader,
                            },
                            body: JSON.stringify({ tradeId: trade.id, violatorId }),
                        }
                    );

                    if (!captureRes.ok) {
                        actions.push({ tradeId: trade.id, action: "capture_failed", violatorId });
                    } else {
                        actions.push({ tradeId: trade.id, action: "captured", violatorId });
                    }
                } catch (error) {
                    console.error("Failed to call /api/deposit/capture:", error);
                    actions.push({ tradeId: trade.id, action: "capture_failed", violatorId });
                }
            }

            await supabaseAdmin
                .from("trades")
                .update({ status: "DISPUTE", updated_at: new Date().toISOString() })
                .eq("id", trade.id);

            for (const violatorId of violators) {
                const nonViolatorId =
                    violatorId === trade.proposer_id ? trade.receiver_id : trade.proposer_id;

                await supabaseAdmin.from("disputes").insert({
                    trade_id: trade.id,
                    reporter_id: nonViolatorId,
                    reason: `Shipment deadline passed (${trade.shipment_deadline})`,
                    status: "OPEN",
                });
            }
        }

        return NextResponse.json({
            checked: overdueTrades.length,
            actions,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Cron check-shipment-deadline error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
