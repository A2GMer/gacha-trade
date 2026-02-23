"use client";

import { useState } from "react";
import { Settings, ShieldCheck, Star, ChevronRight, Package, Heart, History, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function MyPage() {
    const [activeTab, setActiveTab] = useState("trading");

    const user = {
        name: "ひろき",
        rating: 5.0,
        tradeCount: 12,
        smsVerified: true,
        avatar: "https://ui-avatars.com/api/?name=HR&background=random",
    };

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white p-6 border-b border-border">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border border-border" />
                        <div>
                            <div className="flex items-center gap-1 text-lg font-bold">
                                {user.name}
                                {user.smsVerified && <ShieldCheck className="h-5 w-5 text-secondary fill-secondary/10" />}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted">
                                <div className="flex items-center gap-0.5">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-foreground">{user.rating}</span>
                                </div>
                                <span>取引回数: {user.tradeCount}回</span>
                            </div>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-background rounded-full transition-colors">
                        <Settings className="h-6 w-6 text-muted" />
                    </button>
                </div>

                {/* Quick Stats/Links */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: "進行中", count: 2, icon: History },
                        { label: "メッセージ", count: 5, icon: MessageSquare },
                        { label: "いいね", count: 12, icon: Heart },
                        { label: "持ち物", count: 24, icon: Package },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 py-2">
                            <stat.icon className="h-5 w-5 text-muted" />
                            <span className="text-[10px] text-muted">{stat.label}</span>
                            <span className="text-xs font-bold">{stat.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-border flex">
                <button
                    onClick={() => setActiveTab("trading")}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "trading" ? "border-primary text-primary" : "border-transparent text-muted"
                        }`}
                >
                    交換に出してる
                </button>
                <button
                    onClick={() => setActiveTab("collection")}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "collection" ? "border-primary text-primary" : "border-transparent text-muted"
                        }`}
                >
                    コレクション
                </button>
            </div>

            {/* Tab Content (Mock) */}
            <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square bg-white card animate-pulse overflow-hidden relative">
                            <div className="absolute inset-0 bg-border/50 flex items-center justify-center">
                                <Package className="h-8 w-8 text-border" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu List */}
            <div className="bg-white mt-4 border-y border-border divide-y divide-border">
                {[
                    { label: "本人確認（SMS認証）", status: "認証済み", color: "text-secondary" },
                    { label: "住所設定（取引時のみ使用）", status: "未登録" },
                    { label: "カタログ追加申請", status: "" },
                    { label: "ヘルプ・ガイド", status: "" },
                ].map((item, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-background cursor-pointer transition-colors">
                        <span className="text-sm font-medium">{item.label}</span>
                        <div className="flex items-center gap-2">
                            {item.status && <span className={`text-xs ${item.color || "text-muted"}`}>{item.status}</span>}
                            <ChevronRight className="h-4 w-4 text-border" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
