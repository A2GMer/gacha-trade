"use client";

import { useState } from "react";
import { ChevronLeft, Camera, HelpCircle, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SellPage() {
    const router = useRouter();
    const [photos, setPhotos] = useState<string[]>([]);
    const [condition, setCondition] = useState("未開封");
    const [isPublic, setIsPublic] = useState(false);
    const [isTradeable, setIsTradeable] = useState(false);

    const handleTradeableToggle = (val: boolean) => {
        setIsTradeable(val);
        if (val) setIsPublic(true); // 仕様: is_tradeable=true の場合は is_public=true を強制
    };

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white sticky top-0 z-40 p-4 border-b border-border flex items-center justify-between">
                <button onClick={() => router.back()} className="p-1">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="font-bold">アイテムを登録</h1>
                <div className="w-8" />
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
                {/* Step 1: Photos */}
                <div className="bg-white p-6 card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold flex items-center gap-2">
                            商品の写真 <span className="text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">必須</span>
                        </h2>
                        <span className="text-xs text-muted">最大4枚まで</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square bg-background border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-border/20 transition-colors"
                            >
                                <Camera className="h-6 w-6 text-muted mb-1" />
                                <span className="text-[10px] text-muted">{i + 1}枚目</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 2: Catalog Selection */}
                <div className="bg-white p-6 card space-y-4">
                    <h2 className="font-bold">カタログから選ぶ</h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">メーカー</label>
                        <select className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20">
                            <option>選択してください</option>
                            <option>バンダイ</option>
                            <option>タカラトミーアーツ</option>
                            <option>キタンクラブ</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">シリーズ</label>
                        <select className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20">
                            <option>先にメーカーを選択してください</option>
                        </select>
                    </div>
                    <p className="text-[10px] text-muted flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        見つからない場合は「追加申請」を行ってください
                    </p>
                </div>

                {/* Step 3: Details */}
                <div className="bg-white p-6 card space-y-6">
                    <div className="space-y-3">
                        <h2 className="font-bold">商品の状態</h2>
                        <div className="flex gap-2">
                            {["未開封", "開封済", "傷あり"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCondition(c)}
                                    className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${condition === c
                                            ? "bg-primary text-white"
                                            : "bg-background text-foreground border border-border"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-bold">メモ（任意）</h2>
                        <textarea
                            placeholder="商品の状態や、交換してほしいアイテムなどを入力してください"
                            rows={4}
                            className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        ></textarea>
                    </div>
                </div>

                {/* Step 4: Visibility & Trading */}
                <div className="bg-white p-6 card space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold">全体に公開する</h2>
                            <p className="text-[10px] text-muted">他のユーザーが検索できるようになります</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                disabled={isTradeable}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <div>
                            <h2 className="font-bold text-primary">交換に出す</h2>
                            <p className="text-[10px] text-muted">交換提案を受けられるようになります</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isTradeable}
                                onChange={(e) => handleTradeableToggle(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {isTradeable && (
                        <div className="bg-primary/5 p-3 rounded-lg flex gap-2 items-start mt-2">
                            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-primary leading-tight">
                                「交換に出す」が有効な場合、自動的に「全体に公開」設定になります。
                            </p>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-lg active:scale-95 transition-transform">
                    コレクションに登録する
                </button>
            </div>
        </div>
    );
}
