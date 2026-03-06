"use client";

import { useState, useEffect, use } from "react";
import { Star, ShieldCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { getProfileDisplayName } from "@/lib/profile";

interface UserProfile {
    display_name: string;
    avatar_url: string | null;
    rating_avg: number;
    trade_count: number;
    phone_verified: boolean;
    x_username: string | null;
    display_name_source: "manual" | "twitter";
}

interface UserItem {
    id: string;
    images: string[];
    condition: string;
    trade_status?: string;
    is_tradeable: boolean;
    is_public: boolean;
    catalog_items: { name: string };
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [items, setItems] = useState<UserItem[]>([]);
    const [activeTab, setActiveTab] = useState("trading");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const { data: prof } = await supabase
                .from("profiles")
                .select("display_name, avatar_url, rating_avg, trade_count, phone_verified, x_username, display_name_source")
                .eq("id", id)
                .single();

            if (prof) setProfile(prof);

            const { data: userItems } = await supabase
                .from("user_items")
                .select("id, images, condition, trade_status, is_tradeable, is_public, catalog_items (name)")
                .eq("owner_id", id)
                .eq("is_public", true)
                .order("created_at", { ascending: false });

            if (userItems) setItems(userItems as unknown as UserItem[]);
            setLoading(false);
        }
        fetchData();
    }, [id, supabase]);

    const filteredItems = activeTab === "trading"
        ? items.filter((i) => i.is_tradeable)
        : items;

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-4xl">😢</p>
                    <p className="font-bold text-muted">ユーザーが見つかりません</p>
                    <Link href="/" className="btn btn-primary px-6 py-3 inline-flex">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white border-b border-border px-4 pt-4 pb-6">
                <div className="relative z-10">
                    <Link href="/" className="inline-flex p-1 hover:bg-background rounded-lg transition-colors mb-4">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border border-border bg-background flex items-center justify-center text-xl font-bold overflow-hidden">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (profile.display_name || "?")[0]
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-base font-bold">
                                {getProfileDisplayName(profile, "未設定")}
                                {profile.phone_verified && <ShieldCheck className="h-4 w-4 text-accent" />}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted">
                                <div className="flex items-center gap-0.5">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-foreground">{profile.rating_avg || 0}</span>
                                </div>
                                <span>取引 {profile.trade_count || 0}回</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="-mt-6 relative z-20">
                <div className="bg-surface border-y border-border flex rounded-t-[20px] mx-4 overflow-hidden">
                    <button
                        onClick={() => setActiveTab("trading")}
                        className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "trading" ? "border-primary text-primary" : "border-transparent text-muted"}`}
                    >
                        交換に出してる
                    </button>
                    <button
                        onClick={() => setActiveTab("collection")}
                        className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "collection" ? "border-primary text-primary" : "border-transparent text-muted"}`}
                    >
                        コレクション
                    </button>
                </div>
            </div>

            {/* Items */}
            <div className="p-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                        <p className="text-3xl">📦</p>
                        <p className="text-muted font-bold">
                            {activeTab === "trading" ? "交換中のアイテムはありません" : "公開アイテムはありません"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {filteredItems.map((item, i) => (
                            <Link key={item.id} href={`/item/${item.id}`} className={`animate-fade-in-up delay-${i + 1}`}>
                                <div className="aspect-square card overflow-hidden relative group">
                                    <img src={item.images?.[0] || "/placeholder.png"} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    {item.trade_status === "TRADING" && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
                                            <span className="bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">取引中</span>
                                        </div>
                                    )}
                                    <span className={`absolute top-1 left-1 badge text-[8px] z-20 ${item.condition === "未開封" ? "bg-accent text-white" : item.condition === "傷あり" ? "bg-warning text-white" : "bg-foreground/70 text-white"
                                        }`}>
                                        {item.condition}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
