"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Camera, Bell, User } from "lucide-react";

const NAV_ITEMS = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/search", icon: Search, label: "検索" },
    { href: "/sell", icon: Camera, label: "出品", isCenter: true },
    { href: "/notifications", icon: Bell, label: "お知らせ" },
    { href: "/mypage", icon: User, label: "マイページ" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/20 px-2 pt-1 pb-[env(safe-area-inset-bottom,8px)] z-50">
            <div className="flex justify-around items-end">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;

                    if (item.isCenter) {
                        return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-5">
                                <div className="bg-primary text-white p-3.5 rounded-[20px] border-4 border-background shadow-lg animate-pulse-glow transition-transform active:scale-90">
                                    <item.icon className="h-6 w-6" strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-bold text-primary mt-0.5">出品</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-colors ${isActive ? "text-primary" : "text-muted hover:text-foreground"
                                }`}
                        >
                            <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="w-1 h-1 bg-primary rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
