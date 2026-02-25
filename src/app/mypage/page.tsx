"use client";

import { useState, useEffect } from "react";
import { Settings, ShieldCheck, Star, ChevronRight, Package, Heart, History, MessageSquare, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

interface UserProfile {
    display_name: string;
    rating_avg: number;
    trade_count: number;
    phone_verified: boolean;
}

interface UserItem {
    id: string;
    images: string[];
    is_tradeable: boolean;
    catalog_items: { name: string };
}

export default function MyPage() {
    const { user, signOut } = useAuth();
    const supabase = createClient();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("trading");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [items, setItems] = useState<UserItem[]>([]);
    const [activeTrades, setActiveTrades] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            // プロフィール取得
            const { data: prof } = await supabase
                .from("profiles")
                .select("display_name, rating_avg, trade_count, phone_verified")
                .eq("id", user!.id)
                .single();

            if (prof) setProfile(prof);

            // 自分のアイテム取得
            const { data: myItems } = await supabase
                .from("user_items")
                .select("id, images, is_tradeable, catalog_items (name)")
                .eq("owner_id", user!.id)
                .order("created_at", { ascending: false });

            if (myItems) setItems(myItems as unknown as UserItem[]);

            // 進行中取引数
            const { count } = await supabase
                .from("trades")
                .select("id", { count: "exact", head: true })
                .or(`proposer_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
                .not("status", "in", "(COMPLETED,CANCELLED)");

            setActiveTrades(count || 0);
            setLoading(false);
        }
        fetchData();
    }, [user, supabase]);

    const filteredItems = activeTab === "trading"
        ? items.filter((i) => i.is_tradeable)
        : items;

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Profile Header */}
            <div className="gradient-hero text-white px-4 pt-8 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[20px] border-2 border-white/30 shadow-lg bg-white/20 flex items-center justify-center text-2xl font-black">
                            {(profile?.display_name || "?")[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-lg font-black">
                                {profile?.display_name || "ユーザー"}
                                {profile?.phone_verified && <ShieldCheck className="h-5 w-5 text-white/80" />}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/80">
                                <div className="flex items-center gap-0.5">
                                    <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                                    <span className="font-bold text-white">{profile?.rating_avg || 0}</span>
                                </div>
                                <span>取引 {profile?.trade_count || 0}回</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <div className="card mx-4 -mt-10 relative z-20 p-4 animate-bounce-in">
                <div className="grid grid-cols-3 gap-1">
                    {[
                        { label: "進行中", count: activeTrades, icon: History, color: "text-primary", href: "/trade/proposals" },
                        { label: "持ち物", count: items.length, icon: Package, color: "text-accent", href: null },
                        { label: "交換中", count: filteredItems.length, icon: MessageSquare, color: "text-secondary", href: null },
                    ].map((stat, i) => (
                        <Link
                            key={i}
                            href={stat.href || "#"}
                            className="flex flex-col items-center gap-1 py-2 cursor-pointer hover:bg-background rounded-2xl transition-colors"
                        >
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            <span className="text-lg font-black">{stat.count}</span>
                            <span className="text-[9px] text-muted font-bold">{stat.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* X Share Banner */}
            <div className="mx-4 mt-4">
                <div className="card p-4 bg-foreground text-white animate-fade-in-up delay-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-2xl shrink-0">
                            <XLogo className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">Xで交換相手を募集 🎯</p>
                            <p className="text-[10px] text-white/60">あなたのコレクションをXでシェアしよう</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 bg-surface border-y border-border flex">
                <button
                    onClick={() => setActiveTab("trading")}
                    className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "trading" ? "border-primary text-primary" : "border-transparent text-muted"}`}
                >
                    交換に出してる ({items.filter(i => i.is_tradeable).length})
                </button>
                <button
                    onClick={() => setActiveTab("collection")}
                    className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "collection" ? "border-primary text-primary" : "border-transparent text-muted"}`}
                >
                    コレクション ({items.length})
                </button>
            </div>

            {/* Items */}
            <div className="p-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                        <p className="text-3xl">📦</p>
                        <p className="text-muted font-bold">{activeTab === "trading" ? "交換中のアイテムはありません" : "アイテムがありません"}</p>
                        <Link href="/sell" className="btn btn-primary px-6 py-2 inline-flex text-sm">
                            アイテムを登録する
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {filteredItems.map((item, i) => (
                            <Link key={item.id} href={`/item/${item.id}`} className={`animate-fade-in-up delay-${i + 1}`}>
                                <div className="aspect-square card overflow-hidden relative group">
                                    <img src={item.images?.[0] || "/placeholder.png"} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Menu List */}
            <div className="card mx-4 mt-2 divide-y divide-border">
                {[
                    { label: "交換提案を見る", href: "/trade/proposals", statusColor: "" },
                    { label: "カタログ追加申請", href: "#", statusColor: "" },
                    { label: "ヘルプ・ガイド", href: "#", statusColor: "" },
                ].map((item, i) => (
                    <Link key={i} href={item.href} className="px-5 py-4 flex items-center justify-between hover:bg-background cursor-pointer transition-colors first:rounded-t-[16px] last:rounded-b-[16px]">
                        <span className="text-sm font-medium">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-light" />
                    </Link>
                ))}
                <button
                    onClick={handleSignOut}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-danger/5 cursor-pointer transition-colors rounded-b-[16px] text-danger"
                >
                    <span className="text-sm font-medium flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        ログアウト
                    </span>
                </button>
            </div>
        </div>
    );
}
