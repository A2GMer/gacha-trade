"use client";

import { useState } from "react";
import { Settings, ShieldCheck, Star, ChevronRight, Package, Heart, History, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export default function MyPage() {
    const [activeTab, setActiveTab] = useState("trading");

    const user = {
        name: "ひろき",
        rating: 5.0,
        tradeCount: 12,
        smsVerified: true,
        avatar: "https://ui-avatars.com/api/?name=HR&background=E6002D&color=fff&bold=true",
    };

    const mockItems = [
        { id: "1", image: "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=200&h=200&fit=crop", watchCount: 14 },
        { id: "2", image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=200&h=200&fit=crop", watchCount: 8 },
        { id: "3", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&h=200&fit=crop", watchCount: 23 },
        { id: "4", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&h=200&fit=crop", watchCount: 5 },
        { id: "5", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc19?w=200&h=200&fit=crop", watchCount: 31 },
        { id: "6", image: "https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=200&h=200&fit=crop", watchCount: 19 },
    ];

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Profile Header with gradient */}
            <div className="gradient-hero text-white px-4 pt-8 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-[20px] border-2 border-white/30 shadow-lg" />
                        <div>
                            <div className="flex items-center gap-1.5 text-lg font-black">
                                {user.name}
                                {user.smsVerified && <ShieldCheck className="h-5 w-5 text-white/80" />}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/80">
                                <div className="flex items-center gap-0.5">
                                    <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                                    <span className="font-bold text-white">{user.rating}</span>
                                </div>
                                <span>取引 {user.tradeCount}回</span>
                            </div>
                        </div>
                    </div>
                    <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors backdrop-blur-sm">
                        <Settings className="h-5 w-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Stats Card (overlapping hero) */}
            <div className="card mx-4 -mt-10 relative z-20 p-4 animate-bounce-in">
                <div className="grid grid-cols-4 gap-1">
                    {[
                        { label: "進行中", count: 2, icon: History, color: "text-primary" },
                        { label: "メッセージ", count: 5, icon: MessageSquare, color: "text-secondary" },
                        { label: "いいね", count: 12, icon: Heart, color: "text-primary" },
                        { label: "持ち物", count: 24, icon: Package, color: "text-accent" },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 py-2 cursor-pointer hover:bg-background rounded-2xl transition-colors">
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            <span className="text-lg font-black">{stat.count}</span>
                            <span className="text-[9px] text-muted font-bold">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* X Share Recruit Banner */}
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
                        <button className="btn bg-white text-foreground hover:bg-white/90 text-xs px-4 py-2 shrink-0">
                            募集する
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 bg-surface border-y border-border flex">
                <button
                    onClick={() => setActiveTab("trading")}
                    className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "trading" ? "border-primary text-primary" : "border-transparent text-muted"
                        }`}
                >
                    交換に出してる
                </button>
                <button
                    onClick={() => setActiveTab("collection")}
                    className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === "collection" ? "border-primary text-primary" : "border-transparent text-muted"
                        }`}
                >
                    コレクション
                </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                    {mockItems.map((item, i) => (
                        <Link key={item.id} href={`/item/${item.id}`} className={`animate-fade-in-up delay-${i + 1}`}>
                            <div className="aspect-square card overflow-hidden relative group">
                                <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute bottom-1.5 right-1.5 badge bg-black/50 text-white backdrop-blur-sm text-[9px]">
                                    👀 {item.watchCount}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Menu List */}
            <div className="card mx-4 mt-2 divide-y divide-border">
                {[
                    { label: "本人確認（SMS認証）", status: "認証済み", statusColor: "text-accent" },
                    { label: "住所設定（取引時のみ使用）", status: "未登録", statusColor: "text-muted" },
                    { label: "カタログ追加申請", status: "", statusColor: "" },
                    { label: "ヘルプ・ガイド", status: "", statusColor: "" },
                ].map((item, i) => (
                    <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-background cursor-pointer transition-colors first:rounded-t-[16px] last:rounded-b-[16px]">
                        <span className="text-sm font-medium">{item.label}</span>
                        <div className="flex items-center gap-2">
                            {item.status && (
                                <span className={`text-xs font-bold ${item.statusColor}`}>{item.status}</span>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-light" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
