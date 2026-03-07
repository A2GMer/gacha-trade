"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Heart, Plus, Trash2, Search, ChevronLeft } from "lucide-react";

interface CatalogItem {
    id: string;
    name: string;
    manufacturer: string;
    series: string;
    image_url: string | null;
}

interface WantItem {
    id: string;
    catalog_item_id: string;
    catalog_items: CatalogItem;
}

export default function WantsPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [wants, setWants] = useState<WantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([]);
    const [searching, setSearching] = useState(false);

    const fetchWants = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from("wants")
            .select("id, catalog_item_id, catalog_items (*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (data) setWants(data as unknown as WantItem[]);
        setLoading(false);
    }, [user, supabase]);

    useEffect(() => {
        if (!user) return;

        let isActive = true;
        supabase
            .from("wants")
            .select("id, catalog_item_id, catalog_items (*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
                if (!isActive) return;
                if (data) setWants(data as unknown as WantItem[]);
                setLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [user, supabase]);

    async function searchCatalog(query: string) {
        setSearchQuery(query);
        if (query.length < 2) {
            setCatalogResults([]);
            return;
        }
        setSearching(true);
        const { data } = await supabase
            .from("catalog_items")
            .select("*")
            .or(`name.ilike.%${query}%,series.ilike.%${query}%,manufacturer.ilike.%${query}%`)
            .eq("is_approved", true)
            .limit(20);

        if (data) setCatalogResults(data);
        setSearching(false);
    }

    async function addWant(catalogItemId: string) {
        if (!user) return;
        await supabase.from("wants").insert({
            user_id: user.id,
            catalog_item_id: catalogItemId,
        });
        setShowAdd(false);
        setSearchQuery("");
        setCatalogResults([]);
        fetchWants();
    }

    async function removeWant(wantId: string) {
        await supabase.from("wants").delete().eq("id", wantId);
        setWants((prev) => prev.filter((w) => w.id !== wantId));
    }

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
                    <Heart className="h-4 w-4 text-primary" />
                    ほしいアイテム
                </h1>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="ml-auto btn btn-primary text-xs px-3 py-1.5 gap-1"
                >
                    <Plus className="h-3.5 w-3.5" />
                    追加
                </button>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-4 space-y-4">
                {/* Add Panel */}
                {showAdd && (
                    <div className="card p-4 space-y-3 animate-fade-in-up border-2 border-primary/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => searchCatalog(e.target.value)}
                                placeholder="カタログからアイテムを検索..."
                                className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none"
                                autoFocus
                            />
                        </div>
                        {searching && (
                            <div className="flex justify-center py-4">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        )}
                        {catalogResults.length > 0 && (
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                {catalogResults.map((item) => {
                                    const alreadyAdded = wants.some(
                                        (w) => w.catalog_item_id === item.id
                                    );
                                    return (
                                        <button
                                            key={item.id}
                                            disabled={alreadyAdded}
                                            onClick={() => addWant(item.id)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${alreadyAdded
                                                    ? "opacity-50 cursor-not-allowed bg-background"
                                                    : "hover:bg-primary-light"
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-background border border-border overflow-hidden shrink-0 relative">
                                                {item.image_url && (
                                                    <Image src={item.image_url} alt="" fill unoptimized sizes="40px" className="object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{item.name}</p>
                                                <p className="text-[10px] text-muted truncate">
                                                    {item.manufacturer} / {item.series}
                                                </p>
                                            </div>
                                            {alreadyAdded ? (
                                                <span className="text-[10px] text-muted font-bold">追加済み</span>
                                            ) : (
                                                <Plus className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Want List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : wants.length === 0 ? (
                    <div className="empty-state card py-16">
                        <Heart className="h-12 w-12 text-muted opacity-30" />
                        <p className="message">まだ欲しいアイテムが登録されていません</p>
                        <p className="text-xs text-muted">
                            上の「追加」ボタンからカタログのアイテムを追加できます
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {wants.map((w, i) => (
                            <div
                                key={w.id}
                                className={`card p-3 flex items-center gap-3 animate-fade-in-up delay-${(i % 5) + 1}`}
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0 relative">
                                    {w.catalog_items?.image_url && (
                                        <Image
                                            src={w.catalog_items.image_url}
                                            alt=""
                                            fill
                                            unoptimized
                                            sizes="56px"
                                            className="object-cover"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">
                                        {w.catalog_items?.name}
                                    </p>
                                    <p className="text-[10px] text-muted truncate">
                                        {w.catalog_items?.manufacturer} / {w.catalog_items?.series}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href={`/search?q=${encodeURIComponent(w.catalog_items?.name || "")}`}
                                        className="btn btn-outline text-[10px] px-2.5 py-1.5 gap-1"
                                    >
                                        <Search className="h-3 w-3" />
                                        検索
                                    </Link>
                                    <button
                                        onClick={() => removeWant(w.id)}
                                        className="p-2 text-muted hover:text-danger hover:bg-danger/5 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
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
