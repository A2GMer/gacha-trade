"use client";

import { useState } from "react";
import { ChevronLeft, Info, Send, Package, MapPin, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

const STEPS = [
    { id: "PROPOSED", label: "提案中" },
    { id: "ACCEPTED", label: "成立" },
    { id: "ADDRESS", label: "住所確定" },
    { id: "SHIPPING", label: "発送" },
    { id: "COMPLETED", label: "完了" },
];

export default function TradeRoom({ params }: { params: { id: string } }) {
    const [status, setStatus] = useState("ADDRESS_LOCKED"); // Mock status

    const trade = {
        me: {
            item: { name: "ちいかわ サッカーボール", condition: "開封済", image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=200&h=200&fit=crop" },
            address: "〒123-4567 東京都渋谷区...",
            isShipped: false,
        },
        partner: {
            name: "たなか",
            item: { name: "ピカチュウ (カプセルフィギュア Vol.1)", condition: "未開封", image: "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=200&h=200&fit=crop" },
            address: "〒987-6543 大阪府大阪市...",
            isShipped: true,
        },
        messages: [
            { sender: "partner", text: "提案ありがとうございます！よろしくお願いいたします。", time: "10:30" },
            { sender: "me", text: "こちらこそ！今日中に発送できるかと思います。", time: "11:15" },
        ],
    };

    return (
        <div className="bg-background min-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white sticky top-0 z-40 p-4 border-b border-border flex items-center justify-between shadow-sm">
                <Link href="/mypage" className="p-1">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="text-center">
                    <h1 className="font-bold text-sm">取引ルーム</h1>
                    <p className="text-[10px] text-muted">相手: {trade.partner.name}さん</p>
                </div>
                <div className="w-8">
                    <Info className="h-5 w-5 text-muted" />
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-white px-6 py-4 border-b border-border">
                <div className="flex justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2"></div>
                    {STEPS.map((step, i) => (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-1">
                            <div className={`w-4 h-4 rounded-full border-2 ${i <= 2 ? "bg-primary border-primary" : "bg-white border-border"
                                }`}>
                                {i <= 2 && <CheckCircle2 className="h-4 w-4 text-white -mt-0.5 -ml-0.5" />}
                            </div>
                            <span className={`text-[8px] font-bold ${i <= 2 ? "text-primary" : "text-muted"
                                }`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
                {/* Trade Items Comparison */}
                <div className="grid grid-cols-2 gap-4 bg-white p-4 card items-center">
                    <div className="space-y-2 text-center">
                        <div className="aspect-square rounded-md overflow-hidden border border-border">
                            <img src={trade.me.item.image} alt="my item" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] font-bold text-muted">あなた</p>
                        <p className="text-xs font-bold line-clamp-1">{trade.me.item.name}</p>
                    </div>
                    <div className="text-center">
                        <div className="h-px bg-border w-full relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-primary font-bold text-xs">交換</div>
                        </div>
                    </div>
                    <div className="space-y-2 text-center absolute left-[50%] translate-x-4 w-[calc(50%-2rem)]">
                        <div className="aspect-square rounded-md overflow-hidden border border-border">
                            <img src={trade.partner.item.image} alt="partner item" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] font-bold text-muted">相手</p>
                        <p className="text-xs font-bold line-clamp-1">{trade.partner.item.name}</p>
                    </div>
                    {/* Overwrite with a better layout side-by-side */}
                    <div className="col-span-2 grid grid-cols-2 gap-8 items-center pt-2">
                        {/* Redefining for better look */}
                    </div>
                </div>

                {/* Re-implementing Item Comparison for better UI */}
                <div className="bg-white p-6 card space-y-4">
                    <h2 className="text-xs font-bold text-muted uppercase flex items-center gap-2">
                        <Package className="h-4 w-4" /> 交換内容
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 text-center">
                            <img src={trade.me.item.image} className="w-20 h-20 mx-auto rounded-lg border border-border object-cover mb-1" />
                            <p className="text-[9px] font-bold text-primary">あなた</p>
                            <p className="text-[10px] truncate">{trade.me.item.name}</p>
                        </div>
                        <div className="bg-primary/10 text-primary p-2 rounded-full">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-center">
                            <img src={trade.partner.item.image} className="w-20 h-20 mx-auto rounded-lg border border-border object-cover mb-1" />
                            <p className="text-[9px] font-bold text-secondary">相手</p>
                            <p className="text-[10px] truncate">{trade.partner.item.name}</p>
                        </div>
                    </div>
                </div>

                {/* Address & Actions */}
                <div className="bg-white p-6 card space-y-4">
                    <h2 className="text-xs font-bold text-muted uppercase flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> お届け先情報
                    </h2>
                    <div className="bg-background p-4 rounded-lg space-y-3">
                        <div>
                            <p className="text-[10px] text-muted">相手のお届け先</p>
                            <p className="text-sm font-medium">{trade.partner.address}</p>
                        </div>
                        <div className="border-t border-border pt-2 flex items-center justify-between">
                            <p className="text-[10px] text-muted">発送状況</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${trade.partner.isShipped ? "bg-secondary/10 text-secondary" : "bg-muted/10 text-muted"
                                }`}>
                                {trade.partner.isShipped ? "発送済み" : "未発送"}
                            </span>
                        </div>
                    </div>

                    <button className="w-full bg-primary text-white font-bold py-3 rounded-lg shadow active:scale-95 transition-all">
                        商品の発送を通知する
                    </button>
                </div>

                {/* Chat */}
                <div className="space-y-4">
                    <h2 className="text-xs font-bold text-muted uppercase px-2">メッセージ</h2>
                    {trade.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender === 'me' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-border rounded-tl-none'
                                }`}>
                                {m.text}
                                <p className={`text-[8px] mt-1 ${m.sender === 'me' ? 'text-white/70 text-right' : 'text-muted'}`}>
                                    {m.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Message Input */}
            <div className="bg-white p-4 border-t border-border pb-10 sm:pb-4 shadow-lg">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="メッセージを入力..."
                        className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button className="bg-primary text-white p-2 rounded-full">
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
