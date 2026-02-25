"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, Check, X, ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

interface TradeProposal {
    id: string;
    status: string;
    created_at: string;
    proposer_id: string;
    receiver_id: string;
    proposer_item: {
        id: string;
        images: string[];
        catalog_items: { name: string };
    };
    receiver_item: {
        id: string;
        images: string[];
        catalog_items: { name: string };
    };
    proposer_profile: {
        display_name: string;
    };
    receiver_profile: {
        display_name: string;
    };
}

export default function ProposalsPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
    const [proposals, setProposals] = useState<TradeProposal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchProposals() {
            setLoading(true);
            const column = activeTab === "received" ? "receiver_id" : "proposer_id";

            const { data, error } = await supabase
                .from("trades")
                .select(`
          id,
          status,
          created_at,
          proposer_id,
          receiver_id,
          proposer_item:proposer_item_id (id, images, catalog_items (name)),
          receiver_item:receiver_item_id (id, images, catalog_items (name)),
          proposer_profile:proposer_id (display_name),
          receiver_profile:receiver_id (display_name)
        `)
                .eq(column, user!.id)
                .order("created_at", { ascending: false });

            if (data && !error) {
                setProposals(data as unknown as TradeProposal[]);
            }
            setLoading(false);
        }
        fetchProposals();
    }, [user, activeTab, supabase]);

    const handleAccept = async (tradeId: string) => {
        const { error } = await supabase
            .from("trades")
            .update({ status: "ACCEPTED", updated_at: new Date().toISOString() })
            .eq("id", tradeId);

        if (!error) {
            setProposals((prev) =>
                prev.map((p) => (p.id === tradeId ? { ...p, status: "ACCEPTED" } : p))
            );
        }
    };

    const handleReject = async (tradeId: string) => {
        const { error } = await supabase
            .from("trades")
            .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
            .eq("id", tradeId);

        if (!error) {
            setProposals((prev) =>
                prev.map((p) => (p.id === tradeId ? { ...p, status: "CANCELLED" } : p))
            );
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; class: string }> = {
            PROPOSED: { label: "提案中", class: "bg-primary text-white" },
            ACCEPTED: { label: "成立", class: "bg-accent text-white" },
            SHIPPED: { label: "発送済", class: "bg-secondary text-white" },
            COMPLETED: { label: "完了", class: "bg-success text-white" },
            CANCELLED: { label: "キャンセル", class: "bg-muted text-white" },
            DISPUTE: { label: "紛争中", class: "bg-danger text-white" },
        };
        return map[status] || { label: status, class: "bg-muted text-white" };
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "数分前";
        if (hours < 24) return `${hours}時間前`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}日前`;
        return d.toLocaleDateString("ja-JP");
    };

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface px-4 py-5 border-b border-border">
                <h1 className="text-lg font-black flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                    交換提案
                </h1>
            </div>

            {/* Tabs */}
            <div className="bg-surface border-b border-border flex">
                <button
                    onClick={() => setActiveTab("received")}
                    className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "received" ? "border-primary text-primary" : "border-transparent text-muted"
                        }`}
                >
                    受信した提案
                </button>
                <button
                    onClick={() => setActiveTab("sent")}
                    className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "sent" ? "border-primary text-primary" : "border-transparent text-muted"
                        }`}
                >
                    送信した提案
                </button>
            </div>

            {/* List */}
            <div className="divide-y divide-border">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <Inbox className="h-12 w-12 text-muted mx-auto" />
                        <p className="text-muted font-bold">
                            {activeTab === "received" ? "受信した提案はありません" : "送信した提案はありません"}
                        </p>
                    </div>
                ) : (
                    proposals.map((proposal, i) => {
                        const badge = getStatusBadge(proposal.status);
                        const isReceived = activeTab === "received";
                        const partnerName = isReceived
                            ? proposal.proposer_profile?.display_name || "ユーザー"
                            : proposal.receiver_profile?.display_name || "ユーザー";

                        return (
                            <div
                                key={proposal.id}
                                className={`px-4 py-4 hover:bg-surface transition-colors animate-fade-in-up delay-${i + 1}`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Trade preview images */}
                                    <div className="flex items-center shrink-0">
                                        <img
                                            src={proposal.proposer_item?.images?.[0] || "/placeholder.png"}
                                            className="w-12 h-12 rounded-xl border border-border object-cover"
                                        />
                                        <div className="bg-primary-light text-primary p-1 rounded-full -mx-1 z-10">
                                            <ArrowRightLeft className="h-3 w-3" />
                                        </div>
                                        <img
                                            src={proposal.receiver_item?.images?.[0] || "/placeholder.png"}
                                            className="w-12 h-12 rounded-xl border border-border object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`badge text-[9px] ${badge.class}`}>{badge.label}</span>
                                            <span className="text-[10px] text-muted">{formatDate(proposal.created_at)}</span>
                                        </div>
                                        <p className="text-sm font-bold truncate">{partnerName}さん</p>
                                        <p className="text-[10px] text-muted truncate">
                                            {proposal.proposer_item?.catalog_items?.name} ↔ {proposal.receiver_item?.catalog_items?.name}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    {isReceived && proposal.status === "PROPOSED" ? (
                                        <div className="flex gap-1.5 shrink-0">
                                            <button
                                                onClick={() => handleAccept(proposal.id)}
                                                className="p-2 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-colors"
                                                title="承諾"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(proposal.id)}
                                                className="p-2 bg-danger/5 text-danger rounded-xl hover:bg-danger/10 transition-colors"
                                                title="拒否"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Link href={`/trade/${proposal.id}`} className="shrink-0">
                                            <ChevronRight className="h-5 w-5 text-muted" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
