"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Star,
    ChevronRight,
    Package,
    Heart,
    LogOut,
    Layers,
    ArrowRightLeft,
    Settings,
    HelpCircle,
    Camera,
    Eye,
    MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "@/components/settings/ProfileSettings";

interface UserProfile {
    display_name: string;
    avatar_url: string | null;
    rating_avg: number;
    trade_count: number;
    phone_verified: boolean;
    role: string;
}

interface ItemStats {
    total: number;
    tradeable: number;
}

export default function MyPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const supabase = createClient();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<ItemStats>({ total: 0, tradeable: 0 });
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        const [profRes, itemsRes] = await Promise.all([
            supabase
                .from("profiles")
                .select("display_name, avatar_url, rating_avg, trade_count, phone_verified, role")
                .eq("id", user.id)
                .single(),
            supabase
                .from("user_items")
                .select("id, is_tradeable")
                .eq("owner_id", user.id),
        ]);

        if (profRes.data) setProfile(profRes.data);
        if (itemsRes.data) {
            setStats({
                total: itemsRes.data.length,
                tradeable: itemsRes.data.filter((i) => i.is_tradeable).length,
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user, supabase]);

    async function handleSignOut() {
        await signOut();
        router.push("/");
    }

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

    const menuItems = [
        { href: "/dashboard", icon: ArrowRightLeft, label: "取引ダッシュボード", color: "text-primary", bg: "bg-primary-light" },
        { href: "/collection", icon: Layers, label: "コレクション", badge: `${stats.total}件`, color: "text-accent", bg: "bg-accent-light" },
        { href: "/wants", icon: Heart, label: "ほしいアイテム", color: "text-secondary", bg: "bg-secondary-light" },
        { href: "/sell", icon: Camera, label: "出品する", color: "text-primary", bg: "bg-primary-light" },
        { href: `/user/${user.id}`, icon: Eye, label: "自分の公開ページを見る", color: "text-muted", bg: "bg-background" },
    ];

    const subMenuItems = [
        { href: "/trade/proposals", icon: Package, label: "提案一覧" },
        { href: "/contact", icon: MessageSquare, label: "お問い合わせ" },
        { href: "/help", icon: HelpCircle, label: "ヘルプ・ガイド" },
    ];

    if (profile?.role === "admin") {
        subMenuItems.push({ href: "/admin", icon: ShieldCheck, label: "管理者ダッシュボード" });
    }

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Profile Header */}
            <div className="bg-white border-b border-border px-4 pt-6 pb-8">
                <div className="container mx-auto max-w-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border border-border bg-background flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (profile?.display_name || "?")[0]
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-base font-bold">
                                <span className="truncate">{profile?.display_name || "未設定"}</span>
                                {profile?.phone_verified && (
                                    <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted mt-0.5">
                                <div className="flex items-center gap-0.5">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-foreground">{profile?.rating_avg || 0}</span>
                                </div>
                                <span>取引 {profile?.trade_count || 0}回</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-lg border border-border hover:bg-background transition-colors"
                        >
                            <Settings className="h-5 w-5 text-muted" />
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-background rounded-lg p-3 text-center">
                            <p className="text-xl font-bold">{stats.tradeable}</p>
                            <p className="text-[10px] text-muted">交換可能</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center">
                            <p className="text-xl font-bold">{stats.total}</p>
                            <p className="text-[10px] text-muted">コレクション</p>
                        </div>
                    </div>

                    {!profile?.phone_verified && (
                        <button
                            onClick={() => { setShowSettings(true); }}
                            className="mt-3 w-full bg-warning/10 rounded-lg p-3 text-left hover:bg-warning/15 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-warning" />
                                <p className="text-xs font-semibold text-foreground">本人確認がまだ完了していません</p>
                            </div>
                            <p className="text-[10px] text-muted mt-0.5 ml-6">
                                タップして電話番号を認証 →
                            </p>
                        </button>
                    )}
                </div>
            </div>

            {/* Menu */}
            <div className="container mx-auto max-w-2xl px-4 mt-4 space-y-3">
                <div className="card overflow-hidden">
                    {menuItems.map((item, i) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-background transition-colors ${i < menuItems.length - 1 ? "border-b border-border" : ""
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${item.bg}`}>
                                <item.icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                            <span className="flex-1 text-sm font-semibold">{item.label}</span>
                            {item.badge && (
                                <span className="badge bg-background text-muted text-[10px]">{item.badge}</span>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-light" />
                        </Link>
                    ))}
                </div>

                <div className="card overflow-hidden">
                    {subMenuItems.map((item, i) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-background transition-colors ${i < subMenuItems.length - 1 ? "border-b border-border" : ""
                                }`}
                        >
                            <item.icon className="h-4 w-4 text-muted" />
                            <span className="flex-1 text-sm font-medium text-muted">{item.label}</span>
                            <ChevronRight className="h-4 w-4 text-muted-light" />
                        </Link>
                    ))}
                </div>

                <button
                    onClick={handleSignOut}
                    className="card w-full flex items-center gap-3 px-4 py-3.5 hover:bg-danger/5 transition-colors"
                >
                    <LogOut className="h-4 w-4 text-danger" />
                    <span className="text-sm font-medium text-danger">ログアウト</span>
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <ProfileSettings onClose={() => setShowSettings(false)} onSaved={() => fetchData()} />
            )}
        </div>
    );
}
