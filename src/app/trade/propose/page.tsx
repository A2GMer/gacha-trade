"use client";

import { useState, useEffect, Suspense } from "react";
import { ChevronLeft, ArrowRightLeft, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { getProfileDisplayName, DisplayNameProfile } from "@/lib/profile";

interface ItemInfo {
    id: string;
    images: string[];
    condition: string;
    catalog_items: { name: string; series: string; manufacturer: string };
    profiles: { display_name: string; x_username: string | null; display_name_source: "manual" | "twitter" };
}

function ProposeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetItemId = searchParams.get("itemId");
    const { user } = useAuth();
    const supabase = createClient();

    const [targetItem, setTargetItem] = useState<ItemInfo | null>(null);
    const [myItems, setMyItems] = useState<ItemInfo[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user || !targetItemId) return;

        async function fetchData() {
            // 相手のアイテムを取得
            const { data: target } = await supabase
                .from("user_items")
                .select(`id, images, condition, catalog_items (name, series, manufacturer), profiles:owner_id (display_name, x_username, display_name_source)`)
                .eq("id", targetItemId)
                .single();

            if (target) setTargetItem(target as unknown as ItemInfo);

            // 自分の交換可能アイテムを取得
            const { data: mine } = await supabase
                .from("user_items")
                .select(`id, images, condition, catalog_items (name, series, manufacturer), profiles:owner_id (display_name, x_username, display_name_source)`)
                .eq("owner_id", user!.id)
                .eq("is_tradeable", true);

            if (mine) setMyItems(mine as unknown as ItemInfo[]);
            setLoading(false);
        }
        fetchData();
    }, [user, targetItemId, supabase]);

    const handleSubmit = async () => {
        if (!selectedItemId || !targetItem || !user) {
            setError("交換に出すアイテムを選択してください");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            // 相手のowner_idを取得
            const { data: targetFull } = await supabase
                .from("user_items")
                .select("owner_id")
                .eq("id", targetItemId!)
                .single();

            if (!targetFull) {
                setError("相手のアイテムが見つかりません");
                setSubmitting(false);
                return;
            }

            // 既存の有効な取引をチェック（自分と相手の間）
            const { data: existingTrades } = await supabase
                .from("trades")
                .select("id")
                .or(`and(proposer_id.eq.${user.id},receiver_id.eq.${targetFull.owner_id}),and(proposer_id.eq.${targetFull.owner_id},receiver_id.eq.${user.id})`)
                .not("status", "in", "(CANCELLED,COMPLETED)");

            if (existingTrades && existingTrades.length > 0) {
                const existingTradeId = existingTrades[0].id;
                // 既に進行中の取引があればそちらに合流（メッセージがあれば送信）
                if (message.trim()) {
                    await supabase.from("trade_messages").insert({
                        trade_id: existingTradeId,
                        sender_id: user.id,
                        content: message.trim() + "\n（※別アイテムの交換ページからメッセージを送信しました）",
                    });
                }
                router.push(`/trade/${existingTradeId}`);
                return;
            }

            // 既存取引がなければ新規作成

            const { data: trade, error: insertError } = await supabase
                .from("trades")
                .insert({
                    proposer_id: user.id,
                    receiver_id: targetFull.owner_id,
                    proposer_item_id: selectedItemId,
                    receiver_item_id: targetItemId,
                    status: "PROPOSED",
                })
                .select("id")
                .single();

            if (insertError) {
                setError("提案の送信に失敗しました");
                setSubmitting(false);
                return;
            }

            // メッセージがあれば送信
            if (message.trim() && trade) {
                await supabase.from("trade_messages").insert({
                    trade_id: trade.id,
                    sender_id: user.id,
                    content: message.trim(),
                });
            }

            // 新規提案のメール通知を相手に送る
            if (trade) {
                fetch("/api/internal-notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        targetUserId: targetFull.owner_id,
                        eventType: "NEW_PROPOSAL",
                        tradeId: trade.id
                    })
                }).catch(err => console.error("Notification failed:", err));
            }

            router.push(`/trade/${trade!.id}`);
        } catch {
            setError("エラーが発生しました");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!targetItem) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-4xl">😢</p>
                    <p className="font-bold text-muted">アイテムが見つかりません</p>
                    <Link href="/" className="btn btn-primary px-6 py-3 inline-flex">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-28 sm:pb-8">
            {/* Header */}
            <div className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-1 hover:bg-primary-light rounded-lg transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="font-bold text-sm">交換を提案する</h1>
                <div className="w-8" />
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-5">
                {error && (
                    <div className="bg-danger/5 border border-danger/20 text-danger text-sm font-medium p-3 rounded-lg animate-fade-in">
                        {error}
                    </div>
                )}

                {/* Trade Preview */}
                <div className="card p-5 animate-fade-in-up">
                    <h2 className="text-xs font-bold text-muted uppercase mb-4 flex items-center gap-1.5 tracking-wider">
                        <ArrowRightLeft className="h-4 w-4" /> 交換内容
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Selected item (mine) */}
                        <div className="flex-1 text-center">
                            {selectedItemId ? (
                                <>
                                    <img
                                        src={myItems.find(i => i.id === selectedItemId)?.images[0] || ""}
                                        className="w-20 h-20 mx-auto rounded-lg border border-border object-cover mb-1 shadow-sm"
                                    />
                                    <p className="badge bg-primary-light text-primary text-[8px] mx-auto">あなた</p>
                                    <p className="text-[10px] font-bold mt-0.5 truncate">
                                        {myItems.find(i => i.id === selectedItemId)?.catalog_items?.name}
                                    </p>
                                </>
                            ) : (
                                <div className="w-20 h-20 mx-auto rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center mb-1 bg-primary-light/50">
                                    <span className="text-xl">❓</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-primary-light text-primary p-2 rounded-full animate-pulse">
                            <ArrowRightLeft className="h-4 w-4" />
                        </div>

                        {/* Target item */}
                        <div className="flex-1 text-center">
                            <img
                                src={targetItem.images[0]}
                                className="w-20 h-20 mx-auto rounded-lg border border-border object-cover mb-1 shadow-sm"
                            />
                            <p className="badge bg-secondary-light text-secondary text-[8px] mx-auto">
                                {getProfileDisplayName(targetItem.profiles as DisplayNameProfile, "ユーザー")}さん
                            </p>
                            <p className="text-[10px] font-bold mt-0.5 truncate">{targetItem.catalog_items?.name}</p>
                        </div>
                    </div>
                </div>

                {/* My Items */}
                <div className="card p-5 space-y-4 animate-fade-in-up delay-1">
                    <h2 className="font-bold">🔄 交換に出すアイテムを選んでください</h2>
                    {myItems.length === 0 ? (
                        <div className="text-center py-8 space-y-3">
                            <p className="text-3xl">📦</p>
                            <p className="text-sm text-muted font-bold">交換可能なアイテムがありません</p>
                            <Link href="/sell" className="btn btn-primary px-6 py-2 inline-flex text-sm">
                                アイテムを登録する
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {myItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedItemId(item.id)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedItemId === item.id
                                        ? "border-primary shadow-md ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <img src={item.images[0]} alt={item.catalog_items?.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate text-center">
                                        {item.catalog_items?.name}
                                    </div>
                                    {selectedItemId === item.id && (
                                        <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full">
                                            <span className="text-[10px]">✓</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Message */}
                <div className="card p-5 space-y-3 animate-fade-in-up delay-2">
                    <h2 className="font-bold">💬 メッセージ（任意）</h2>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="交換の挨拶やメッセージを入力してください"
                        rows={3}
                        className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all resize-none"
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedItemId || submitting}
                    className="btn btn-primary w-full py-4 text-base gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="h-5 w-5" />
                            提案を送信する
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function ProposePage() {
    return (
        <Suspense fallback={
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        }>
            <ProposeContent />
        </Suspense>
    );
}
