"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { AlertTriangle, CheckCircle, RefreshCcw, XCircle, ChevronRight } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Link from "next/link";

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchDisputes = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("disputes")
            .select(`
                *,
                trades (id, status, proposer_id, receiver_id, proposer_payment_intent_id, receiver_payment_intent_id),
                profiles:reporter_id (display_name, email)
            `)
            .order("created_at", { ascending: false });

        if (data) setDisputes(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const handleStripeAction = async (disputeId: string, action: 'capture' | 'cancel', tradeData: any, targetUserId: string) => {
        if (!confirm(`本当にこのStripe処理（${action === 'capture' ? '没収・確定決済' : '返金・キャンセル'}）を実行しますか？`)) return;

        try {
            const isProposer = tradeData.proposer_id === targetUserId;
            const piId = isProposer ? tradeData.proposer_payment_intent_id : tradeData.receiver_payment_intent_id;

            if (!piId) {
                alert("指定されたユーザーのPaymentIntentIDが見つかりません。");
                return;
            }

            const endpoint = action === 'capture' ? '/api/stripe/capture' : '/api/stripe/cancel';

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentIntentId: piId,
                    tradeId: tradeData.id,
                    reason: "admin_decision_for_dispute"
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "処理に失敗しました");
            }

            alert("Stripe処理が完了しました。");
        } catch (error: any) {
            console.error("Stripe admin action failed:", error);
            alert(`エラー: ${error.message}`);
        }
    };

    const resolveDispute = async (id: string, tradeId: string) => {
        if (!confirm("このトラブル報告を「解決済み」にしますか？ 取引画面は再開されます。")) return;

        await supabase.from("disputes").update({ status: "RESOLVED" }).eq("id", id);
        // We might want to set the trade back to SHIPPED or COMPLETED, but for simplicity we will set back to SHIPPED.
        await supabase.from("trades").update({ status: "SHIPPED", updated_at: new Date().toISOString() }).eq("id", tradeId);

        fetchDisputes();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="text-danger" /> トラブル報告 (紛争)一覧
                </h1>
                <button onClick={fetchDisputes} className="btn bg-surface border border-border text-sm p-2 hover:bg-background">
                    <RefreshCcw className="h-4 w-4" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : disputes.length === 0 ? (
                <div className="text-center p-10 text-muted">トラブル報告はありません</div>
            ) : (
                <div className="space-y-4">
                    {disputes.map((d) => (
                        <div key={d.id} className={`card p-4 border-l-4 ${d.status === 'OPEN' ? 'border-danger' : 'border-success'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`badge ${d.status === 'OPEN' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'} text-xs font-bold`}>
                                        {d.status}
                                    </span>
                                    <span className="text-xs text-muted ml-2">{formatTime(d.created_at)}</span>
                                </div>
                                <Link href={`/trade/${d.trade_id}`} target="_blank" className="text-xs text-primary flex items-center hover:underline">
                                    取引画面(ログ)を確認 <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>

                            <p className="text-sm font-bold mt-2">報告者: {d.profiles?.display_name || "不明"} ({d.profiles?.email || "Email非公開"})</p>
                            <div className="bg-surface p-3 mt-2 rounded-lg text-sm border border-border whitespace-pre-wrap">
                                {d.reason}
                            </div>

                            {d.status === 'OPEN' && d.trades && (
                                <div className="mt-4 pt-4 border-t border-border border-dashed space-y-4">
                                    <div className="text-xs text-muted font-bold grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 p-3 bg-surface/50 rounded-lg">
                                            <p className="text-xs text-foreground font-bold">提案者 (Proposer) のデポジット</p>
                                            <p className="font-mono text-[10px] break-all">{d.trades.proposer_payment_intent_id || "未決済"}</p>
                                            {d.trades.proposer_payment_intent_id && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleStripeAction(d.id, 'cancel', d.trades, d.trades.proposer_id)} className="btn text-[10px] py-1 bg-success/10 text-success border border-success/20 flex-1"><CheckCircle className="h-3 w-3 mr-1" />返還(Cancel)</button>
                                                    <button onClick={() => handleStripeAction(d.id, 'capture', d.trades, d.trades.proposer_id)} className="btn text-[10px] py-1 bg-danger/10 text-danger border border-danger/20 flex-1"><XCircle className="h-3 w-3 mr-1" />没収(Capture)</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 p-3 bg-surface/50 rounded-lg">
                                            <p className="text-xs text-foreground font-bold">受取人 (Receiver) のデポジット</p>
                                            <p className="font-mono text-[10px] break-all">{d.trades.receiver_payment_intent_id || "未決済"}</p>
                                            {d.trades.receiver_payment_intent_id && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleStripeAction(d.id, 'cancel', d.trades, d.trades.receiver_id)} className="btn text-[10px] py-1 bg-success/10 text-success border border-success/20 flex-1"><CheckCircle className="h-3 w-3 mr-1" />返還(Cancel)</button>
                                                    <button onClick={() => handleStripeAction(d.id, 'capture', d.trades, d.trades.receiver_id)} className="btn text-[10px] py-1 bg-danger/10 text-danger border border-danger/20 flex-1"><XCircle className="h-3 w-3 mr-1" />没収(Capture)</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button onClick={() => resolveDispute(d.id, d.trade_id)} className="btn bg-background border border-border text-sm py-2 w-full mt-2">
                                        このトラブルを解決済みにする (返還/没収 処置完了後)
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
