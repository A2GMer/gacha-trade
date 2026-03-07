"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AlertCircle, Check, Sparkles, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface CatalogItem {
    id: string;
    name: string;
    manufacturer: string;
    series: string;
    image_url: string | null;
}

interface CatalogSelectorProps {
    selectedItemId: string | null;
    onChange: (itemId: string | null, item: CatalogItem | null) => void;
    error?: string;
}

interface AiResult {
    name: string;
    manufacturer: string;
    series: string;
    confidence: number;
    trustScore: number;
    autoApproved: boolean;
}

export function CatalogSelector({ selectedItemId, onChange, error }: CatalogSelectorProps) {
    const supabase = createClient();
    const [manufacturers, setManufacturers] = useState<string[]>([]);
    const [seriesList, setSeriesList] = useState<string[]>([]);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [selectedManufacturer, setSelectedManufacturer] = useState("");
    const [selectedSeries, setSelectedSeries] = useState("");
    const [loading, setLoading] = useState(false);

    // AI enrichment states
    const [showAiMode, setShowAiMode] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AiResult | null>(null);
    const [aiError, setAiError] = useState("");
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        async function fetchManufacturers() {
            const { data } = await supabase
                .from("catalog_items")
                .select("manufacturer")
                .eq("is_approved", true);

            if (data) {
                const unique = [...new Set(data.map((d) => d.manufacturer))].sort();
                setManufacturers(unique);
            }
        }
        fetchManufacturers();
    }, [supabase]);

    useEffect(() => {
        if (!selectedManufacturer) {
            setSeriesList([]);
            setItems([]);
            return;
        }

        async function fetchSeries() {
            setLoading(true);
            const { data } = await supabase
                .from("catalog_items")
                .select("series")
                .eq("manufacturer", selectedManufacturer)
                .eq("is_approved", true);

            if (data) {
                const unique = [...new Set(data.map((d) => d.series))].sort();
                setSeriesList(unique);
            }
            setSelectedSeries("");
            setItems([]);
            onChange(null, null);
            setLoading(false);
        }
        fetchSeries();
    }, [selectedManufacturer, supabase, onChange]);

    useEffect(() => {
        if (!selectedSeries) {
            setItems([]);
            return;
        }

        async function fetchItems() {
            setLoading(true);
            const { data } = await supabase
                .from("catalog_items")
                .select("*")
                .eq("manufacturer", selectedManufacturer)
                .eq("series", selectedSeries)
                .eq("is_approved", true);

            if (data) {
                setItems(data);
            }
            setLoading(false);
        }
        fetchItems();
    }, [selectedSeries, selectedManufacturer, supabase]);

    const handleItemSelect = (item: CatalogItem) => {
        if (selectedItemId === item.id) {
            onChange(null, null);
        } else {
            onChange(item.id, item);
        }
    };

    const handleAiEnrich = async () => {
        if (!aiQuery.trim()) return;
        setAiLoading(true);
        setAiError("");
        setAiResult(null);

        try {
            const res = await fetch("/api/catalog/ai-enrich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productName: aiQuery.trim() }),
            });

            const data = await res.json();
            if (data.error) {
                setAiError(data.error);
            } else if (data.exists) {
                onChange(data.catalogItem.id, data.catalogItem as CatalogItem);
                setShowAiMode(false);
                setAiQuery("");
            } else {
                setAiResult(data.aiResult);
            }
        } catch {
            setAiError("AI解析に失敗しました。もう一度お試しください。");
        } finally {
            setAiLoading(false);
        }
    };

    const handleAiRegister = async () => {
        if (!aiResult) return;
        setRegistering(true);

        const { data, error: insertErr } = await supabase
            .from("catalog_items")
            .insert({
                name: aiResult.name,
                manufacturer: aiResult.manufacturer,
                series: aiResult.series,
                source: "user",
                ai_confidence: aiResult.trustScore,
                is_approved: aiResult.autoApproved,
            })
            .select("id, name, manufacturer, series, image_url")
            .single();

        if (data && !insertErr) {
            onChange(data.id, data as CatalogItem);
            setShowAiMode(false);
            setAiQuery("");
            setAiResult(null);
        } else {
            setAiError("登録に失敗しました。");
        }
        setRegistering(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-black">📦 カタログから選ぶ</h2>
                <button
                    onClick={() => { setShowAiMode(!showAiMode); setAiResult(null); setAiError(""); }}
                    className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${showAiMode
                            ? "bg-primary text-white"
                            : "bg-primary-light text-primary hover:bg-primary/20"
                        }`}
                >
                    {showAiMode ? "カタログに戻る" : (
                        <><Plus className="h-3 w-3" /> 見つからない場合</>
                    )}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-danger text-xs font-bold bg-danger/5 p-3 rounded-2xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {showAiMode ? (
                <div className="space-y-3 animate-fade-in">
                    <div className="bg-primary-light rounded-2xl p-3">
                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> AI自動補完
                        </p>
                        <p className="text-[10px] text-primary/70 mt-0.5">
                            商品名を入力すると、AIがメーカーやシリーズを自動で推定します
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAiEnrich()}
                            placeholder="例: おじゃるまる めじるしアクセサリー"
                            className="flex-1 bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <button
                            onClick={handleAiEnrich}
                            disabled={aiLoading || !aiQuery.trim()}
                            className="btn btn-primary px-4 shrink-0 disabled:opacity-50"
                        >
                            {aiLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    {aiError && <p className="text-xs text-danger font-bold">{aiError}</p>}

                    {aiResult && (
                        <div className="card p-4 space-y-3 border-primary/20 border-2 animate-fade-in-up">
                            <h3 className="text-xs font-bold text-primary">AI推定結果</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">商品名</span>
                                    <span className="font-bold">{aiResult.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">メーカー</span>
                                    <span className="font-bold">{aiResult.manufacturer}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">シリーズ</span>
                                    <span className="font-bold">{aiResult.series || "—"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted">信頼スコア</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${aiResult.trustScore >= 0.8 ? "bg-success" : "bg-warning"
                                                    }`}
                                                style={{ width: `${aiResult.trustScore * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">
                                            {Math.round(aiResult.trustScore * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {aiResult.autoApproved ? (
                                <p className="text-[10px] text-success font-bold bg-success/10 p-2 rounded-lg">
                                    ✅ 高信頼度のため自動承認されます
                                </p>
                            ) : (
                                <p className="text-[10px] text-warning font-bold bg-warning/10 p-2 rounded-lg">
                                    ⚠️ 管理者の承認後にカタログに追加されます
                                </p>
                            )}

                            <button
                                onClick={handleAiRegister}
                                disabled={registering}
                                className="btn btn-primary w-full py-3 gap-1.5 disabled:opacity-50"
                            >
                                {registering ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        この内容でカタログに登録して選択
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-muted mb-1 block">メーカー</label>
                        <select
                            value={selectedManufacturer}
                            onChange={(e) => setSelectedManufacturer(e.target.value)}
                            className={`w-full bg-background border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-sm font-medium transition-all ${error && !selectedManufacturer ? "border-danger" : "border-border"
                                }`}
                        >
                            <option value="">選択してください</option>
                            {manufacturers.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-muted mb-1 block">シリーズ</label>
                        <select
                            value={selectedSeries}
                            onChange={(e) => setSelectedSeries(e.target.value)}
                            disabled={!selectedManufacturer}
                            className="w-full bg-background border border-border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all disabled:opacity-50"
                        >
                            <option value="">{selectedManufacturer ? "シリーズを選択" : "先にメーカーを選択してください"}</option>
                            {seriesList.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {items.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-muted mb-2 block">アイテムを選択</label>
                            <div className="grid grid-cols-3 gap-2">
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemSelect(item)}
                                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedItemId === item.id
                                            ? "border-primary shadow-md ring-2 ring-primary/20"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        {item.image_url ? (
                                            <Image src={item.image_url} alt={item.name} fill unoptimized sizes="25vw" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-background flex items-center justify-center">
                                                <span className="text-xs text-muted text-center px-1">{item.name}</span>
                                            </div>
                                        )}
                                        {selectedItemId === item.id && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <div className="bg-primary text-white p-1 rounded-full">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate text-center">
                                            {item.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-4">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
