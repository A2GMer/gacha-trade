"use client";

import { useState, useEffect, use, useRef } from "react";
import { ChevronLeft, Info, Send, Truck, ArrowRightLeft, CheckCircle2, MapPin, Star, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

const ALL_STEPS = [
    { id: "PROPOSED", label: "提案", icon: "📩" },
    { id: "ACCEPTED", label: "成立", icon: "🤝" },
    { id: "SHIPPED", label: "発送", icon: "📦" },
    { id: "COMPLETED", label: "完了", icon: "✅" },
];

const STEP_INDEX: Record<string, number> = {
    PROPOSED: 0,
    ACCEPTED: 1,
    ADDRESS_PENDING: 1,
    ADDRESS_LOCKED: 1,
    SHIPMENT_PENDING: 1,
    SHIPPED: 2,
    RECEIVED: 2,
    COMPLETED: 3,
    DISPUTE: -1,
    CANCELLED: -1,
};

interface TradeData {
    id: string;
    status: string;
    proposer_id: string;
    receiver_id: string;
    created_at: string;
    proposer_item: { id: string; images: string[]; catalog_items: { name: string } };
    receiver_item: { id: string; images: string[]; catalog_items: { name: string } };
    proposer_profile: { display_name: string; rating_avg: number };
    receiver_profile: { display_name: string; rating_avg: number };
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

export default function TradeRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const supabase = createClient();
    const [trade, setTrade] = useState<TradeData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        async function fetchTrade() {
            const { data, error } = await supabase
                .from("trades")
                .select(`
          id, status, proposer_id, receiver_id, created_at,
          proposer_item:proposer_item_id (id, images, catalog_items (name)),
          receiver_item:receiver_item_id (id, images, catalog_items (name)),
          proposer_profile:proposer_id (display_name, rating_avg),
          receiver_profile:receiver_id (display_name, rating_avg)
        `)
                .eq("id", id)
                .single();

            if (data && !error) {
                setTrade(data as unknown as TradeData);
            }

            // メッセージ取得
            const { data: msgs } = await supabase
                .from("trade_messages")
                .select("*")
                .eq("trade_id", id)
                .order("created_at", { ascending: true });

            if (msgs) setMessages(msgs);
            setLoading(false);
        }
        fetchTrade();

        // リアルタイムメッセージ購読
        const channel = supabase
            .channel(`trade-${id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "trade_messages", filter: `trade_id=eq.${id}` },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, user, supabase]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || sendingMessage) return;
        setSendingMessage(true);
        await supabase.from("trade_messages").insert({
            trade_id: id,
            sender_id: user.id,
            content: newMessage.trim(),
        });
        setNewMessage("");
        setSendingMessage(false);
    };

    const updateStatus = async (newStatus: string) => {
        const { error } = await supabase
            .from("trades")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (!error) {
            setTrade((prev) => prev ? { ...prev, status: newStatus } : null);
        }
    };

    if (loading || !trade || !user) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const isProposer = user.id === trade.proposer_id;
    const partner = isProposer ? trade.receiver_profile : trade.proposer_profile;
    const myItem = isProposer ? trade.proposer_item : trade.receiver_item;
    const partnerItem = isProposer ? trade.receiver_item : trade.proposer_item;
    const currentStepIndex = STEP_INDEX[trade.status] ?? 0;

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    return (
        <div className="bg-background min-h-screen flex flex-col">
            {/* Header */}
            <div className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <Link href="/trade/proposals" className="p-1 hover:bg-primary-light rounded-2xl transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="text-center flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xs">
                        {(partner?.display_name || "?")[0]}
                    </div>
                    <div className="text-left">
                        <h1 className="font-bold text-sm leading-none">{partner?.display_name || "ユーザー"}さん</h1>
                        <p className="text-[10px] text-muted">との取引</p>
                    </div>
                </div>
                <button className="p-1 hover:bg-primary-light rounded-2xl transition-colors">
                    <Info className="h-5 w-5 text-muted" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-surface px-4 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                    {ALL_STEPS.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-0">
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${i <= currentStepIndex
                                        ? "bg-primary text-white shadow-md"
                                        : "bg-background text-muted border border-border"
                                    }`}>
                                    {i < currentStepIndex ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <span>{step.icon}</span>
                                    )}
                                </div>
                                <span className={`text-[9px] font-bold ${i <= currentStepIndex ? "text-primary" : "text-muted"}`}>
                                    {step.label}
                                </span>
                            </div>
                            {i < ALL_STEPS.length - 1 && (
                                <div className={`w-4 sm:w-8 h-0.5 rounded mx-0.5 mb-4 ${i < currentStepIndex ? "bg-primary" : "bg-border"}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
                {/* Trade Summary Card */}
                <div className="card p-5 animate-fade-in-up">
                    <h2 className="text-xs font-bold text-muted uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                        <ArrowRightLeft className="h-4 w-4" /> 交換内容
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 text-center">
                            <img src={myItem?.images?.[0] || "/placeholder.png"} className="w-16 h-16 mx-auto rounded-2xl border border-border object-cover mb-1 shadow-sm" />
                            <p className="badge bg-primary-light text-primary text-[8px] mx-auto">あなた</p>
                            <p className="text-[10px] font-bold mt-0.5 truncate">{myItem?.catalog_items?.name}</p>
                        </div>
                        <div className="bg-primary-light text-primary p-2 rounded-full animate-pulse">
                            <ArrowRightLeft className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-center">
                            <img src={partnerItem?.images?.[0] || "/placeholder.png"} className="w-16 h-16 mx-auto rounded-2xl border border-border object-cover mb-1 shadow-sm" />
                            <p className="badge bg-secondary-light text-secondary text-[8px] mx-auto">相手</p>
                            <p className="text-[10px] font-bold mt-0.5 truncate">{partnerItem?.catalog_items?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Status Action Card */}
                {trade.status === "ACCEPTED" && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 border-primary/20 border-2">
                        <h2 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5 tracking-wider">
                            <Truck className="h-4 w-4" /> 次のステップ
                        </h2>
                        <p className="text-sm text-muted">取引が成立しました！商品を発送してください。</p>
                        <button
                            onClick={() => updateStatus("SHIPPED")}
                            className="btn btn-primary w-full py-3"
                        >
                            <Truck className="h-4 w-4" />
                            発送を通知する
                        </button>
                    </div>
                )}

                {trade.status === "SHIPPED" && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 border-accent/20 border-2">
                        <h2 className="text-xs font-bold text-accent uppercase flex items-center gap-1.5 tracking-wider">
                            📦 発送済み
                        </h2>
                        <p className="text-sm text-muted">商品が届いたら「受取確認」を押してください。</p>
                        <button
                            onClick={() => updateStatus("COMPLETED")}
                            className="btn bg-accent text-white hover:bg-accent/90 w-full py-3"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            受取確認・取引完了
                        </button>
                    </div>
                )}

                {trade.status === "COMPLETED" && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 bg-success/5 border-success/20 border-2">
                        <div className="text-center space-y-2">
                            <p className="text-3xl">🎉</p>
                            <h2 className="font-black text-success">取引完了！</h2>
                            <p className="text-sm text-muted">お取引ありがとうございました</p>
                        </div>
                    </div>
                )}

                {trade.status === "CANCELLED" && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 bg-danger/5 border-danger/20 border-2">
                        <div className="text-center space-y-2">
                            <p className="text-3xl">❌</p>
                            <h2 className="font-black text-danger">取引キャンセル</h2>
                            <p className="text-sm text-muted">この取引はキャンセルされました</p>
                        </div>
                    </div>
                )}

                {/* Chat */}
                <div className="space-y-3 animate-fade-in-up delay-2">
                    <h2 className="text-xs font-bold text-muted uppercase px-1 tracking-wider">メッセージ</h2>
                    {messages.length === 0 && (
                        <p className="text-center text-sm text-muted py-4">まだメッセージはありません</p>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                            {m.sender_id !== user.id && (
                                <div className="w-7 h-7 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-[10px] mr-2 mt-1 shrink-0">
                                    {(partner?.display_name || "?")[0]}
                                </div>
                            )}
                            <div className={`max-w-[75%] p-3 text-sm leading-relaxed ${m.sender_id === user.id
                                    ? "bg-primary text-white rounded-[20px] rounded-tr-md"
                                    : "bg-surface border border-border rounded-[20px] rounded-tl-md"
                                }`}>
                                {m.content}
                                <p className={`text-[9px] mt-1 ${m.sender_id === user.id ? "text-white/50 text-right" : "text-muted"}`}>
                                    {formatTime(m.created_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            {trade.status !== "COMPLETED" && trade.status !== "CANCELLED" && (
                <div className="glass border-t border-white/20 p-3 pb-[env(safe-area-inset-bottom,12px)] sm:pb-3">
                    <div className="flex gap-2 max-w-2xl mx-auto">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="メッセージを入力..."
                            className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sendingMessage || !newMessage.trim()}
                            className="btn btn-primary p-3 shrink-0 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
