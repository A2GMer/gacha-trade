"use client";

import { useState, useEffect, use, useRef } from "react";
import { ChevronLeft, Info, Send, Truck, ArrowRightLeft, CheckCircle2, MapPin, Star, AlertTriangle, PackageCheck, Camera, X } from "lucide-react";
import Link from "next/link";
import { ShippingGuide } from "@/components/trade/ShippingGuide";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

const ALL_STEPS = [
    { id: "PROPOSED", label: "提案", icon: "📩" },
    { id: "ACCEPTED", label: "成立\n(住所確認)", icon: "🤝" },
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
    proposer_shipped: boolean;
    receiver_shipped: boolean;
    proposer_received: boolean;
    receiver_received: boolean;
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

interface UserAddress {
    name: string;
    postal_code: string;
    prefecture: string;
    city: string;
    line1: string;
    line2: string;
    phone: string;
}

export default function TradeRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const supabase = createClient();
    const [trade, setTrade] = useState<TradeData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");

    // Address states
    const [myAddress, setMyAddress] = useState<UserAddress | null>(null);
    const [partnerAddress, setPartnerAddress] = useState<UserAddress | null>(null);
    const [addressForm, setAddressForm] = useState<UserAddress>({
        name: "", postal_code: "", prefecture: "", city: "", line1: "", line2: "", phone: ""
    });
    const [isSavingAddr, setIsSavingAddr] = useState(false);

    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 検品フロー
    const [showInspection, setShowInspection] = useState(false);
    const [inspectionResult, setInspectionResult] = useState<"match" | "mismatch" | null>(null);
    const [disputeReason, setDisputeReason] = useState("");
    const [filingDispute, setFilingDispute] = useState(false);

    useEffect(() => {
        if (!user) return;

        async function fetchTrade() {
            const { data, error } = await supabase
                .from("trades")
                .select(`
          id, status, proposer_id, receiver_id, created_at,
          proposer_shipped, receiver_shipped, proposer_received, receiver_received,
          proposer_item:proposer_item_id (id, images, catalog_items (name)),
          receiver_item:receiver_item_id (id, images, catalog_items (name)),
          proposer_profile:proposer_id (display_name, rating_avg),
          receiver_profile:receiver_id (display_name, rating_avg)
        `)
                .eq("id", id)
                .single();

            if (data && !error) {
                const td = data as unknown as TradeData;
                setTrade(td);

                // 住所情報の取得
                if (td.status !== "PROPOSED" && td.status !== "CANCELLED") {
                    const partnerId = user!.id === td.proposer_id ? td.receiver_id : td.proposer_id;

                    // 自分の住所
                    const { data: myAddr } = await supabase
                        .from("user_addresses")
                        .select("*")
                        .eq("user_id", user!.id)
                        .single();

                    if (myAddr) {
                        setMyAddress(myAddr as UserAddress);
                        setAddressForm(myAddr as UserAddress);
                    }

                    // 相手の住所 (RLSで許可されている場合のみ取得成功する)
                    const { data: pAddr } = await supabase
                        .from("user_addresses")
                        .select("*")
                        .eq("user_id", partnerId)
                        .single();

                    if (pAddr) {
                        setPartnerAddress(pAddr as UserAddress);
                    }
                }
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

    const saveAddress = async () => {
        if (!user || !trade) return;
        setIsSavingAddr(true);
        const { error } = await supabase.from("user_addresses").upsert({
            user_id: user.id,
            ...addressForm
        }, { onConflict: "user_id" });

        if (!error) {
            setMyAddress(addressForm);
        }
        setIsSavingAddr(false);
    };

    const updateStatus = async (newStatus: string) => {
        const { error } = await supabase
            .from("trades")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (!error && trade) {
            setTrade({ ...trade, status: newStatus });
        }
    };

    const markAsShipped = async () => {
        if (!trade || !user) return;
        const isProposer = user.id === trade.proposer_id;
        const updatePayload: any = isProposer ? { proposer_shipped: true } : { receiver_shipped: true };

        const partnerShipped = isProposer ? trade.receiver_shipped : trade.proposer_shipped;
        if (partnerShipped) {
            updatePayload.status = "SHIPPED";
        }

        const { error } = await supabase.from("trades").update(updatePayload).eq("id", id);
        if (!error) {
            setTrade({ ...trade, ...updatePayload });
        }
    };

    const markAsReceived = async () => {
        if (!trade || !user) return;
        const isProposer = user.id === trade.proposer_id;
        const updatePayload: any = isProposer ? { proposer_received: true } : { receiver_received: true };

        const partnerReceived = isProposer ? trade.receiver_received : trade.proposer_received;
        if (partnerReceived) {
            updatePayload.status = "COMPLETED";
        }

        const { error } = await supabase.from("trades").update(updatePayload).eq("id", id);
        if (!error) {
            setTrade({ ...trade, ...updatePayload });
            setShowInspection(false);
            setInspectionResult(null);
        }
    };

    const fileDispute = async () => {
        if (!trade || !user || !disputeReason.trim()) return;
        setFilingDispute(true);
        await supabase.from("disputes").insert({
            trade_id: trade.id,
            reporter_id: user.id,
            reason: disputeReason.trim(),
            status: "OPEN",
        });
        await supabase.from("trades").update({ status: "DISPUTE", updated_at: new Date().toISOString() }).eq("id", id);
        setTrade({ ...trade, status: "DISPUTE" });
        setShowInspection(false);
        setFilingDispute(false);
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

    // Status flags
    const myShipped = isProposer ? trade.proposer_shipped : trade.receiver_shipped;
    const partnerShipped = isProposer ? trade.receiver_shipped : trade.proposer_shipped;
    const myReceived = isProposer ? trade.proposer_received : trade.receiver_received;
    const partnerReceived = isProposer ? trade.receiver_received : trade.proposer_received;

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
                                <span className={`text-[9px] font-bold whitespace-pre-line text-center ${i <= currentStepIndex ? "text-primary" : "text-muted"}`}>
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

                {/* Status Actions */}
                {trade.status === "PROPOSED" && !isProposer && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 border-primary/20 border-2">
                        <h2 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5 tracking-wider">
                            ✨ 交換の提案が届いています
                        </h2>
                        <p className="text-sm text-muted">相手のアイテムと自分のアイテムを交換しますか？</p>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => updateStatus("CANCELLED")} className="btn bg-surface text-muted border border-border flex-1 py-3">
                                お断りする
                            </button>
                            <button onClick={() => updateStatus("ACCEPTED")} className="btn btn-primary flex-1 py-3">
                                承諾する
                            </button>
                        </div>
                    </div>
                )}

                {trade.status === "PROPOSED" && isProposer && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 bg-surface border-border">
                        <p className="text-sm text-center text-muted font-bold">相手の返答を待っています...</p>
                    </div>
                )}

                {/* ACCEPTED (住所登録と発送ステップ) */}
                {["ACCEPTED", "SHIPPED"].includes(trade.status) && (
                    <div className="space-y-4 animate-fade-in-up delay-1">

                        {/* 自分の住所登録 */}
                        {!myAddress ? (
                            <div className="card p-5 space-y-4 border-primary/20 border-2">
                                <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" /> 発送先住所の入力
                                </h2>
                                <p className="text-xs text-muted">相手に商品を発送してもらうため、あなたの住所を入力してください。双方が入力すると互いの住所が開示されます。</p>
                                <div className="space-y-3">
                                    <input type="text" placeholder="氏名" className="input text-sm w-full" value={addressForm.name} onChange={e => setAddressForm({ ...addressForm, name: e.target.value })} />
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="郵便番号" className="input text-sm w-1/3" value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                                        <input type="text" placeholder="都道府県" className="input text-sm w-2/3" value={addressForm.prefecture} onChange={e => setAddressForm({ ...addressForm, prefecture: e.target.value })} />
                                    </div>
                                    <input type="text" placeholder="市区町村" className="input text-sm w-full" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                                    <input type="text" placeholder="番地 (例: 1-2-3)" className="input text-sm w-full" value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })} />
                                    <input type="text" placeholder="建物名・部屋番号 (任意)" className="input text-sm w-full" value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })} />
                                    <input type="tel" placeholder="電話番号" className="input text-sm w-full" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} />
                                    <button onClick={saveAddress} disabled={isSavingAddr || !addressForm.name || !addressForm.postal_code || !addressForm.line1} className="btn btn-primary w-full py-3 disabled:opacity-50">
                                        確定する
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="card p-4 space-y-2 bg-surface/50 border-primary/10">
                                <h2 className="text-xs font-bold text-muted flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-success" /> 自分の住所（登録済）
                                </h2>
                                <p className="text-xs text-muted truncate">〒{myAddress.postal_code} {myAddress.prefecture}{myAddress.city}{myAddress.line1} {myAddress.line2}</p>
                            </div>
                        )}

                        {/* 相手の住所表示と発送アクション */}
                        {myAddress && (
                            !partnerAddress ? (
                                <div className="card p-5 text-center space-y-2 border-dashed border-2">
                                    <p className="text-sm font-bold text-muted">相手の住所入力を待っています...</p>
                                    <p className="text-[10px] text-muted">相手が入力を完了すると、ここに発送先が表示されます</p>
                                </div>
                            ) : (
                                <div className="card p-5 space-y-4 border-accent/20 border-2">
                                    <h2 className="text-sm font-bold text-accent flex items-center gap-1.5 border-b border-border pb-2">
                                        <MapPin className="h-4 w-4" /> 発送先の住所（相手の住所）
                                    </h2>
                                    <div className="text-sm space-y-1">
                                        <p>〒{partnerAddress.postal_code}</p>
                                        <p>{partnerAddress.prefecture}{partnerAddress.city}{partnerAddress.line1}</p>
                                        {partnerAddress.line2 && <p>{partnerAddress.line2}</p>}
                                        <p className="pt-1 font-bold">{partnerAddress.name} 様</p>
                                        <p className="text-muted text-xs pt-1">電話番号: {partnerAddress.phone}</p>
                                    </div>

                                    {!myShipped ? (
                                        <button onClick={markAsShipped} className="btn bg-accent text-white hover:bg-accent/90 w-full py-3">
                                            <Truck className="h-4 w-4" /> 商品を発送した
                                        </button>
                                    ) : (
                                        <div className="text-center p-3 bg-accent/10 rounded-xl text-accent text-sm font-bold">
                                            ✅ 発送通知済み
                                        </div>
                                    )}

                                    {partnerShipped && !myShipped && (
                                        <p className="text-xs text-center text-primary font-bold fade-in mt-2 flex items-center justify-center gap-1">
                                            <Info className="h-3 w-3" /> 相手は既に発送済みです。お早めに発送してください。
                                        </p>
                                    )}
                                </div>
                            )
                        )}

                        {/* 推奨発送方法 */}
                        {myAddress && partnerAddress && (
                            <ShippingGuide />
                        )}
                    </div>
                )}

                {/* 受取アクション */}
                {trade.status === "SHIPPED" && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-2 border-primary/20 border-2">
                        {myShipped && partnerShipped ? (
                            !myReceived ? (
                                !showInspection ? (
                                    <>
                                        <h2 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5 tracking-wider">
                                            📦 相手からの到着待ち
                                        </h2>
                                        <p className="text-sm text-muted">商品が届いたら、中身を確認してください。</p>
                                        <button onClick={() => setShowInspection(true)} className="btn btn-primary w-full py-3">
                                            <PackageCheck className="h-4 w-4" /> 商品が届きました
                                        </button>
                                    </>
                                ) : (
                                    /* ===== 検品フロー ===== */
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5 tracking-wider">
                                                🔍 アイテム検品
                                            </h2>
                                            <button onClick={() => setShowInspection(false)} className="p-1 hover:bg-background rounded-lg">
                                                <X className="h-4 w-4 text-muted" />
                                            </button>
                                        </div>

                                        {/* 期待されるアイテム情報 */}
                                        <div className="bg-background rounded-xl p-3">
                                            <p className="text-[10px] text-muted font-bold mb-2">受け取るべきアイテム</p>
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={partnerItem?.images?.[0] || "/placeholder.png"}
                                                    alt=""
                                                    className="w-14 h-14 rounded-xl border border-border object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold">{partnerItem?.catalog_items?.name}</p>
                                                    <p className="text-[10px] text-muted">出品時の写真と照合してください</p>
                                                </div>
                                            </div>
                                        </div>

                                        {!inspectionResult ? (
                                            <>
                                                <p className="text-sm text-center font-bold">届いた商品は説明通りですか？</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setInspectionResult("match")}
                                                        className="btn bg-success text-white hover:bg-success/90 flex-1 py-3 gap-1.5"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        一致する
                                                    </button>
                                                    <button
                                                        onClick={() => setInspectionResult("mismatch")}
                                                        className="btn bg-danger text-white hover:bg-danger/90 flex-1 py-3 gap-1.5"
                                                    >
                                                        <AlertTriangle className="h-4 w-4" />
                                                        一致しない
                                                    </button>
                                                </div>
                                            </>
                                        ) : inspectionResult === "match" ? (
                                            <>
                                                <div className="bg-success/10 rounded-xl p-3 text-center">
                                                    <p className="text-sm font-bold text-success">✅ アイテムが一致しました</p>
                                                    <p className="text-[10px] text-muted mt-1">受取完了を確定してください</p>
                                                </div>
                                                <button onClick={markAsReceived} className="btn btn-primary w-full py-3">
                                                    <PackageCheck className="h-4 w-4" /> 受取完了を確定する
                                                </button>
                                            </>
                                        ) : (
                                            /* 不一致 → 紛争提起 */
                                            <div className="space-y-3">
                                                <div className="bg-danger/5 rounded-xl p-3">
                                                    <p className="text-sm font-bold text-danger">⚠️ アイテムが一致しません</p>
                                                    <p className="text-[10px] text-muted mt-1">問題の内容を記入して報告してください。運営が調査いたします。</p>
                                                </div>
                                                <textarea
                                                    value={disputeReason}
                                                    onChange={(e) => setDisputeReason(e.target.value)}
                                                    placeholder="どのように異なっていたか詳しく記入してください..."
                                                    rows={3}
                                                    className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/30 resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setInspectionResult(null); setDisputeReason(""); }}
                                                        className="btn bg-surface text-muted border border-border flex-1 py-3"
                                                    >
                                                        戻る
                                                    </button>
                                                    <button
                                                        onClick={fileDispute}
                                                        disabled={filingDispute || !disputeReason.trim()}
                                                        className="btn bg-danger text-white hover:bg-danger/90 flex-1 py-3 gap-1.5 disabled:opacity-50"
                                                    >
                                                        <AlertTriangle className="h-4 w-4" />
                                                        {filingDispute ? "送信中..." : "問題を報告する"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <>
                                    <div className="text-center p-3 bg-primary/10 rounded-xl text-primary text-sm font-bold">
                                        ✅ あなたは受取完了しました
                                    </div>
                                    {!partnerReceived && (
                                        <p className="text-xs text-center text-muted mt-2">相手の受取完了を待っています...</p>
                                    )}
                                </>
                            )
                        ) : null}
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
                <div className="space-y-3 animate-fade-in-up delay-3 pt-6 border-t border-border">
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
                            <div className={`max-w-[75%] p-3 text-sm leading-relaxed whitespace-pre-line ${m.sender_id === user.id
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

