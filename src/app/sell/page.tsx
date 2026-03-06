"use client";

import { useState } from "react";
import { ChevronLeft, HelpCircle, Info, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { ImageUploader } from "@/components/items/ImageUploader";
import { CatalogSelector } from "@/components/items/CatalogSelector";
import { shareOnX } from "@/lib/share";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

interface CatalogItem {
    id: string;
    name: string;
    manufacturer: string;
    series: string;
    image_url: string | null;
}

export default function SellPage() {
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();

    const [images, setImages] = useState<string[]>([]);
    const [catalogItemId, setCatalogItemId] = useState<string | null>(null);
    const [catalogItem, setCatalogItem] = useState<CatalogItem | null>(null);
    const [condition, setCondition] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [isTradeable, setIsTradeable] = useState(false);
    const [memo, setMemo] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submittedItemId, setSubmittedItemId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // X Import States
    const [tweetUrl, setTweetUrl] = useState("");
    const [fetchingTweet, setFetchingTweet] = useState(false);
    const [tweetHtml, setTweetHtml] = useState("");
    const [tweetError, setTweetError] = useState("");

    const fetchTweet = async () => {
        if (!tweetUrl) return;
        setFetchingTweet(true);
        setTweetError("");
        setTweetHtml("");
        try {
            const res = await fetch(`/api/tweet-preview?url=${encodeURIComponent(tweetUrl)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "取得に失敗しました");
            if (data.html) {
                setTweetHtml(data.html);
            } else {
                setTweetError("ツイート情報の取得に失敗しました");
            }
        } catch (err: any) {
            setTweetError(err.message || "ツイート情報の取得に失敗しました");
        } finally {
            setFetchingTweet(false);
        }
    };

    const copyTweetText = () => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = tweetHtml;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        // 不要な「— アカウント名 (@username) 日付」などの末尾部分もある程度入るが、ユーザーが消せるのでOKとする
        setMemo((prev) => prev ? prev + "\n\n" + text.trim() : text.trim());
    };

    const handleTradeableToggle = (val: boolean) => {
        setIsTradeable(val);
        if (val) setIsPublic(true);
    };

    const handleCatalogChange = (itemId: string | null, item: CatalogItem | null) => {
        setCatalogItemId(itemId);
        setCatalogItem(item);
        if (itemId) {
            setErrors((e) => ({ ...e, catalog: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (images.length < 1) newErrors.photos = "写真は1枚以上必須です";
        if (!condition) newErrors.condition = "商品の状態を選択してください";
        if (!catalogItemId) newErrors.catalog = "カタログからアイテムを選択してください";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || !user) return;

        setSubmitting(true);
        try {
            const { data, error } = await supabase
                .from("user_items")
                .insert({
                    owner_id: user.id,
                    catalog_item_id: catalogItemId,
                    images,
                    condition,
                    quantity,
                    memo: memo || null,
                    is_public: isPublic,
                    is_tradeable: isTradeable,
                })
                .select("id")
                .single();

            if (error) {
                console.error("Insert error:", error);
                setErrors({ submit: "登録に失敗しました。もう一度お試しください。" });
                return;
            }

            setSubmittedItemId(data.id);
            setSubmitted(true);
        } catch (err) {
            console.error("Submit failed:", err);
            setErrors({ submit: "登録に失敗しました。" });
        } finally {
            setSubmitting(false);
        }
    };

    // ===== Submitted State =====
    if (submitted && submittedItemId) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center space-y-5 animate-bounce-in">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold mb-1">登録完了！ 🎉</h1>
                        <p className="text-sm text-muted">アイテムがコレクションに追加されました</p>
                    </div>

                    {/* X share CTA */}
                    <div className="bg-foreground text-white p-5 rounded-[20px] space-y-3">
                        <p className="text-sm font-bold">🎯 Xでシェアして交換相手を見つけよう！</p>
                        <p className="text-xs text-white/60">シェアすると交換が成立しやすくなります</p>
                        <button
                            className="btn bg-white text-foreground hover:bg-white/90 w-full py-3 gap-2"
                            onClick={() => {
                                if (catalogItem) {
                                    shareOnX({
                                        itemName: catalogItem.name,
                                        condition,
                                        series: catalogItem.series,
                                        manufacturer: catalogItem.manufacturer,
                                        itemId: submittedItemId,
                                    });
                                }
                            }}
                        >
                            <XLogo className="h-5 w-5" />
                            Xでこのアイテムをシェアする
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push(`/item/${submittedItemId}`)}
                            className="btn btn-primary flex-1 py-3"
                        >
                            アイテムを見る
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="btn btn-outline flex-1 py-3"
                        >
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-28 sm:pb-8">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-1 hover:bg-primary-light rounded-lg transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="font-bold text-sm">アイテムを登録</h1>
                <div className="w-8" />
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-5">
                {errors.submit && (
                    <div className="flex items-center gap-2 text-danger text-sm font-bold bg-danger/5 p-4 rounded-lg animate-fade-in">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {errors.submit}
                    </div>
                )}

                {/* X Import (Optional) */}
                <div className="card p-5 animate-fade-in-up">
                    <h2 className="font-bold mb-3 flex items-center gap-2">
                        <XLogo className="h-4 w-4" />
                        Xの投稿から取り込む（任意）
                    </h2>
                    <p className="text-xs text-muted mb-3">
                        すでにXで交換や譲渡を募集している場合、投稿のURLを入力すると内容を参照しながら出品できます。
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tweetUrl}
                            onChange={(e) => setTweetUrl(e.target.value)}
                            placeholder="https://x.com/..."
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <button
                            onClick={fetchTweet}
                            disabled={!tweetUrl || fetchingTweet}
                            className="btn btn-outline px-4 shrink-0 disabled:opacity-50"
                        >
                            {fetchingTweet ? (
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                                "読込"
                            )}
                        </button>
                    </div>
                    {tweetError && (
                        <p className="text-danger text-xs mt-2">{tweetError}</p>
                    )}
                    {tweetHtml && (
                        <div className="mt-4 space-y-3 border-t border-border pt-4 animate-fade-in-up">
                            <div
                                className="tweet-preview-container max-h-64 overflow-y-auto bg-background rounded-lg p-3 text-sm border border-border"
                                dangerouslySetInnerHTML={{ __html: tweetHtml }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={copyTweetText}
                                    className="btn btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                                >
                                    <Download className="h-3 w-3" />
                                    テキストをメモにコピー
                                </button>
                                <button
                                    onClick={() => { setTweetHtml(""); setTweetUrl(""); }}
                                    className="btn btn-outline px-3 py-2 text-xs"
                                >
                                    クリア
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 1: Photos */}
                <div className="card p-5 animate-fade-in-up">
                    <ImageUploader
                        images={images}
                        onChange={setImages}
                        error={errors.photos}
                    />
                </div>

                {/* Step 2: Catalog Selection */}
                <div className="card p-5 animate-fade-in-up delay-1">
                    <CatalogSelector
                        selectedItemId={catalogItemId}
                        onChange={handleCatalogChange}
                        error={errors.catalog}
                    />
                </div>

                {/* Step 3: Details */}
                <div className="card p-5 space-y-5 animate-fade-in-up delay-2">
                    <div className="space-y-3">
                        <h2 className="font-bold">✨ 商品の状態</h2>
                        {errors.condition && (
                            <div className="flex items-center gap-2 text-danger text-xs font-bold bg-danger/5 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {errors.condition}
                            </div>
                        )}
                        <div className="flex gap-2">
                            {["未開封", "開封済", "傷あり"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => { setCondition(c); setErrors((e) => ({ ...e, condition: "" })); }}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${condition === c
                                        ? "bg-primary text-white shadow-md"
                                        : `bg-background text-foreground border ${errors.condition ? "border-danger/30" : "border-border"} hover:border-primary`
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-bold">🔢 数量</h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-lg border border-border text-lg font-bold hover:border-primary transition-colors"
                            >
                                −
                            </button>
                            <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 rounded-lg border border-border text-lg font-bold hover:border-primary transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-bold">📝 メモ（任意）</h2>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="商品の状態や、交換してほしいアイテムなどを入力してください"
                            rows={3}
                            className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Step 4: Visibility & Trading */}
                <div className="card p-5 space-y-4 animate-fade-in-up delay-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-sm">全体に公開する</h2>
                            <p className="text-[10px] text-muted">他のユーザーが検索できるようになります</p>
                        </div>
                        <button
                            onClick={() => !isTradeable && setIsPublic(!isPublic)}
                            className={`toggle ${isPublic ? "active" : ""}`}
                            disabled={isTradeable}
                        />
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <div>
                            <h2 className="font-bold text-sm text-primary">🔄 交換に出す</h2>
                            <p className="text-[10px] text-muted">交換提案を受けられるようになります</p>
                        </div>
                        <button
                            onClick={() => handleTradeableToggle(!isTradeable)}
                            className={`toggle ${isTradeable ? "active" : ""}`}
                        />
                    </div>

                    {isTradeable && (
                        <div className="bg-primary-light p-3 rounded-lg flex gap-2 items-start animate-fade-in">
                            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-primary font-medium leading-tight">
                                「交換に出す」が有効な場合、自動的に「全体に公開」設定になります。
                            </p>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        "コレクションに登録する"
                    )}
                </button>
            </div>
        </div>
    );
}
