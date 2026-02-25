"use client";

import { useState, useEffect, useCallback } from "react";
import { HelpCircle, AlertCircle, Check } from "lucide-react";
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

export function CatalogSelector({ selectedItemId, onChange, error }: CatalogSelectorProps) {
    const supabase = createClient();
    const [manufacturers, setManufacturers] = useState<string[]>([]);
    const [seriesList, setSeriesList] = useState<string[]>([]);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [selectedManufacturer, setSelectedManufacturer] = useState("");
    const [selectedSeries, setSelectedSeries] = useState("");
    const [loading, setLoading] = useState(false);

    // メーカー一覧を取得
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

    // メーカー変更時にシリーズを取得
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
    }, [selectedManufacturer, supabase]);

    // シリーズ変更時にアイテムを取得
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

    return (
        <div className="space-y-4">
            <h2 className="font-black">📦 カタログから選ぶ</h2>

            {error && (
                <div className="flex items-center gap-2 text-danger text-xs font-bold bg-danger/5 p-3 rounded-2xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                {/* メーカー選択 */}
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

                {/* シリーズ選択 */}
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

                {/* アイテムグリッド */}
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
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
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

            <p className="text-[10px] text-muted flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                見つからない場合は「追加申請」を行ってください
            </p>
        </div>
    );
}
