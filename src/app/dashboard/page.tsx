"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { getProfileDisplayName, DisplayNameProfile } from "@/lib/profile";
import {
    ArrowRightLeft,
    ChevronRight,
    Package,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Truck,
    MapPin,
    Inbox,
} from "lucide-react";

interface Trade {
    id: string;
    status: string;
    created_at: string;
    proposer_id: string;
    receiver_id: string;
    proposer_item: { images: string[]; catalog_items: { name: string } };
    receiver_item: { images: string[]; catalog_items: { name: string } };
    proposer_profile: { display_name: string; x_username: string | null; display_name_source: "manual" | "twitter" };
    receiver_profile: { display_name: string; x_username: string | null; display_name_source: "manual" | "twitter" };
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    PROPOSED: { label: "返答待ち", color: "bg-warning/10 text-warning", icon: Clock },
    ACCEPTED: { label: "住所入力待ち", color: "bg-accent/10 text-accent", icon: MapPin },
    ADDRESS_PENDING: { label: "住所入力待ち", color: "bg-accent/10 text-accent", icon: MapPin },
    ADDRESS_LOCKED: { label: "発送待ち", color: "bg-primary/10 text-primary", icon: Truck },
    SHIPMENT_PENDING: { label: "発送待ち", color: "bg-primary/10 text-primary", icon: Truck },
    SHIPPED: { label: "受取確認待ち", color: "bg-secondary/10 text-secondary", icon: Package },
    RECEIVED: { label: "評価待ち", color: "bg-accent/10 text-accent", icon: CheckCircle2 },
    COMPLETED: { label: "完了", color: "bg-success/10 text-success", icon: CheckCircle2 },
    DISPUTE: { label: "紛争中", color: "bg-danger/10 text-danger", icon: AlertTriangle },
    CANCELLED: { label: "キャンセル", color: "bg-muted/10 text-muted", icon: AlertTriangle },
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return "たった今";
    if (diffH < 24) return `${diffH}時間前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}日前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function fetchTrades() {
            const { data } = await supabase
                .from("trades")
                .select(`
          id, status, created_at, proposer_id, receiver_id,
          proposer_item:proposer_item_id (images, catalog_items (name)),
          receiver_item:receiver_item_id (images, catalog_items (name)),
          proposer_profile:proposer_id (display_name, x_username, display_name_source),
          receiver_profile:receiver_id (display_name, x_username, display_name_source)
        `)
                .or(`proposer_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
                .order("updated_at", { ascending: false });

            if (data) setTrades(data as unknown as Trade[]);
            setLoading(false);
        }
        fetchTrades();
    }, [user, supabase]);

    if (authLoading || loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-4xl">🔒</p>
                    <p className="font-bold text-muted">ログインが必要です</p>
                    <Link href="/login" className="btn btn-primary px-6 py-3 inline-flex">
                        ログインする
                    </Link>
                </div>
            </div>
        );
    }

    const actionRequired = trades.filter((t) => {
        const isProposer = t.proposer_id === user.id;
        if (t.status === "PROPOSED" && !isProposer) return true;
        if (["ACCEPTED", "ADDRESS_PENDING"].includes(t.status)) return true;
        if (["SHIPMENT_PENDING", "ADDRESS_LOCKED"].includes(t.status)) return true;
        if (["SHIPPED", "RECEIVED"].includes(t.status)) return true;
        return false;
    });

    const inProgress = trades.filter(
        (t) => !["COMPLETED", "CANCELLED"].includes(t.status)
    );
    const completed = trades.filter((t) => t.status === "COMPLETED");

    function renderTradeCard(trade: Trade) {
        const isProposer = trade.proposer_id === user!.id;
        const myItem = isProposer ? trade.proposer_item : trade.receiver_item;
        const theirItem = isProposer ? trade.receiver_item : trade.proposer_item;
        const partnerName = isProposer
            ? getProfileDisplayName(trade.receiver_profile as DisplayNameProfile, "ユーザー")
            : getProfileDisplayName(trade.proposer_profile as DisplayNameProfile, "ユーザー");
        const statusInfo = STATUS_LABELS[trade.status] || STATUS_LABELS.PROPOSED;
        const StatusIcon = statusInfo.icon;

        return (
            <Link
                key={trade.id}
                href={`/trade/${trade.id}`}
                className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow animate-fade-in-up"
            >
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-border relative">
                        <Image
                            src={myItem?.images?.[0] || "/placeholder.png"}
                            alt=""
                            fill
                            unoptimized
                            sizes="48px"
                            className="object-cover"
                        />
                    </div>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-muted shrink-0" />
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-border relative">
                        <Image
                            src={theirItem?.images?.[0] || "/placeholder.png"}
                            alt=""
                            fill
                            unoptimized
                            sizes="48px"
                            className="object-cover"
                        />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`badge ${statusInfo.color} gap-0.5`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                        </span>
                    </div>
                    <p className="text-xs text-muted truncate">
                        {partnerName || "ユーザー"} との交換
                    </p>
                    <p className="text-[10px] text-muted-light">{formatDate(trade.created_at)}</p>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-light shrink-0" />
            </Link>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface px-4 py-5 border-b border-border">
                <h1 className="text-lg font-bold flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    取引ダッシュボード
                </h1>
                <p className="text-xs text-muted mt-0.5">交換の進行状況を管理</p>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-8">
                {/* Action Required */}
                {actionRequired.length > 0 && (
                    <section className="animate-fade-in-up">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <h2 className="text-sm font-bold text-primary">
                                今やること（{actionRequired.length}件）
                            </h2>
                        </div>
                        <div className="space-y-2">
                            {actionRequired.map(renderTradeCard)}
                        </div>
                    </section>
                )}

                {/* In Progress */}
                <section className="animate-fade-in-up delay-1">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">
                            📦 進行中（{inProgress.length}件）
                        </h2>
                        <Link
                            href="/trade/proposals"
                            className="text-xs text-primary font-bold hover:underline"
                        >
                            提案一覧 →
                        </Link>
                    </div>
                    {inProgress.length === 0 ? (
                        <div className="empty-state card">
                            <Inbox className="h-10 w-10 text-muted opacity-30" />
                            <p className="message">進行中の取引はありません</p>
                            <Link
                                href="/search"
                                className="btn btn-outline text-xs px-4 py-2"
                            >
                                アイテムを探す
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {inProgress.map(renderTradeCard)}
                        </div>
                    )}
                </section>

                {/* Completed */}
                <section className="animate-fade-in-up delay-2">
                    <h2 className="text-sm font-bold mb-3">
                        ✅ 取引履歴（{completed.length}件）
                    </h2>
                    {completed.length === 0 ? (
                        <div className="empty-state card">
                            <CheckCircle2 className="h-10 w-10 text-muted opacity-30" />
                            <p className="message">まだ完了した取引はありません</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {completed.slice(0, 10).map(renderTradeCard)}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
