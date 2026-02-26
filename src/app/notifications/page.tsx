"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { Bell, MessageSquare, ArrowRightLeft, Package, ChevronRight, Megaphone } from "lucide-react";
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
        default: return { icon: Megaphone, bg: "bg-background", color: "text-muted" };
    }
};

const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
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

            if (data) setNotifications(data as Notification[]);
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
                </div>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-border">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-3">
                        <Bell className="h-10 w-10 text-muted mx-auto opacity-30" />
                        <p className="font-bold text-muted">お知らせはありません</p>
                    </div>
                ) : (
                    notifications.map((notif, i) => {
                        const { icon: Icon, bg, color } = getIconProps(notif.type);
                        const Wrapper = notif.related_id ? Link : "div";

                        return (
                            <Wrapper
                                key={notif.id}
                                href={notif.related_id ? `/trade/${notif.related_id}` : "#"}
                                className={`px-4 py-4 flex items-start gap-3 hover:bg-surface transition-colors animate-fade-in-up delay-${(i % 5) + 1} block`}
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
                    <p className="text-[10px] text-accent/70 mt-0.5">取引で問題が発生した場合はヘルプからサポートへお問い合わせください</p>
                </div>
            </div>
        </div>
    );
}
