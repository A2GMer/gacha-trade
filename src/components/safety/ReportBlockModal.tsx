"use client";

import { useState } from "react";
import { AlertTriangle, Flag, Loader2, X, Ban, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

interface ReportBlockModalProps {
    targetType: "user" | "item" | "trade";
    targetId: string;
    targetName?: string;
    onClose: () => void;
}

const REPORT_REASONS = [
    { value: "fake_item", label: "偽物・虚偽の出品" },
    { value: "inappropriate", label: "不適切なコンテンツ" },
    { value: "scam", label: "詐欺・不正行為" },
    { value: "no_ship", label: "未発送" },
    { value: "wrong_item", label: "説明と異なる商品" },
    { value: "harassment", label: "嫌がらせ" },
    { value: "other", label: "その他" },
];

export function ReportBlockModal({ targetType, targetId, targetName, onClose }: ReportBlockModalProps) {
    const { user } = useAuth();
    const supabase = createClient();

    const [mode, setMode] = useState<"choose" | "report" | "block">("choose");
    const [reason, setReason] = useState("");
    const [detail, setDetail] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleReport = async () => {
        if (!user || !reason) return;
        setLoading(true);
        setError("");

        const { error: err } = await supabase.from("reports").insert({
            reporter_id: user.id,
            target_type: targetType,
            target_id: targetId,
            reason,
            detail: detail.trim() || null,
            status: "OPEN",
        });

        if (err) {
            setError("送信に失敗しました");
        } else {
            setDone(true);
        }
        setLoading(false);
    };

    const handleBlock = async () => {
        if (!user) return;
        setLoading(true);
        setError("");

        const { error: err } = await supabase.from("blocks").insert({
            blocker_id: user.id,
            blocked_id: targetId,
        });

        if (err) {
            if (err.code === "23505") {
                setError("既にブロック済みです");
            } else {
                setError("ブロックに失敗しました");
            }
        } else {
            setDone(true);
        }
        setLoading(false);
    };

    const typeLabel = targetType === "user" ? "ユーザー" : targetType === "item" ? "アイテム" : "取引";

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-md animate-fade-in-up">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h2 className="font-bold text-sm">
                        {done ? "完了" : mode === "choose" ? `${typeLabel}を報告` : mode === "report" ? "通報する" : "ブロックする"}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-background rounded-lg"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-4 space-y-4">
                    {done ? (
                        <div className="text-center py-4 space-y-3 animate-bounce-in">
                            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="h-7 w-7 text-success" />
                            </div>
                            <p className="text-sm font-bold">
                                {mode === "report" ? "通報を受け付けました" : "ブロックしました"}
                            </p>
                            <p className="text-xs text-muted">
                                {mode === "report" ? "運営チームが確認いたします" : "このユーザーからの提案はブロックされます"}
                            </p>
                            <button onClick={onClose} className="btn btn-primary w-full py-3">閉じる</button>
                        </div>
                    ) : mode === "choose" ? (
                        <>
                            {targetName && (
                                <p className="text-xs text-muted">対象: <span className="font-bold text-foreground">{targetName}</span></p>
                            )}
                            <button
                                onClick={() => setMode("report")}
                                className="w-full card p-4 flex items-center gap-3 hover:bg-background transition-colors text-left"
                            >
                                <div className="p-2 rounded-xl bg-warning/10">
                                    <Flag className="h-5 w-5 text-warning" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">通報する</p>
                                    <p className="text-[10px] text-muted">不正・違反行為を運営に報告</p>
                                </div>
                            </button>
                            {targetType === "user" && (
                                <button
                                    onClick={() => setMode("block")}
                                    className="w-full card p-4 flex items-center gap-3 hover:bg-background transition-colors text-left"
                                >
                                    <div className="p-2 rounded-xl bg-danger/10">
                                        <Ban className="h-5 w-5 text-danger" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">ブロックする</p>
                                        <p className="text-[10px] text-muted">このユーザーからの提案を拒否</p>
                                    </div>
                                </button>
                            )}
                        </>
                    ) : mode === "report" ? (
                        <>
                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">通報理由</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">選択してください</option>
                                    {REPORT_REASONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">詳細（任意）</label>
                                <textarea
                                    value={detail}
                                    onChange={(e) => setDetail(e.target.value)}
                                    placeholder="具体的な状況を教えてください"
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                            {error && <p className="text-xs text-danger font-bold">{error}</p>}
                            <button
                                onClick={handleReport}
                                disabled={loading || !reason}
                                className="btn bg-warning text-white hover:bg-warning/90 w-full py-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Flag className="h-4 w-4" /> 通報を送信</>}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="bg-danger/5 rounded-2xl p-4">
                                <p className="text-sm font-bold text-danger flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4" /> ブロックの確認
                                </p>
                                <p className="text-xs text-muted mt-1">
                                    このユーザーをブロックすると、相手からの交換提案を受け取れなくなります。進行中の取引はそのまま継続されます。
                                </p>
                            </div>
                            {error && <p className="text-xs text-danger font-bold">{error}</p>}
                            <div className="flex gap-2">
                                <button onClick={() => setMode("choose")} className="btn btn-outline flex-1 py-3">戻る</button>
                                <button
                                    onClick={handleBlock}
                                    disabled={loading}
                                    className="btn bg-danger text-white hover:bg-danger/90 flex-1 py-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Ban className="h-4 w-4" /> ブロックする</>}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
