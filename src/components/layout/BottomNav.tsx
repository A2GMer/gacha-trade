"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Camera, Bell, User } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const NAV_ITEMS = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/search", icon: Search, label: "検索" },
    { href: "/sell", icon: Camera, label: "出品", isCenter: true },
    { href: "/notifications", icon: Bell, label: "お知らせ" },
    { href: "/mypage", icon: User, label: "マイページ" },
];

export function BottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    const supabase = createClient();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        async function fetchUnread() {
            const { count } = await supabase
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user!.id)
                .eq("is_read", false);
            setUnreadCount(count || 0);
        }
        fetchUnread();
    }, [user, supabase, pathname]);

    // アイテム詳細画面、提案画面などではBottomNavを非表示にして画面を広く使う
    if (pathname.startsWith("/item/") || pathname.startsWith("/trade/")) {
        return null;
    }

    return (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-2 pt-1 pb-[env(safe-area-inset-bottom,8px)] z-50">
            <div className="flex justify-around items-end">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                    if (item.isCenter) {
                        return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-4">
                                <div className="bg-primary text-white p-3 rounded-2xl border-4 border-white shadow-md transition-transform active:scale-95">
                                    <item.icon className="h-5 w-5" strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-bold text-primary mt-0.5">出品</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors relative ${isActive ? "text-primary" : "text-muted hover:text-foreground"
                                }`}
                        >
                            <div className="relative">
                                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                                {item.href === "/notifications" && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-danger text-white text-[8px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                                {item.label}
                            </span>
                            {isActive && <div className="w-1 h-1 bg-primary rounded-full" />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
