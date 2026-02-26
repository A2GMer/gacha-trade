"use client";

import { Package, ChevronDown, ChevronUp, Truck, MapPin } from "lucide-react";
import { useState } from "react";

const SHIPPING_METHODS = [
    {
        name: "定形外郵便（規格内）",
        weight: "〜50g",
        price: "¥120",
        tracking: false,
        note: "ガチャアイテム1個なら最安。ポスト投函。",
        recommended: true,
    },
    {
        name: "定形外郵便（規格内）",
        weight: "〜100g",
        price: "¥140",
        tracking: false,
        note: "複数個や付属品ありの場合。",
        recommended: false,
    },
    {
        name: "クリックポスト",
        weight: "〜1kg",
        price: "¥185",
        tracking: true,
        note: "追跡あり・最安。Yahoo!ウォレット / Amazon Pay で決済。",
        recommended: true,
    },
    {
        name: "ネコポス（ヤマト）",
        weight: "〜1kg",
        price: "¥210〜",
        tracking: true,
        note: "コンビニから発送可能。追跡・補償あり。",
        recommended: false,
    },
    {
        name: "レターパックライト",
        weight: "〜4kg",
        price: "¥370",
        tracking: true,
        note: "全国一律、追跡あり、郵便局/コンビニ購入。",
        recommended: false,
    },
];

export function ShippingGuide() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="card overflow-hidden border-border">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-background transition-colors text-left"
            >
                <div className="p-1.5 bg-accent-light rounded-lg">
                    <Truck className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold">📦 推奨発送方法</p>
                    <p className="text-[10px] text-muted">定形外 ¥120〜 / クリックポスト ¥185（追跡付き）</p>
                </div>
                {expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted" />
                )}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-2 animate-fade-in">
                    <div className="text-[10px] text-muted bg-background rounded-xl p-2.5">
                        💡 ガチャアイテムは小型のため、多くの場合 <strong>定形外郵便（¥120）</strong> で送れます。
                        追跡が必要な場合は <strong>クリックポスト（¥185）</strong> がおすすめです。
                    </div>
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-2 font-bold">方法</th>
                                <th className="text-right py-2 font-bold">重量</th>
                                <th className="text-right py-2 font-bold">料金</th>
                                <th className="text-center py-2 font-bold">追跡</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SHIPPING_METHODS.map((method, i) => (
                                <tr key={i} className={`border-b border-border/50 ${method.recommended ? "bg-accent/5" : ""}`}>
                                    <td className="py-2">
                                        <span className="font-bold">{method.name}</span>
                                        {method.recommended && (
                                            <span className="ml-1 badge bg-accent text-white text-[8px] px-1">おすすめ</span>
                                        )}
                                    </td>
                                    <td className="text-right py-2 text-muted">{method.weight}</td>
                                    <td className="text-right py-2 font-bold">{method.price}</td>
                                    <td className="text-center py-2">{method.tracking ? "✅" : "❌"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-[9px] text-muted-light leading-relaxed">
                        ※ 料金は2025年時点の参考価格です。エアクッション等で保護して発送してください。
                        発送方法について相手と相談したい場合は、下のメッセージ欄をご利用ください。
                    </p>
                </div>
            )}
        </div>
    );
}
