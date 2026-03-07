"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, SlidersHorizontal, Star, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { getProfileDisplayName, DisplayNameProfile } from "@/lib/profile";

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
        x_username: string | null;
        display_name_source: "manual" | "twitter";
    };
}

interface CatalogItemOption {
    id: string;
    name: string;
    manufacturer: string;
    series: string;
    image_url: string | null;
}

const ALL_OPTION = "すべて";

export default function SearchPage() {
    const supabase = createClient();
    const [showFilters, setShowFilters] = useState(false);
    const [query, setQuery] = useState(() => {
        if (typeof window === "undefined") return "";
        return new URLSearchParams(window.location.search).get("q") || "";
    });
    const [selectedMfr, setSelectedMfr] = useState(() => {
        if (typeof window === "undefined") return ALL_OPTION;
        return new URLSearchParams(window.location.search).get("manufacturer") || ALL_OPTION;
    });

    const [manufacturers, setManufacturers] = useState<string[]>([]);
    const [catalogResults, setCatalogResults] = useState<CatalogItemOption[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [selectedCatalog, setSelectedCatalog] = useState<CatalogItemOption | null>(null);

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const listingSectionRef = useRef<HTMLElement | null>(null);
    const initialCatalogItemIdRef = useRef(
        typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("catalogItemId") || ""
    );

    useEffect(() => {
        async function fetchManufacturers() {
            const { data } = await supabase
                .from("catalog_items")
                .select("manufacturer")
                .eq("is_approved", true);

            if (data) {
                const unique = [ALL_OPTION, ...new Set(data.map((d) => d.manufacturer).filter(Boolean))];
                setManufacturers(unique);
            } else {
                setManufacturers([ALL_OPTION]);
            }
        }

        fetchManufacturers();
    }, [supabase]);

    useEffect(() => {
        let isActive = true;

        async function fetchCatalogCandidates() {
            setCatalogLoading(true);

            let qBuilder = supabase
                .from("catalog_items")
                .select("id, name, manufacturer, series, image_url")
                .eq("is_approved", true)
                .limit(120);

            if (selectedMfr !== ALL_OPTION) {
                qBuilder = qBuilder.eq("manufacturer", selectedMfr);
            }

            if (query.trim()) {
                const term = query.trim();
                qBuilder = qBuilder.or(`name.ilike.%${term}%,series.ilike.%${term}%`);
            }

            const { data, error } = await qBuilder;

            if (!isActive) {
                return;
            }

            if (!error && data) {
                let nextCatalog = data as CatalogItemOption[];
                const preselectedId = initialCatalogItemIdRef.current;

                if (preselectedId && !nextCatalog.some((item) => item.id === preselectedId)) {
                    const { data: preselectedCatalog } = await supabase
                        .from("catalog_items")
                        .select("id, name, manufacturer, series, image_url")
                        .eq("id", preselectedId)
                        .eq("is_approved", true)
                        .maybeSingle();

                    if (!isActive) {
                        return;
                    }

                    if (preselectedCatalog) {
                        nextCatalog = [preselectedCatalog as CatalogItemOption, ...nextCatalog];
                    }
                }

                setCatalogResults(nextCatalog);

                if (preselectedId) {
                    const matched = nextCatalog.find((item) => item.id === preselectedId);
                    if (matched) {
                        setSelectedCatalog(matched);
                        setLoading(true);
                        initialCatalogItemIdRef.current = "";
                        requestAnimationFrame(() => {
                            listingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        });
                    }
                }

                if (selectedCatalog && !nextCatalog.some((item) => item.id === selectedCatalog.id)) {
                    setSelectedCatalog(null);
                    setResults([]);
                    setLoading(false);
                }
            } else {
                setCatalogResults([]);
                setSelectedCatalog(null);
                setResults([]);
                setLoading(false);
            }

            setCatalogLoading(false);
        }

        fetchCatalogCandidates();

        return () => {
            isActive = false;
        };
    }, [supabase, query, selectedMfr, selectedCatalog]);

    useEffect(() => {
        if (!selectedCatalog) {
            return;
        }

        let isActive = true;

        const qBuilder = supabase
            .from("user_items")
            .select(`
                id,
                images,
                condition,
                trade_status,
                catalog_items!inner (name, series, manufacturer),
                profiles:owner_id (display_name, rating_avg, phone_verified, x_username, display_name_source)
            `)
            .eq("is_public", true)
            .eq("catalog_item_id", selectedCatalog.id)
            .neq("trade_status", "COMPLETED")
            .order("created_at", { ascending: false })
            .limit(40);

        qBuilder.then(({ data, error }) => {
            if (!isActive) {
                return;
            }

            if (!error && data) {
                setResults(data as unknown as SearchResult[]);
            } else {
                setResults([]);
            }

            setLoading(false);
        });

        return () => {
            isActive = false;
        };
    }, [supabase, selectedCatalog]);

    return (
        <div className="bg-background min-h-screen pb-24">
            <div className="bg-surface sticky top-0 z-40 border-b border-border px-4 pt-4 pb-3 space-y-3">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="公式カタログを検索（商品名・シリーズ）"
                            className="w-full bg-background border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-lg border transition-all ${showFilters
                                ? "bg-primary text-white border-primary"
                                : "bg-surface border-border text-muted hover:border-primary"
                            }`}
                    >
                        <SlidersHorizontal className="h-5 w-5" />
                    </button>
                </div>

                {showFilters && (
                    <div className="space-y-3 animate-fade-in-up">
                        <div>
                            <p className="text-[10px] font-bold text-muted uppercase mb-1.5 tracking-wider">メーカー</p>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {manufacturers.map((mfr) => (
                                    <button
                                        key={mfr}
                                        onClick={() => setSelectedMfr(mfr)}
                                        className={`badge whitespace-nowrap py-1.5 px-3 text-[11px] transition-all ${selectedMfr === mfr
                                                ? "bg-primary text-white"
                                                : "bg-background text-muted border border-border hover:border-primary"
                                            }`}
                                    >
                                        {mfr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="container mx-auto px-4 pt-4 space-y-6">
                <section>
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <h2 className="text-sm font-bold">1. 公式画像からガチャを選ぶ</h2>
                            <p className="text-[11px] text-muted">Bandai公式ガシャポンカタログ</p>
                        </div>
                        <p className="text-[11px] text-muted">{catalogResults.length}</p>
                    </div>

                    {catalogLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : catalogResults.length === 0 ? (
                        <div className="card p-6 text-center text-sm text-muted">公式カタログが見つかりませんでした</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                            {catalogResults.map((item) => {
                                const selected = selectedCatalog?.id === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedCatalog(item);
                                            setResults([]);
                                            setLoading(true);
                                            requestAnimationFrame(() => {
                                                listingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                            });
                                        }}
                                        className={`card text-left overflow-hidden transition-all ${selected
                                                ? "ring-2 ring-primary border-primary"
                                                : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="relative aspect-square bg-background">
                                            <Image
                                                src={item.image_url || "/logo.svg"}
                                                alt={`${item.name} 公式画像`}
                                                fill
                                                unoptimized
                                                sizes="(max-width: 640px) 50vw, 16vw"
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="p-2">
                                            <p className="text-[11px] font-bold line-clamp-2 leading-snug">{item.name}</p>
                                            <p className="text-[10px] text-muted mt-1 truncate">
                                                {item.manufacturer}{item.series ? ` / ${item.series}` : ""}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section ref={listingSectionRef}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">2. 出品一覧（ユーザー写真）</h2>
                        {selectedCatalog && (
                            <span className="text-[11px] text-primary font-bold truncate max-w-[60%]">
                                {selectedCatalog.name}
                            </span>
                        )}
                    </div>

                    {!selectedCatalog ? (
                        <div className="card p-6 text-center text-sm text-muted">
                            先に上の公式画像からアイテムを選択してください
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-muted mb-3 font-bold">{results.length}件の出品があります</p>
                            {results.length === 0 ? (
                                <div className="text-center py-12 space-y-2 card">
                                    <p className="text-muted font-bold">このアイテムの出品はまだありません</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {results.map((item, i) => (
                                        <Link key={item.id} href={`/item/${item.id}`} className={`animate-fade-in-up delay-${i + 1}`}>
                                            <div className="card group">
                                                <div className="relative aspect-square">
                                                    <Image
                                                        src={item.images?.[0] || "/placeholder.png"}
                                                        alt={`${item.catalog_items?.name || "カプセルトイ"} - ${item.condition}`}
                                                        fill
                                                        unoptimized
                                                        sizes="(max-width: 640px) 50vw, 20vw"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    {item.trade_status === "TRADING" && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
                                                            <span className="bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">交渉中</span>
                                                        </div>
                                                    )}
                                                    <span className="absolute top-2 left-2 z-20 badge bg-foreground/70 text-white">
                                                        {item.condition}
                                                    </span>
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="text-sm font-bold line-clamp-2 leading-snug mb-1.5">
                                                        {item.catalog_items?.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-bold text-foreground">{item.profiles?.rating_avg || 0}</span>
                                                        {item.profiles?.phone_verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                                                        <span className="ml-0.5">
                                                            {getProfileDisplayName(item.profiles as DisplayNameProfile, "ユーザー")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
