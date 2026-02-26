import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * 発送期限超過チェック Cron
 * GET /api/cron/check-shipment-deadline
 * Vercel Cron: 毎日1回実行
 * { "crons": [{ "path": "/api/cron/check-shipment-deadline", "schedule": "0 9 * * *" }] }
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 発送期限超過の取引を検索
    const { data: overdueTrades } = await supabase
        .from("trades")
        .select("id, proposer_id, receiver_id, proposer_shipped, receiver_shipped, shipment_deadline")
        .in("status", ["ACCEPTED", "SHIPPED"])
        .lt("shipment_deadline", new Date().toISOString())
        .not("shipment_deadline", "is", null);

    if (!overdueTrades || overdueTrades.length === 0) {
        return NextResponse.json({ checked: 0, actions: [] });
    }

    const actions: { tradeId: string; action: string; violatorId: string }[] = [];

    for (const trade of overdueTrades) {
        const violators: string[] = [];

        if (!trade.proposer_shipped) violators.push(trade.proposer_id);
        if (!trade.receiver_shipped) violators.push(trade.receiver_id);

        if (violators.length === 0) continue;

        for (const violatorId of violators) {
            // デポジットキャプチャ
            try {
                await fetch(new URL("/api/deposit/capture", request.url).toString(), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cronSecret}`,
                    },
                    body: JSON.stringify({ tradeId: trade.id, violatorId }),
                });
                actions.push({ tradeId: trade.id, action: "captured", violatorId });
            } catch (e) {
                actions.push({ tradeId: trade.id, action: "error", violatorId });
            }
        }

        // 紛争ステータスへ変更
        await supabase
            .from("trades")
            .update({ status: "DISPUTE", updated_at: new Date().toISOString() })
            .eq("id", trade.id);

        // 紛争レコード作成
        for (const violatorId of violators) {
            const nonViolatorId = violatorId === trade.proposer_id ? trade.receiver_id : trade.proposer_id;
            await supabase.from("disputes").insert({
                trade_id: trade.id,
                reporter_id: nonViolatorId,
                reason: `発送期限超過（期限: ${trade.shipment_deadline}）`,
                status: "OPEN",
            });
        }
    }

    return NextResponse.json({
        checked: overdueTrades.length,
        actions,
        timestamp: new Date().toISOString(),
    });
}
