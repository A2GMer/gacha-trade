"use client";

import { useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, Star, ShieldCheck, Heart, Eye } from "lucide-react";
import Link from "next/link";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

const MANUFACTURERS = ["すべて", "バンダイ", "タカラトミーアーツ", "キタンクラブ", "ポケモン", "ナガノ"];
const CONDITIONS = ["すべて", "未開封", "開封済", "傷あり"];
const SERIES = ["すべて", "カプセルフィギュア Vol.1", "ちいかわスポーツ", "MSアンサンブル", "ふにふにマスコット"];

const RESULTS = [
    { id: "1", name: "ピカチュウ (カプセルフィギュア Vol.1)", condition: "未開封", image: "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=400&h=400&fit=crop", user: { name: "たなか", rating: 4.8, verified: true }, watchCount: 14 },
    { id: "2", name: "ちいかわ サッカーボール", condition: "開封済", image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop", user: { name: "さとう", rating: 4.5, verified: true }, watchCount: 8 },
    { id: "3", name: "機動戦士ガンダム モビルスーツアンサンブル", condition: "傷あり", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=400&fit=crop", user: { name: "すずき", rating: 4.9, verified: true }, watchCount: 23 },
    { id: "5", name: "ワンピース カプセルフィギュア ルフィ", condition: "未開封", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc19?w=400&h=400&fit=crop", user: { name: "やまだ", rating: 4.7, verified: true }, watchCount: 31 },
];

export default function SearchPage() {
    const [showFilters, setShowFilters] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedMfr, setSelectedMfr] = useState("すべて");
    const [selectedCondition, setSelectedCondition] = useState("すべて");

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Search Header */}
            <div className="bg-surface sticky top-0 z-40 border-b border-border px-4 pt-4 pb-3 space-y-3">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="キーワードで検索..."
                            className="w-full bg-background border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-2xl border transition-all ${showFilters ? "bg-primary text-white border-primary" : "bg-surface border-border text-muted hover:border-primary"
                            }`}
                    >
                        <SlidersHorizontal className="h-5 w-5" />
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="space-y-3 animate-fade-in-up">
                        <div>
                            <p className="text-[10px] font-bold text-muted uppercase mb-1.5 tracking-wider">メーカー</p>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {MANUFACTURERS.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setSelectedMfr(m)}
                                        className={`badge whitespace-nowrap py-1.5 px-3 text-[11px] transition-all ${selectedMfr === m ? "bg-primary text-white" : "bg-background text-muted border border-border hover:border-primary"
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted uppercase mb-1.5 tracking-wider">状態</p>
                            <div className="flex gap-1.5">
                                {CONDITIONS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedCondition(c)}
                                        className={`badge py-1.5 px-3 text-[11px] transition-all ${selectedCondition === c ? "bg-primary text-white" : "bg-background text-muted border border-border hover:border-primary"
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="container mx-auto px-4 pt-4">
                <p className="text-xs text-muted mb-3 font-bold">{RESULTS.length}件のアイテムが見つかりました</p>
                <div className="grid grid-cols-2 gap-3">
                    {RESULTS.map((item, i) => (
                        <Link key={item.id} href={`/item/${item.id}`} className={`animate-fade-in-up delay-${i + 1}`}>
                            <div className="card group">
                                <div className="relative aspect-square">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <span className={`absolute top-2 left-2 badge ${item.condition === "未開封" ? "bg-accent text-white" :
                                            item.condition === "開封済" ? "bg-foreground/70 text-white" : "bg-warning text-white"
                                        }`}>
                                        {item.condition}
                                    </span>
                                    <div className="absolute bottom-2 right-2 badge bg-black/50 text-white backdrop-blur-sm">
                                        <Eye className="h-3 w-3" /> {item.watchCount}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-bold line-clamp-2 leading-snug mb-1.5">{item.name}</h3>
                                    <div className="flex items-center gap-1 text-[10px] text-muted">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-foreground">{item.user.rating}</span>
                                        {item.user.verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                                        <span className="ml-0.5">{item.user.name}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
