"use client";

import Link from "next/link";
import { Star, ShieldCheck, Flag, Ban, ChevronLeft, MessageCircle, Heart, Edit } from "lucide-react";
import { ReportBlockModal } from "@/components/safety/ReportBlockModal";
import { shareOnX } from "@/lib/share";
import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

interface ItemData {
    id: string;
    images: string[];
    condition: string;
    quantity: number;
    memo: string | null;
    is_tradeable: boolean;
    owner_id: string;
    catalog_items: { name: string; series: string; manufacturer: string };
    profiles: {
        id: string;
        display_name: string;
        avatar_url: string | null;
        rating_avg: number;
        trade_count: number;
        phone_verified: boolean;
    };
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const [item, setItem] = useState<ItemData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        async function fetchItem() {
            const { data, error } = await supabase
                .from("user_items")
                .select(`
          id, images, condition, quantity, memo, is_tradeable, owner_id,
          catalog_items (name, series, manufacturer),
          profiles:owner_id (id, display_name, avatar_url, rating_avg, trade_count, phone_verified)
        `)
                .eq("id", id)
                .single();

            if (data && !error) setItem(data as unknown as ItemData);
            setLoading(false);
        }
        fetchItem();
    }, [id, supabase]);

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-4xl">😢</p>
                    <p className="font-bold text-muted">アイテムが見つかりません</p>
                    <Link href="/" className="btn btn-primary px-6 py-3 inline-flex">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    const isOwner = user?.id === item.owner_id;

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.catalog_items?.name || "カプセルトイ",
        description: `${item.catalog_items?.series || ""} ${item.catalog_items?.manufacturer || ""} - ${item.condition}`,
        image: item.images,
        brand: { "@type": "Brand", name: item.catalog_items?.manufacturer || "不明" },
        offers: {
            "@type": "Offer",
            availability: item.is_tradeable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            priceCurrency: "JPY",
            price: "0",
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            itemCondition: item.condition === "未開封" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
        },
    };

    return (
        <div className="bg-background min-h-screen pb-28 sm:pb-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />

            {/* Mobile Top Header */}
            <div className="sm:hidden sticky top-0 glass z-40 px-4 py-3 flex items-center justify-between">
                <Link href="/" className="p-1 hover:bg-primary-light rounded-lg transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                {!isOwner && (
                    <button onClick={() => setShowReport(true)} className="p-2 hover:bg-primary-light rounded-lg transition-colors">
                        <Flag className="h-5 w-5 text-muted" />
                    </button>
                )}
            </div>

            <div className="container mx-auto max-w-4xl sm:py-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Left: Images */}
                <div className="space-y-3 animate-fade-in">
                    <div className="aspect-square bg-surface rounded-[20px] overflow-hidden border border-border sm:shadow-md">
                        <img
                            src={item.images[selectedImage] || "/placeholder.png"}
                            alt={`${item.catalog_items?.name || "カプセルトイ"} - ${item.condition}`}
                            width={600}
                            height={600}
                            className="w-full h-full object-cover transition-opacity duration-300"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2 px-4 sm:px-0">
                        {item.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedImage(i)}
                                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i
                                    ? "border-primary shadow-md scale-[1.02]"
                                    : "border-border hover:border-muted"
                                    }`}
                            >
                                <img src={img} alt={`写真 ${i + 1}枚目`} loading="lazy" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Info — 画像→状態→相手情報→提案導線の順で設計方針§4準拠 */}
                <div className="px-4 sm:px-0 space-y-4 animate-fade-in-up">
                    {/* Item Info */}
                    <div className="card p-5 space-y-4">
                        <div>
                            <h1 className="text-xl font-bold mb-2 leading-tight">{item.catalog_items?.name}</h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`badge ${item.condition === "未開封" ? "bg-accent text-white" :
                                    item.condition === "傷あり" ? "bg-warning text-white" :
                                        "bg-foreground/70 text-white"
                                    }`}>
                                    {item.condition}
                                </span>
                                <span className="badge bg-background text-muted">
                                    {item.catalog_items?.manufacturer} / {item.catalog_items?.series}
                                </span>
                                {item.quantity > 1 && (
                                    <span className="badge bg-primary-light text-primary">×{item.quantity}</span>
                                )}
                                {!item.is_tradeable && (
                                    <span className="badge bg-muted/10 text-muted">交換不可</span>
                                )}
                            </div>
                        </div>

                        {item.memo && (
                            <div className="border-t border-border pt-4">
                                <h2 className="text-xs font-bold text-muted uppercase mb-2 tracking-wider">商品の説明</h2>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.memo}</p>
                            </div>
                        )}
                    </div>

                    {/* User Section — 信頼情報強化 */}
                    <div className="card p-5">
                        <h2 className="text-xs font-bold text-muted uppercase mb-3 tracking-wider">出品者情報</h2>
                        <Link href={`/user/${item.owner_id}`} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg border border-border bg-primary flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                    {item.profiles?.avatar_url ? (
                                        <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        (item.profiles?.display_name || "?")[0]
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 font-bold group-hover:text-primary transition-colors">
                                        {item.profiles?.display_name || "ユーザー"}
                                        {item.profiles?.phone_verified && <ShieldCheck className="h-4 w-4 text-accent" />}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted">
                                        <div className="flex items-center gap-0.5">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            <span className="font-bold text-foreground">{item.profiles?.rating_avg || 0}</span>
                                        </div>
                                        <span>取引 {item.profiles?.trade_count || 0}回</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-primary font-bold">一覧 →</span>
                        </Link>
                    </div>

                    {/* X Share Card */}
                    <div className="card p-4 bg-foreground text-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2.5 rounded-lg">
                                <XLogo className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm">このアイテムをXで拡散 🎯</p>
                                <p className="text-xs text-white/60">交換相手が見つかりやすくなります</p>
                            </div>
                            <button
                                onClick={() =>
                                    shareOnX({
                                        itemName: item.catalog_items?.name || "",
                                        condition: item.condition,
                                        series: item.catalog_items?.series,
                                        manufacturer: item.catalog_items?.manufacturer,
                                        itemId: item.id,
                                    })
                                }
                                className="btn bg-white text-foreground hover:bg-white/90 text-xs px-4 py-2"
                            >
                                シェアする
                            </button>
                        </div>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden sm:flex gap-3">
                        {isOwner ? (
                            <Link href={`/collection`} className="btn btn-primary flex-1 py-4 text-base gap-2">
                                <Edit className="h-5 w-5" />
                                コレクションを管理する
                            </Link>
                        ) : (
                            item.is_tradeable && (
                                <>
                                    <button
                                        onClick={() => router.push(`/trade/propose?itemId=${item.id}`)}
                                        className="btn btn-primary flex-1 py-4 text-base"
                                    >
                                        <MessageCircle className="h-5 w-5" />
                                        交換を提案する
                                    </button>
                                    <button
                                        onClick={() =>
                                            shareOnX({
                                                itemName: item.catalog_items?.name || "",
                                                condition: item.condition,
                                                series: item.catalog_items?.series,
                                                manufacturer: item.catalog_items?.manufacturer,
                                                itemId: item.id,
                                            })
                                        }
                                        className="btn btn-x px-5 py-4"
                                    >
                                        <XLogo className="h-5 w-5" />
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Action Bar — 行動ボタンは下部に(設計方針§9) */}
            <div className="sm:hidden action-bar">
                <div className="flex gap-2">
                    {isOwner ? (
                        <Link href="/collection" className="btn btn-primary flex-1 py-3.5 gap-2">
                            <Edit className="h-5 w-5" />
                            コレクションを管理する
                        </Link>
                    ) : (
                        item.is_tradeable && (
                            <>
                                <button
                                    onClick={() => router.push(`/trade/propose?itemId=${item.id}`)}
                                    className="btn btn-primary flex-1 py-3.5"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    交換を提案する
                                </button>
                                <button
                                    onClick={() =>
                                        shareOnX({
                                            itemName: item.catalog_items?.name || "",
                                            condition: item.condition,
                                            series: item.catalog_items?.series,
                                            manufacturer: item.catalog_items?.manufacturer,
                                            itemId: item.id,
                                        })
                                    }
                                    className="btn btn-x px-4 py-3.5"
                                >
                                    <XLogo className="h-5 w-5" />
                                </button>
                            </>
                        )
                    )}
                </div>
            </div>
            {showReport && item && (
                <ReportBlockModal
                    targetType="user"
                    targetId={item.owner_id}
                    targetName={item.profiles?.display_name}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
}
