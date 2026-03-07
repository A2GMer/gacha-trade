"use client";

import { useState, useEffect, use, useRef } from "react";
import { ChevronLeft, Info, Send, Truck, ArrowRightLeft, CheckCircle2, MapPin, Star, AlertTriangle, PackageCheck, Camera, X, Hash, ImagePlus } from "lucide-react";
import Link from "next/link";
import { ShippingGuide } from "@/components/trade/ShippingGuide";
import { ReviewModal } from "@/components/trade/ReviewModal";
import { DeadlineCountdown } from "@/components/trade/DeadlineCountdown";
import { DepositModal } from "@/components/trade/DepositModal";
import { lookupPostalCode } from "@/lib/postal";
import { shareTradeCompleteOnX } from "@/lib/share";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { getProfileDisplayName, DisplayNameProfile } from "@/lib/profile";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

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
    updated_at: string;
    proposer_item: { id: string; images: string[]; catalog_items: { name: string } };
    receiver_item: { id: string; images: string[]; catalog_items: { name: string } };
    proposer_profile: { display_name: string; rating_avg: number; x_username: string | null; display_name_source: "manual" | "twitter" };
    receiver_profile: { display_name: string; rating_avg: number; x_username: string | null; display_name_source: "manual" | "twitter" };
    proposer_payment_intent_id: string | null;
    receiver_payment_intent_id: string | null;
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    image_url?: string;
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
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 検品フロー
    const [showInspection, setShowInspection] = useState(false);
    const [inspectionResult, setInspectionResult] = useState<"match" | "mismatch" | null>(null);
    const [disputeReason, setDisputeReason] = useState("");
    const [filingDispute, setFilingDispute] = useState(false);
    const [cancelingDispute, setCancelingDispute] = useState(false);
    const [isDisputeReporter, setIsDisputeReporter] = useState(false);

    // 追跡番号
    const [trackingNumber, setTrackingNumber] = useState("");
    const [trackingError, setTrackingError] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    // デポジット
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    // レビュー
    const [showReview, setShowReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        if (!user) return;

        async function fetchTrade() {
            const { data, error } = await supabase
                .from("trades")
                .select(`
          id, status, proposer_id, receiver_id, created_at, updated_at,
          proposer_shipped, receiver_shipped, proposer_received, receiver_received,
          proposer_item:proposer_item_id (id, images, catalog_items (name)),
          receiver_item:receiver_item_id (id, images, catalog_items (name)),
          proposer_profile:proposer_id (display_name, rating_avg, x_username, display_name_source),
          receiver_profile:receiver_id (display_name, rating_avg, x_username, display_name_source),
          proposer_tracking_number, receiver_tracking_number,
          proposer_payment_intent_id, receiver_payment_intent_id
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
                        .maybeSingle();

                    if (myAddr) {
                        setMyAddress(myAddr as UserAddress);
                        setAddressForm(myAddr as UserAddress);
                    }

                    // 相手の住所 (RLSで許可されている場合のみ取得成功する)
                    const { data: pAddr } = await supabase
                        .from("user_addresses")
                        .select("*")
                        .eq("user_id", partnerId)
                        .maybeSingle();

                    if (pAddr) {
                        setPartnerAddress(pAddr as UserAddress);
                    }
                }

                // 紛争状態の場合、自分が報告者かどうかを確認する
                if (td.status === "DISPUTE") {
                    const { data: dispute, error: disputeErr } = await supabase
                        .from("disputes")
                        .select("reporter_id")
                        .eq("trade_id", id)
                        .eq("status", "OPEN")
                        .limit(1)
                        .maybeSingle();

                    if (disputeErr) console.error("Dispute fetch error:", disputeErr);

                    if (dispute) {
                        // We need to add state for this if it isn't there, waiting, let's just make sure it's valid
                        // Wait, did the user add setIsDisputeReporter? Let me check if they did. Yes it seems they did.
                        setIsDisputeReporter(dispute.reporter_id === user!.id);
                    } else {
                        console.warn("No OPEN dispute found for this trade.", id);
                    }
                }

                // すでにレビュー済みかどうかを確認
                if (td.status === "COMPLETED") {
                    const { data: review } = await supabase
                        .from("reviews")
                        .select("id")
                        .eq("trade_id", id)
                        .eq("reviewer_id", user!.id)
                        .maybeSingle();

                    if (review) {
                        setHasReviewed(true);
                    }
                }
            } else if (error) {
                console.error("Failed to fetch trade:", error);
                setFetchError(error.message || "取引情報の取得に失敗しました。");
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
        const messageChannel = supabase
            .channel(`trade-${id}-msgs`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "trade_messages", filter: `trade_id=eq.${id}` },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        // リアルタイム住所購読
        const addressChannel = supabase
            .channel(`trade-${id}-addrs`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "user_addresses" },
                (payload) => {
                    // Refetch trade to update addresses properly through RLS policy evaluation
                    fetchTrade();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
            supabase.removeChannel(addressChannel);
        };
    }, [id, user, supabase]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || sendingMessage) return;
        setSendingMessage(true);
        const insertedData = await supabase.from("trade_messages").insert({
            trade_id: id,
            sender_id: user.id,
            content: newMessage.trim(),
        }).select();

        // 通知の送信
        if (trade && insertedData.data) {
            const receiverId = user.id === trade.proposer_id ? trade.receiver_id : trade.proposer_id;
            fetch("/api/internal-notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetUserId: receiverId,
                    eventType: "NEW_MESSAGE",
                    tradeId: id
                })
            }).catch(e => console.error("Notify failed:", e));
        }

        setNewMessage("");
        setSendingMessage(false);
    };

    const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        const file = e.target.files[0];

        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            alert("画像サイズは5MB以下にしてください。");
            return;
        }

        setUploadingImage(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${user.id}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from("trade_evidences")
            .upload(fileName, file);

        if (error) {
            console.error("Image upload error:", error);
            alert("画像のアップロードに失敗しました。");
            setUploadingImage(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from("trade_evidences")
            .getPublicUrl(fileName);

        const insertedImage = await supabase.from("trade_messages").insert({
            trade_id: id,
            sender_id: user.id,
            content: "【画像を送信しました】",
            image_url: publicUrl,
        }).select();

        // 通知の送信
        if (trade && insertedImage.data) {
            const receiverId = user.id === trade.proposer_id ? trade.receiver_id : trade.proposer_id;
            fetch("/api/internal-notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetUserId: receiverId,
                    eventType: "NEW_MESSAGE",
                    tradeId: id
                })
            }).catch(e => console.error("Notify failed:", e));
        }

        setUploadingImage(false);
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
        // If accepting, show deposit modal instead of immediately updating status
        if (newStatus === "ACCEPTED") {
            setIsAccepting(true);
            setShowDepositModal(true);
            return;
        }

        const { error } = await supabase
            .from("trades")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (!error && trade) {
            setTrade({ ...trade, status: newStatus });
        }
    };

    const handleDepositSuccess = async (paymentIntentId: string) => {
        if (!trade || !user) return;
        setShowDepositModal(false);

        // Fetch latest trade to ensure we don't overwrite other changes
        const { data: latestTrade } = await supabase.from("trades").select("*").eq("id", id).single();
        if (!latestTrade) return;

        const isProposer = user.id === trade.proposer_id;
        const updatePayload: Record<string, unknown> = {};

        if (isProposer) {
            updatePayload.proposer_payment_intent_id = paymentIntentId;
        } else {
            updatePayload.receiver_payment_intent_id = paymentIntentId;
        }

        if (isAccepting && latestTrade.status === "PROPOSED") {
            updatePayload.status = "ACCEPTED";
        }

        const { error } = await supabase.from("trades").update({ ...updatePayload, updated_at: new Date().toISOString() }).eq("id", id);

        if (!error) {
            setTrade({ ...trade, ...updatePayload, status: updatePayload.status || trade.status });
            setIsAccepting(false);

            // もし「自分（提案を受けた側）」が承諾した直後なら、提案者（相手）に通知を送る
            if (updatePayload.status === "ACCEPTED" && !isProposer) {
                fetch("/api/internal-notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        targetUserId: trade.proposer_id,
                        eventType: "PROPOSAL_ACCEPTED",
                        tradeId: id
                    })
                }).catch(e => console.error("Notify failed:", e));
            }
        }
    };

    const markAsShipped = async () => {
        if (!trade || !user) return;
        setTrackingError("");

        // 追跡番号のバリデーション (9〜14桁の数字)
        const cleanedTrackingNumber = trackingNumber.replace(/[^0-9]/g, "");
        if (!cleanedTrackingNumber || cleanedTrackingNumber.length < 9 || cleanedTrackingNumber.length > 14) {
            setTrackingError("正しい追跡番号（9〜14桁の数字）を入力してください。");
            return;
        }

        const isProposer = user.id === trade.proposer_id;
        const updatePayload: Record<string, unknown> = isProposer
            ? { proposer_shipped: true, proposer_tracking_number: cleanedTrackingNumber }
            : { receiver_shipped: true, receiver_tracking_number: cleanedTrackingNumber };

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
        const updatePayload: Record<string, unknown> = isProposer ? { proposer_received: true } : { receiver_received: true };

        const partnerReceived = isProposer ? trade.receiver_received : trade.proposer_received;

        // 双方が受け取り完了した場合 (COMPLETED)
        if (partnerReceived) {
            updatePayload.status = "COMPLETED";

            try {
                const releaseRes = await fetch("/api/deposit/release", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tradeId: trade.id }),
                });

                if (!releaseRes.ok) {
                    const releaseBody = await releaseRes.json().catch(() => ({}));
                    console.error("Failed to release deposits:", releaseBody);
                }
            } catch (error) {
                console.error("Error during deposit release:", error);
            }
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

        // 通知の送信
        const receiverId = user.id === trade.proposer_id ? trade.receiver_id : trade.proposer_id;
        fetch("/api/internal-notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                targetUserId: receiverId,
                eventType: "DISPUTE_OPENED",
                tradeId: id
            })
        }).catch(e => console.error("Notify failed:", e));

        setTrade({ ...trade, status: "DISPUTE" });
        setIsDisputeReporter(true);
        setShowInspection(false);
        setFilingDispute(false);
    };

    const cancelDispute = async () => {
        if (!trade || !user) return;
        setCancelingDispute(true);
        // Find existing open dispute
        const { data: dispute } = await supabase
            .from("disputes")
            .select("id")
            .eq("trade_id", trade.id)
            .eq("reporter_id", user.id)
            .eq("status", "OPEN")
            .limit(1)
            .maybeSingle();

        if (dispute) {
            await supabase.from("disputes").update({ status: "RESOLVED" }).eq("id", dispute.id);
        }

        // Revert trade status to SHIPPED
        await supabase.from("trades").update({ status: "SHIPPED", updated_at: new Date().toISOString() }).eq("id", id);

        setTrade({ ...trade, status: "SHIPPED" });
        setDisputeReason("");
        setCancelingDispute(false);
    };

    if (fetchError) {
        return (
            <div className="bg-background min-h-screen flex flex-col items-center justify-center p-4">
                <div className="card p-6 border-danger/20 border-2 text-center space-y-4 max-w-md w-full">
                    <AlertTriangle className="h-12 w-12 text-danger mx-auto" />
                    <h2 className="text-lg font-bold">取引情報を取得できませんでした</h2>
                    <p className="text-sm text-foreground/80">{fetchError}</p>
                    <div className="bg-surface p-3 rounded-lg text-xs text-left text-muted font-mono whitespace-pre-wrap break-all">
                        {`Hint: データベースに proposer_tracking_number などのカラムが追加されているか確認してください。`}
                    </div>
                    <Link href="/trade/proposals" className="btn btn-primary w-full py-3 block">一覧に戻る</Link>
                </div>
            </div>
        );
    }

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

    const myDeposit = isProposer ? trade.proposer_payment_intent_id : trade.receiver_payment_intent_id;
    const partnerDeposit = isProposer ? trade.receiver_payment_intent_id : trade.proposer_payment_intent_id;
    const bothDeposited = Boolean(trade.proposer_payment_intent_id && trade.receiver_payment_intent_id);

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    return (
        <div className="bg-background min-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <Link href="/trade/proposals" className="p-1 hover:bg-primary-light rounded-lg transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="text-center flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xs">
                        {getProfileDisplayName(partner as DisplayNameProfile, "?")[0]}
                    </div>
                    <div className="text-left">
                        <h1 className="font-bold text-sm leading-none">{getProfileDisplayName(partner as DisplayNameProfile, "ユーザー")}</h1>
                        <p className="text-[10px] text-muted">との取引</p>
                    </div>
                </div>
                <button className="p-1 hover:bg-primary-light rounded-lg transition-colors">
                    <Info className="h-5 w-5 text-muted" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-surface px-2 sm:px-4 pt-6 pb-10 border-b border-border shadow-sm relative z-10">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    {ALL_STEPS.map((step, i) => {
                        const isCompleted = i < currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        const isFuture = i > currentStepIndex;

                        return (
                            <div key={step.id} className="flex items-center relative flex-1 first:flex-initial last:flex-initial">
                                {/* Step Circle */}
                                <div className="relative flex flex-col items-center z-10">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base transition-all duration-500 ${isCompleted
                                        ? "bg-primary text-white shadow-md scale-100"
                                        : isCurrent
                                            ? "bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20 animate-pulse scale-110"
                                            : "bg-background text-muted border-2 border-border scale-95"
                                        }`}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5 animate-scale-in" />
                                        ) : (
                                            <span className={`${isCurrent ? "font-bold" : "opacity-70"}`}>{step.icon}</span>
                                        )}
                                    </div>
                                    <span className={`absolute top-full mt-2 w-20 text-center text-[9px] sm:text-[10px] font-bold whitespace-pre-line leading-tight transition-all duration-500 ${isCompleted || isCurrent ? "text-primary" : "text-muted"
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Connecting Line */}
                                {i < ALL_STEPS.length - 1 && (
                                    <div className="flex-1 min-w-[10px] sm:min-w-[20px] mx-1 sm:mx-2 relative h-1 sm:h-1.5 bg-border rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-in-out"
                                            style={{
                                                width: isCompleted ? "100%" : isCurrent ? "50%" : "0%"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
                {/* Deadline Countdown */}
                <DeadlineCountdown
                    status={trade.status}
                    acceptedAt={trade.updated_at}
                    addressLockedAt={trade.updated_at}
                    shippedAt={trade.updated_at}
                />

                {/* Trade Summary Card */}
                <div className="card p-5 animate-fade-in-up">
                    <h2 className="text-xs font-bold text-muted uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                        <ArrowRightLeft className="h-4 w-4" /> 交換内容
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 text-center">
                            <img src={myItem?.images?.[0] || "/placeholder.png"} className="w-16 h-16 mx-auto rounded-lg border border-border object-cover mb-1 shadow-sm" />
                            <p className="badge bg-primary-light text-primary text-[8px] mx-auto">あなた</p>
                            <p className="text-[10px] font-bold mt-0.5 truncate">{myItem?.catalog_items?.name}</p>
                        </div>
                        <div className="bg-primary-light text-primary p-2 rounded-full animate-pulse">
                            <ArrowRightLeft className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-center">
                            <img src={partnerItem?.images?.[0] || "/placeholder.png"} className="w-16 h-16 mx-auto rounded-lg border border-border object-cover mb-1 shadow-sm" />
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

                {/* ACCEPTED (デポジット待機) */}
                {trade.status === "ACCEPTED" && !myDeposit && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 border-primary/20 border-2">
                        <h2 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5 tracking-wider">
                            🛡️ デポジットの支払いをお願いします
                        </h2>
                        <p className="text-sm text-muted">
                            取引を安全に進めるため、一時預かり金（デポジット）として300円のカード与信枠を確保します。
                            これは相手が発送しないなどのトラブルを防ぐ目的であり、取引完了時に返金・解放されます。
                        </p>
                        <button onClick={() => setShowDepositModal(true)} className="btn btn-primary w-full py-3 mt-2">
                            デポジットを支払う（300円）
                        </button>
                    </div>
                )}

                {/* ACCEPTED (相手のデポジット待機) */}
                {trade.status === "ACCEPTED" && myDeposit && !partnerDeposit && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 bg-surface border-border">
                        <p className="text-sm text-center text-muted font-bold">相手のデポジット支払いを待っています...</p>
                        <p className="text-[10px] text-center text-muted">双方がデポジットを完了すると、住所が開示されます。</p>
                    </div>
                )}

                {/* ACCEPTED (住所登録と発送ステップ) -> 双方がデポジット完了している場合のみ表示 */}
                {["ACCEPTED", "SHIPPED"].includes(trade.status) && bothDeposited && (
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
                                <div className="card p-5 text-center space-y-2 border-dashed border-2 relative">
                                    {(!myAddress.phone || myAddress.phone === "00000000000") && (
                                        <div className="absolute top-0 left-0 right-0 -mt-2 mx-4">
                                            <div className="bg-danger text-white text-[10px] py-1 px-2 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> 取引の進行にはプロフィール設定からの電話番号認証が必要です
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm font-bold text-muted mt-2">相手の住所入力を待っています...</p>
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
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs font-bold text-muted mb-1 flex items-center gap-1">
                                                    <Hash className="h-3 w-3" /> 追跡番号（必須）
                                                </label>
                                                <input
                                                    type="text"
                                                    value={trackingNumber}
                                                    onChange={(e) => {
                                                        setTrackingNumber(e.target.value);
                                                        setTrackingError("");
                                                    }}
                                                    placeholder="追跡番号を入力"
                                                    className={`w-full bg-background border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${trackingError ? 'border-danger focus:border-danger' : 'border-border'}`}
                                                />
                                                {trackingError && (
                                                    <p className="text-danger text-[10px] mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{trackingError}</p>
                                                )}
                                            </div>
                                            <button onClick={markAsShipped} className="btn bg-accent text-white hover:bg-accent/90 w-full py-3 mt-2">
                                                <Truck className="h-4 w-4" /> 商品を発送した
                                            </button>
                                        </div>
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
                                                    <p className="text-[9px] text-danger mt-2 font-bold bg-danger/10 p-1.5 rounded-lg border border-danger/20">
                                                        注意: 虚偽の報告で不当にデポジットの返還を受けようとする行為は固く禁じています。発覚時はアカウント停止および損害賠償請求の対象となります。
                                                    </p>
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
                            <h2 className="font-bold text-success">取引完了！</h2>
                            <p className="text-sm text-muted">お取引ありがとうございました</p>
                        </div>
                        {!hasReviewed ? (
                            <button
                                onClick={() => setShowReview(true)}
                                className="btn btn-primary w-full py-3 mt-4"
                            >
                                <Star className="h-4 w-4" /> 取引相手を評価する
                            </button>
                        ) : (
                            <div className="text-center p-3 bg-surface rounded-xl border border-border mt-4">
                                <p className="text-sm font-bold text-muted">評価済みです</p>
                            </div>
                        )}

                        {/* X共有CTA */}
                        <button
                            onClick={() => shareTradeCompleteOnX(
                                myItem?.catalog_items?.name || "アイテム",
                                partnerItem?.catalog_items?.name || "アイテム",
                                trade.id
                            )}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-foreground text-white hover:bg-foreground/90 transition-colors text-sm font-bold"
                        >
                            <XLogo className="h-4 w-4" />
                            交換成立をXでシェアする
                        </button>
                    </div>
                )}

                {trade.status === "CANCELLED" && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 bg-danger/5 border-danger/20 border-2">
                        <div className="text-center space-y-2">
                            <p className="text-3xl">❌</p>
                            <h2 className="font-bold text-danger">取引キャンセル</h2>
                            <p className="text-sm text-muted">この取引はキャンセルされました</p>
                        </div>
                    </div>
                )}

                {trade.status === "DISPUTE" && (
                    <div className="card p-5 space-y-3 animate-fade-in-up delay-1 bg-danger/5 border-danger/20 border-2">
                        <div className="text-center space-y-4">
                            <h2 className="font-bold text-danger flex items-center justify-center gap-1.5">
                                <AlertTriangle className="h-5 w-5" /> 取引で問題が報告されました
                            </h2>
                            <p className="text-sm text-muted">現在、運営チームが内容を確認しています。<br />相手とのメッセージで解決策を話し合ってください。</p>

                            {isDisputeReporter && (
                                <div className="pt-2 border-t border-danger/10">
                                    <p className="text-xs text-muted mb-2">問題が解決した場合や、間違えて報告した場合は取り消すことができます</p>
                                    <button
                                        onClick={cancelDispute}
                                        disabled={cancelingDispute}
                                        className="btn bg-surface border border-danger/30 text-danger w-full py-3 text-sm disabled:opacity-50"
                                    >
                                        {cancelingDispute ? "取り消し中..." : "問題報告を取り消す（受取画面に戻る）"}
                                    </button>
                                </div>
                            )}
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
                                    {getProfileDisplayName(partner as DisplayNameProfile, "?")[0]}
                                </div>
                            )}
                            <div className={`max-w-[75%] p-3 text-sm leading-relaxed whitespace-pre-line ${m.sender_id === user.id
                                ? "bg-primary text-white rounded-[20px] rounded-tr-md"
                                : "bg-surface border border-border rounded-[20px] rounded-tl-md"
                                }`}>
                                {m.image_url ? (
                                    <div className="space-y-2">
                                        <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                                            <img src={m.image_url} alt="Evidence" className="rounded-lg max-h-48 object-cover w-full cursor-zoom-in border border-white/10" />
                                        </a>
                                        {m.content !== "【画像を送信しました】" && <p>{m.content}</p>}
                                    </div>
                                ) : (
                                    m.content
                                )}
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
                    <div className="flex gap-2 max-w-2xl mx-auto items-center">
                        <label className={`p-3 shrink-0 rounded-xl cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : 'hover:bg-primary-light text-primary'}`}>
                            {uploadingImage ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={uploadImage}
                                disabled={uploadingImage}
                            />
                        </label>
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
                            className="btn btn-primary p-3 shrink-0 disabled:opacity-50 rounded-full"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}


            {showReview && trade && partner && (
                <ReviewModal
                    tradeId={trade.id}
                    targetUserId={isProposer ? trade.receiver_id : trade.proposer_id}
                    targetUserName={getProfileDisplayName(partner as DisplayNameProfile, "相手")}
                    onClose={() => setShowReview(false)}
                    onComplete={() => {
                        setShowReview(false);
                        setHasReviewed(true);
                    }}
                />
            )}

            {showDepositModal && trade && user && (
                <div className="absolute top-0 left-0 w-full h-full">
                    {/* The modal has a fixed overlay, but placing it here ensures it mounts */}
                    <DepositModal
                        tradeId={trade.id}
                        onSuccess={handleDepositSuccess}
                        onCancel={() => {
                            setShowDepositModal(false);
                            setIsAccepting(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

