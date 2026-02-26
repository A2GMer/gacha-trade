"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { Bell, MessageSquare, ArrowRightLeft, Package, ChevronRight, Megaphone, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    related_id: string | null;
    is_read: boolean;
    created_at: string;
}

const getIconProps = (type: string) => {
    switch (type) {
        case "proposal": return { icon: ArrowRightLeft, bg: "bg-primary-light", color: "text-primary" };
        case "message": return { icon: MessageSquare, bg: "bg-secondary-light", color: "text-secondary" };
        case "status": return { icon: Package, bg: "bg-accent-light", color: "text-accent" };
        case "dispute": return { icon: AlertTriangle, bg: "bg-danger/10", color: "text-danger" };
        default: return { icon: Megaphone, bg: "bg-background", color: "text-muted" };
    }
};

// 設計方針§10: 重要度で並べ替え
const PRIORITY: Record<string, number> = {
    dispute: 0,
    status: 1,
    proposal: 2,
    message: 3,
    system: 4,
};

const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return "たった今";
    if (diffH < 24) return `${diffH}時間前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}日前`;
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchNotifications() {
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user!.id)
                .order("created_at", { ascending: false });

            if (data) {
                // 重要度でソート（取引関連を最上位に）
                const sorted = [...data].sort((a, b) => {
                    const pa = PRIORITY[a.type] ?? 99;
                    const pb = PRIORITY[b.type] ?? 99;
                    if (pa !== pb) return pa - pb;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                setNotifications(sorted as Notification[]);
            }
            setLoading(false);
        }

        fetchNotifications();

        // 画面を開いた瞬間に未読を既読化する
        const markAsRead = async () => {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", user!.id)
                .eq("is_read", false);
        };
        markAsRead();
    }, [user, supabase]);

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface px-4 py-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-black flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        お知らせ
                    </h1>
                    {notifications.some((n) => !n.is_read) && (
                        <span className="badge bg-primary text-white text-[10px]">
                            {notifications.filter((n) => !n.is_read).length}件未読
                        </span>
                    )}
                </div>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-border">
                {notifications.length === 0 ? (
                    <div className="empty-state py-16">
                        <Bell className="h-12 w-12 text-muted opacity-30" />
                        <p className="message">お知らせはありません</p>
                        <p className="text-xs text-muted">
                            交換の提案や取引の更新があるとここに表示されます
                        </p>
                    </div>
                ) : (
                    notifications.map((notif, i) => {
                        const { icon: Icon, bg, color } = getIconProps(notif.type);
                        const Wrapper = notif.related_id ? Link : "div";

                        return (
                            <Wrapper
                                key={notif.id}
                                href={notif.related_id ? `/trade/${notif.related_id}` : "#"}
                                className={`px-4 py-4 flex items-start gap-3 hover:bg-surface transition-colors animate-fade-in-up delay-${(i % 5) + 1} block ${!notif.is_read ? "bg-primary-light/30" : ""
                                    }`}
                            >
                                <div className={`p-2.5 rounded-2xl shrink-0 ${bg}`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className={`text-sm font-bold truncate ${!notif.is_read ? "text-foreground" : "text-muted"}`}>
                                            {notif.title}
                                        </h3>
                                        {!notif.is_read && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                                    </div>
                                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">{notif.body}</p>
                                    <p className="text-[10px] text-muted-light mt-1 font-medium">{formatTime(notif.created_at)}</p>
                                </div>
                                {notif.related_id && (
                                    <ChevronRight className="h-4 w-4 text-muted-light shrink-0 mt-2" />
                                )}
                            </Wrapper>
                        );
                    })
                )}
            </div>

            {/* Help Info */}
            <div className="mx-4 mt-6">
                <div className="card p-4 bg-accent-light border border-accent/20">
                    <p className="text-xs font-bold text-accent">📧 お困りの際は</p>
                    <p className="text-[10px] text-accent/70 mt-0.5">
                        取引で問題が発生した場合は
                        <Link href="/help" className="underline font-bold">ヘルプ</Link>
                        からサポートへお問い合わせください
                    </p>
                </div>
            </div>
        </div>
    );
}
