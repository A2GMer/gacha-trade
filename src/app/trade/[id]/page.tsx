"use client";

import { useState } from "react";
import { ChevronLeft, Info, Send, Package, MapPin, CheckCircle2, ArrowRightLeft, Clock, Truck } from "lucide-react";
import Link from "next/link";

const STEPS = [
    { id: "PROPOSED", label: "提案", icon: "📩" },
    { id: "ACCEPTED", label: "成立", icon: "🤝" },
    { id: "ADDRESS", label: "住所", icon: "📍" },
    { id: "SHIPPING", label: "発送", icon: "📦" },
    { id: "COMPLETED", label: "完了", icon: "✅" },
];

export default function TradeRoom({ params }: { params: Promise<{ id: string }> }) {
    const [message, setMessage] = useState("");
    const currentStepIndex = 3; // Mock: at SHIPPING

    const trade = {
        me: {
            item: { name: "ちいかわ サッカーボール", condition: "開封済", image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=200&h=200&fit=crop" },
            address: "〒123-4567 東京都渋谷区...",
            isShipped: false,
        },
        partner: {
            name: "たなか",
            avatar: "https://ui-avatars.com/api/?name=TN&background=E6002D&color=fff&bold=true",
            item: { name: "ピカチュウ (カプセルフィギュア Vol.1)", condition: "未開封", image: "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=200&h=200&fit=crop" },
            address: "〒987-6543 大阪府大阪市...",
            isShipped: true,
        },
        messages: [
            { sender: "partner", text: "提案ありがとうございます！よろしくお願いいたします。", time: "10:30" },
            { sender: "me", text: "こちらこそ！今日中に発送できるかと思います。", time: "11:15" },
            { sender: "partner", text: "ありがとうございます！到着楽しみにしてます😄", time: "11:20" },
        ],
    };

    return (
        <div className="bg-background min-h-screen flex flex-col">
            {/* Header */}
            <div className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <Link href="/mypage" className="p-1 hover:bg-primary-light rounded-2xl transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="text-center flex items-center gap-2">
                    <img src={trade.partner.avatar} alt="" className="w-7 h-7 rounded-xl" />
                    <div className="text-left">
                        <h1 className="font-bold text-sm leading-none">{trade.partner.name}さん</h1>
                        <p className="text-[10px] text-muted">との取引</p>
                    </div>
                </div>
                <button className="p-1 hover:bg-primary-light rounded-2xl transition-colors">
                    <Info className="h-5 w-5 text-muted" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-surface px-4 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-0">
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${i <= currentStepIndex
                                        ? "bg-primary text-white shadow-md"
                                        : "bg-background text-muted border border-border"
                                    }`}>
                                    {i < currentStepIndex ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <span>{step.icon}</span>
                                    )}
                                </div>
                                <span className={`text-[9px] font-bold ${i <= currentStepIndex ? "text-primary" : "text-muted"
                                    }`}>{step.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-4 sm:w-8 h-0.5 rounded mx-0.5 mb-4 ${i < currentStepIndex ? "bg-primary" : "bg-border"
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
                {/* Trade Summary Card */}
                <div className="card p-5 animate-fade-in-up">
                    <h2 className="text-xs font-bold text-muted uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                        <ArrowRightLeft className="h-4 w-4" /> 交換内容
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 text-center">
                            <img src={trade.me.item.image} className="w-16 h-16 mx-auto rounded-2xl border border-border object-cover mb-1 shadow-sm" />
                            <p className="badge bg-primary-light text-primary text-[8px] mx-auto">あなた</p>
                            <p className="text-[10px] font-bold mt-0.5 truncate">{trade.me.item.name}</p>
                        </div>
                        <div className="bg-primary-light text-primary p-2 rounded-full animate-pulse">
                            <ArrowRightLeft className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-center">
                            <img src={trade.partner.item.image} className="w-16 h-16 mx-auto rounded-2xl border border-border object-cover mb-1 shadow-sm" />
                            <p className="badge bg-secondary-light text-secondary text-[8px] mx-auto">相手</p>
                            <p className="text-[10px] font-bold mt-0.5 truncate">{trade.partner.item.name}</p>
                        </div>
                    </div>
                </div>

                {/* Shipping Status Card */}
                <div className="card p-5 space-y-4 animate-fade-in-up delay-1">
                    <h2 className="text-xs font-bold text-muted uppercase flex items-center gap-1.5 tracking-wider">
                        <Truck className="h-4 w-4" /> 発送状況
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-background rounded-2xl">
                            <div className="flex items-center gap-2">
                                <img src={trade.partner.avatar} alt="" className="w-8 h-8 rounded-xl" />
                                <div>
                                    <p className="text-xs font-bold">{trade.partner.name}さん</p>
                                    <p className="text-[10px] text-muted">相手の発送</p>
                                </div>
                            </div>
                            <span className="badge bg-accent text-white">✓ 発送済み</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-background rounded-2xl">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xs">自</div>
                                <div>
                                    <p className="text-xs font-bold">あなた</p>
                                    <p className="text-[10px] text-muted">あなたの発送</p>
                                </div>
                            </div>
                            <span className="badge bg-warning text-white">⏳ 未発送</span>
                        </div>
                    </div>
                    <button className="btn btn-primary w-full py-3">
                        <Truck className="h-4 w-4" />
                        商品の発送を通知する
                    </button>
                </div>

                {/* Address Card */}
                <div className="card p-5 space-y-3 animate-fade-in-up delay-2">
                    <h2 className="text-xs font-bold text-muted uppercase flex items-center gap-1.5 tracking-wider">
                        <MapPin className="h-4 w-4" /> お届け先
                    </h2>
                    <div className="bg-background p-4 rounded-2xl">
                        <p className="text-[10px] text-muted mb-1">相手のお届け先</p>
                        <p className="text-sm font-bold">{trade.partner.address}</p>
                    </div>
                </div>

                {/* Chat */}
                <div className="space-y-3 animate-fade-in-up delay-3">
                    <h2 className="text-xs font-bold text-muted uppercase px-1 tracking-wider">メッセージ</h2>
                    {trade.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            {m.sender !== 'me' && (
                                <img src={trade.partner.avatar} alt="" className="w-7 h-7 rounded-xl mr-2 mt-1 shrink-0" />
                            )}
                            <div className={`max-w-[75%] p-3 text-sm leading-relaxed ${m.sender === 'me'
                                    ? 'bg-primary text-white rounded-[20px] rounded-tr-md'
                                    : 'bg-surface border border-border rounded-[20px] rounded-tl-md'
                                }`}>
                                {m.text}
                                <p className={`text-[9px] mt-1 ${m.sender === 'me' ? 'text-white/50 text-right' : 'text-muted'}`}>
                                    {m.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Message Input */}
            <div className="glass border-t border-white/20 p-3 pb-[env(safe-area-inset-bottom,12px)] sm:pb-3">
                <div className="flex gap-2 max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    <button className="btn btn-primary p-3 shrink-0">
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
