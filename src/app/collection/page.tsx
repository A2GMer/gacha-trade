"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Layers, ChevronLeft, Eye, EyeOff, ArrowRightLeft, Camera } from "lucide-react";

interface CollectionItem {
    id: string;
    images: string[];
    condition: string;
    is_public: boolean;
    is_tradeable: boolean;
    trade_status?: string;
    catalog_items: { name: string; series: string; manufacturer: string };
}

export default function CollectionPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [items, setItems] = useState<CollectionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "tradeable" | "public" | "private">("all");

    useEffect(() => {
        if (!user) return;
        async function fetchItems() {
            const { data } = await supabase
                .from("user_items")
                .select("id, images, condition, is_public, is_tradeable, trade_status, catalog_items (name, series, manufacturer)")
                .eq("owner_id", user!.id)
                .order("created_at", { ascending: false });

            if (data) setItems(data as unknown as CollectionItem[]);
            setLoading(false);
        }
        fetchItems();
    }, [user, supabase]);

    async function toggleFlag(itemId: string, flag: "is_public" | "is_tradeable", value: boolean) {
        const updates: Record<string, boolean> = { [flag]: value };
        if (flag === "is_tradeable" && value) {
            updates.is_public = true;
        }
        if (flag === "is_public" && !value) {
            updates.is_tradeable = false;
        }
        await supabase.from("user_items").update(updates).eq("id", itemId);
        setItems((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
        );
    }

    const filtered = items.filter((item) => {
        if (filter === "tradeable") return item.is_tradeable;
        if (filter === "public") return item.is_public && !item.is_tradeable;
        if (filter === "private") return !item.is_public;
        return true;
    });

    if (!user) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-4xl">🔒</p>
                    <p className="font-bold text-muted">ログインが必要です</p>
                    <Link href="/login" className="btn btn-primary px-6 py-3 inline-flex">ログインする</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface sticky top-0 z-40 px-4 py-3 border-b border-border flex items-center gap-3">
                <Link href="/mypage" className="p-1 -ml-1 hover:bg-background rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    コレクション
                </h1>
                <Link href="/sell" className="ml-auto btn btn-primary text-xs px-3 py-1.5 gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    出品
                </Link>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-4 space-y-4">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {([
                        { key: "all", label: "すべて" },
                        { key: "tradeable", label: "交換可" },
                        { key: "public", label: "公開" },
                        { key: "private", label: "非公開" },
                    ] as const).map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`badge px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer transition-all ${filter === f.key
                                    ? "bg-primary text-white"
                                    : "bg-background text-muted hover:bg-primary-light hover:text-primary"
                                }`}
                        >
                            {f.label}
                            {f.key !== "all" && (
                                <span className="ml-1 opacity-70">
                                    ({items.filter((item) => {
                                        if (f.key === "tradeable") return item.is_tradeable;
                                        if (f.key === "public") return item.is_public && !item.is_tradeable;
                                        if (f.key === "private") return !item.is_public;
                                        return true;
                                    }).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Items */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state card py-16">
                        <Layers className="h-12 w-12 text-muted opacity-30" />
                        <p className="message">
                            {filter === "all" ? "コレクションにアイテムがありません" : "該当するアイテムがありません"}
                        </p>
                        <Link href="/sell" className="btn btn-primary text-xs px-4 py-2 gap-1">
                            <Camera className="h-3.5 w-3.5" />
                            アイテムを登録する
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((item, i) => (
                            <div
                                key={item.id}
                                className={`card p-3 flex items-center gap-3 animate-fade-in-up delay-${(i % 5) + 1}`}
                            >
                                <Link href={`/item/${item.id}`} className="shrink-0">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border relative">
                                        <img
                                            src={item.images?.[0] || "/placeholder.png"}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                        {item.trade_status === "TRADING" && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="text-white text-[8px] font-bold">取引中</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <Link href={`/item/${item.id}`}>
                                        <p className="text-sm font-bold truncate hover:text-primary transition-colors">
                                            {item.catalog_items?.name}
                                        </p>
                                    </Link>
                                    <p className="text-[10px] text-muted truncate">
                                        {item.catalog_items?.manufacturer} / {item.catalog_items?.series}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`badge text-[8px] ${item.condition === "未開封" ? "bg-accent text-white" :
                                                item.condition === "傷あり" ? "bg-warning text-white" :
                                                    "bg-foreground/70 text-white"
                                            }`}>
                                            {item.condition}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <button
                                        onClick={() => toggleFlag(item.id, "is_tradeable", !item.is_tradeable)}
                                        className={`badge text-[10px] px-2 py-1 gap-0.5 cursor-pointer transition-all ${item.is_tradeable
                                                ? "bg-primary text-white"
                                                : "bg-background text-muted hover:bg-primary-light"
                                            }`}
                                    >
                                        <ArrowRightLeft className="h-3 w-3" />
                                        {item.is_tradeable ? "交換可" : "交換不可"}
                                    </button>
                                    <button
                                        onClick={() => toggleFlag(item.id, "is_public", !item.is_public)}
                                        className={`badge text-[10px] px-2 py-1 gap-0.5 cursor-pointer transition-all ${item.is_public
                                                ? "bg-accent/10 text-accent"
                                                : "bg-background text-muted hover:bg-accent-light"
                                            }`}
                                    >
                                        {item.is_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                        {item.is_public ? "公開" : "非公開"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
