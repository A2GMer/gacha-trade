"use client";

import Link from "next/link";
import { Star, ShieldCheck, Flag, Ban, ChevronLeft, MessageCircle, Heart, Eye, Share2 } from "lucide-react";
import { shareOnX } from "@/lib/share";
import { useState } from "react";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

const getItemData = (id: string) => {
    return {
        id,
        name: "ピカチュウ (カプセルフィギュア Vol.1)",
        manufacturer: "ポケモン",
        series: "カプセルフィギュア Vol.1",
        condition: "未開封",
        watchCount: 14,
        images: [
            "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=800&fit=crop",
        ],
        description: "カプセルから出したばかりの未開封品です。ミニブックも付属します。ダブってしまったので、リザードンか他の同シリーズアイテムと交換希望です。",
        user: {
            id: "u1",
            name: "たなか",
            rating: 4.8,
            trade_count: 52,
            smsVerified: true,
            avatar: "https://ui-avatars.com/api/?name=TN&background=E6002D&color=fff&bold=true",
        },
    };
};

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [liked, setLiked] = useState(false);

    // Use a default ID for now (would use React.use(params) in production)
    const item = getItemData("1");

    return (
        <div className="bg-background min-h-screen pb-28 sm:pb-8">
            {/* Mobile Top Header */}
            <div className="sm:hidden sticky top-0 glass z-40 px-4 py-3 flex items-center justify-between">
                <Link href="/" className="p-1 hover:bg-primary-light rounded-2xl transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-primary-light rounded-2xl transition-colors">
                        <Flag className="h-5 w-5 text-muted" />
                    </button>
                    <button className="p-2 hover:bg-primary-light rounded-2xl transition-colors">
                        <Ban className="h-5 w-5 text-muted" />
                    </button>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl sm:py-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Left: Images */}
                <div className="space-y-3 animate-fade-in">
                    <div className="aspect-square bg-surface rounded-[20px] overflow-hidden border border-border sm:shadow-md">
                        <img
                            src={item.images[selectedImage]}
                            alt={item.name}
                            className="w-full h-full object-cover transition-opacity duration-300"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2 px-4 sm:px-0">
                        {item.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedImage(i)}
                                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === i
                                        ? "border-primary shadow-md scale-[1.02]"
                                        : "border-border hover:border-muted"
                                    }`}
                            >
                                <img src={img} alt={`${item.name} ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="px-4 sm:px-0 space-y-4 animate-fade-in-up">
                    {/* Main info card */}
                    <div className="card p-5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h1 className="text-xl font-black mb-2 leading-tight">{item.name}</h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`badge ${item.condition === "未開封" ? "bg-accent text-white" : "bg-foreground/70 text-white"
                                        }`}>
                                        {item.condition}
                                    </span>
                                    <span className="badge bg-background text-muted">
                                        {item.manufacturer} / {item.series}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setLiked(!liked)}
                                className={`p-2.5 rounded-2xl transition-all ${liked ? "bg-primary-light" : "bg-background hover:bg-primary-light"
                                    }`}
                            >
                                <Heart className={`h-6 w-6 transition-colors ${liked ? "fill-primary text-primary" : "text-muted"}`} />
                            </button>
                        </div>

                        {/* Watch count badge */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-muted">
                                <Eye className="h-4 w-4" />
                                <span><strong className="text-foreground">{item.watchCount}人</strong>が注目中</span>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4">
                            <h2 className="text-xs font-bold text-muted uppercase mb-2 tracking-wider">商品の説明</h2>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.description}</p>
                        </div>
                    </div>

                    {/* X Share Card */}
                    <div className="card p-4 bg-foreground text-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2.5 rounded-2xl">
                                <XLogo className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm">このアイテムをXで拡散 🎯</p>
                                <p className="text-xs text-white/60">交換相手が見つかりやすくなります</p>
                            </div>
                            <button
                                onClick={() => shareOnX({
                                    itemName: item.name,
                                    condition: item.condition,
                                    series: item.series,
                                    manufacturer: item.manufacturer,
                                    itemId: item.id,
                                })}
                                className="btn bg-white text-foreground hover:bg-white/90 text-xs px-4 py-2"
                            >
                                シェアする
                            </button>
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="card p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={item.user.avatar} alt={item.user.name} className="w-12 h-12 rounded-2xl border border-border" />
                            <div>
                                <div className="flex items-center gap-1 font-bold">
                                    {item.user.name}
                                    {item.user.smsVerified && <ShieldCheck className="h-4 w-4 text-accent" />}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted">
                                    <div className="flex items-center gap-0.5">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-foreground">{item.user.rating}</span>
                                    </div>
                                    <span>取引 {item.user.trade_count}回</span>
                                </div>
                            </div>
                        </div>
                        <Link href={`/user/${item.user.id}`} className="text-sm text-primary font-bold hover:underline">
                            一覧 →
                        </Link>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden sm:flex gap-3">
                        <button className="btn btn-primary flex-1 py-4 text-base">
                            <MessageCircle className="h-5 w-5" />
                            交換を提案する
                        </button>
                        <button
                            onClick={() => shareOnX({
                                itemName: item.name,
                                condition: item.condition,
                                series: item.series,
                                manufacturer: item.manufacturer,
                                itemId: item.id,
                            })}
                            className="btn btn-x px-5 py-4"
                        >
                            <XLogo className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Action Bar */}
            <div className="sm:hidden fixed bottom-16 left-0 right-0 p-3 glass border-t border-white/20 z-40">
                <div className="flex gap-2">
                    <button className="btn btn-primary flex-1 py-3.5">
                        <MessageCircle className="h-5 w-5" />
                        交換を提案する
                    </button>
                    <button
                        onClick={() => shareOnX({
                            itemName: item.name,
                            condition: item.condition,
                            series: item.series,
                            manufacturer: item.manufacturer,
                            itemId: item.id,
                        })}
                        className="btn btn-x px-4 py-3.5"
                    >
                        <XLogo className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
