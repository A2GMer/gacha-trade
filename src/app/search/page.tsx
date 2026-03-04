"use client";

import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, SlidersHorizontal, Star, ShieldCheck, Eye } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface SearchResult {
    id: string;
    images: string[];
    condition: string;
    trade_status?: string;
    catalog_items: {
        name: string;
        series: string;
        manufacturer: string;
    };
    profiles: {
        display_name: string;
        rating_avg: number;
        phone_verified: boolean;
    };
}

export default function SearchPage() {
    const supabase = createClient();
    const [showFilters, setShowFilters] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedCondition, setSelectedCondition] = useState("すべて");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [manufacturers, setManufacturers] = useState<string[]>([]);
    const [selectedMfr, setSelectedMfr] = useState("すべて");

    const CONDITIONS = ["すべて", "未開封", "開封済", "傷あり"];

    // メーカー一覧取得
    useEffect(() => {
        async function fetchManufacturers() {
            const { data } = await supabase
                .from("catalog_items")
                .select("manufacturer")
                .eq("is_approved", true);
            if (data) {
                const unique = ["すべて", ...new Set(data.map((d) => d.manufacturer))];
                setManufacturers(unique);
            }
        }
        fetchManufacturers();
    }, [supabase]);

    // 検索実行
    const search = useCallback(async () => {
        setLoading(true);

        let q = supabase
            .from("user_items")
            .select(`
        id,
        images,
        condition,
        trade_status,
        catalog_items!inner (name, series, manufacturer),
        profiles:owner_id (display_name, rating_avg, phone_verified)
      `)
            .eq("is_public", true)
            .neq("trade_status", "COMPLETED")
            .order("created_at", { ascending: false })
            .limit(20);

        if (selectedCondition !== "すべて") {
            q = q.eq("condition", selectedCondition);
        }

        if (selectedMfr !== "すべて") {
            q = q.eq("catalog_items.manufacturer", selectedMfr);
        }

        if (query.trim()) {
            q = q.ilike("catalog_items.name", `%${query.trim()}%`);
        }

        const { data, error } = await q;

        if (data && !error) {
            setResults(data as unknown as SearchResult[]);
        } else {
            setResults([]);
        }
        setLoading(false);
    }, [supabase, query, selectedCondition, selectedMfr]);

    useEffect(() => {
        search();
    }, [search]);

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
                        className={`p-2.5 rounded-lg border transition-all ${showFilters ? "bg-primary text-white border-primary" : "bg-surface border-border text-muted hover:border-primary"
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
                                {manufacturers.map((m) => (
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
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-muted mb-3 font-bold">{results.length}件のアイテムが見つかりました</p>
                        {results.length === 0 ? (
                            <div className="text-center py-16 space-y-3">
                                <p className="text-4xl">🔍</p>
                                <p className="text-muted font-bold">条件に合うアイテムが見つかりませんでした</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {results.map((item, i) => (
                                    <Link key={item.id} href={`/item/${item.id}`} className={`animate-fade-in-up delay-${i + 1}`}>
                                        <div className="card group">
                                            <div className="relative aspect-square">
                                                <img src={item.images?.[0] || "/placeholder.png"} alt={`${item.catalog_items?.name || "カプセルトイ"} - ${item.catalog_items?.series || ""} ${item.condition} | スワコレ`} loading="lazy" width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                {item.trade_status === "TRADING" && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
                                                        <span className="bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">取引中</span>
                                                    </div>
                                                )}
                                                <span className={`absolute top-2 left-2 z-20 badge ${item.condition === "未開封" ? "bg-accent text-white" :
                                                    item.condition === "開封済" ? "bg-foreground/70 text-white" : "bg-warning text-white"
                                                    }`}>
                                                    {item.condition}
                                                </span>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-sm font-bold line-clamp-2 leading-snug mb-1.5">{item.catalog_items?.name}</h3>
                                                <div className="flex items-center gap-1 text-[10px] text-muted">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-bold text-foreground">{item.profiles?.rating_avg || 0}</span>
                                                    {item.profiles?.phone_verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                                                    <span className="ml-0.5">{item.profiles?.display_name || "ユーザー"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
