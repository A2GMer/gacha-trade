"use client";

import { useState } from "react";
import { ChevronLeft, Camera, HelpCircle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

const STEPS = [
    { id: 1, label: "写真" },
    { id: 2, label: "カタログ" },
    { id: 3, label: "詳細" },
    { id: 4, label: "設定" },
];

export default function SellPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [photos, setPhotos] = useState<string[]>([]);
    const [condition, setCondition] = useState("");
    const [manufacturer, setManufacturer] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [isTradeable, setIsTradeable] = useState(false);
    const [memo, setMemo] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleTradeableToggle = (val: boolean) => {
        setIsTradeable(val);
        if (val) setIsPublic(true);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (photos.length < 4) newErrors.photos = `写真は4枚必須です（現在 ${photos.length} 枚）`;
        if (!condition) newErrors.condition = "商品の状態を選択してください";
        if (!manufacturer) newErrors.manufacturer = "メーカーを選択してください";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            setSubmitted(true);
        }
    };

    // ===== Submitted State =====
    if (submitted) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center space-y-5 animate-bounce-in">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black mb-1">登録完了！ 🎉</h1>
                        <p className="text-sm text-muted">アイテムがコレクションに追加されました</p>
                    </div>

                    {/* X share CTA */}
                    <div className="bg-foreground text-white p-5 rounded-[20px] space-y-3">
                        <p className="text-sm font-bold">🎯 Xでシェアして交換相手を見つけよう！</p>
                        <p className="text-xs text-white/60">シェアすると交換が成立しやすくなります</p>
                        <button className="btn bg-white text-foreground hover:bg-white/90 w-full py-3 gap-2">
                            <XLogo className="h-5 w-5" />
                            Xでこのアイテムをシェアする
                        </button>
                    </div>

                    <button
                        onClick={() => router.push("/")}
                        className="btn btn-outline w-full py-3"
                    >
                        ホームに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-28 sm:pb-8">
            {/* Header */}
            <div className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-1 hover:bg-primary-light rounded-2xl transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="font-bold text-sm">アイテムを登録</h1>
                <div className="w-8" />
            </div>

            {/* Progress Bar */}
            <div className="bg-surface px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    {STEPS.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= step.id
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-background text-muted border border-border"
                                }`}>
                                {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                            </div>
                            <span className={`text-[10px] font-bold hidden sm:block ${currentStep >= step.id ? "text-primary" : "text-muted"
                                }`}>{step.label}</span>
                            {i < STEPS.length - 1 && (
                                <div className={`w-8 sm:w-16 h-0.5 mx-1 rounded ${currentStep > step.id ? "bg-primary" : "bg-border"
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-5">
                {/* Step 1: Photos */}
                <div className="card p-5 space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black flex items-center gap-2">
                            📸 商品の写真
                            <span className="badge bg-primary text-white">必須</span>
                        </h2>
                        <span className="text-xs text-muted font-bold">{photos.length}/4枚</span>
                    </div>
                    {errors.photos && (
                        <div className="flex items-center gap-2 text-danger text-xs font-bold bg-danger/5 p-3 rounded-2xl">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {errors.photos}
                        </div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary hover:bg-primary-light ${errors.photos ? "border-danger/50 bg-danger/5" : "border-border bg-background"
                                    }`}
                            >
                                <Camera className={`h-6 w-6 mb-1 ${errors.photos ? "text-danger/50" : "text-muted"}`} />
                                <span className="text-[10px] text-muted font-medium">{i + 1}枚目</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 2: Catalog Selection */}
                <div className="card p-5 space-y-4 animate-fade-in-up delay-1">
                    <h2 className="font-black">📦 カタログから選ぶ</h2>
                    {errors.manufacturer && (
                        <div className="flex items-center gap-2 text-danger text-xs font-bold bg-danger/5 p-3 rounded-2xl">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {errors.manufacturer}
                        </div>
                    )}
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-muted mb-1 block">メーカー</label>
                            <select
                                value={manufacturer}
                                onChange={(e) => setManufacturer(e.target.value)}
                                className={`w-full bg-background border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-sm font-medium transition-all ${errors.manufacturer ? "border-danger" : "border-border"
                                    }`}
                            >
                                <option value="">選択してください</option>
                                <option value="bandai">バンダイ</option>
                                <option value="takara">タカラトミーアーツ</option>
                                <option value="kitan">キタンクラブ</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted mb-1 block">シリーズ</label>
                            <select className="w-full bg-background border border-border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all">
                                <option>先にメーカーを選択してください</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        見つからない場合は「追加申請」を行ってください
                    </p>
                </div>

                {/* Step 3: Details */}
                <div className="card p-5 space-y-5 animate-fade-in-up delay-2">
                    <div className="space-y-3">
                        <h2 className="font-black">✨ 商品の状態</h2>
                        {errors.condition && (
                            <div className="flex items-center gap-2 text-danger text-xs font-bold bg-danger/5 p-3 rounded-2xl">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {errors.condition}
                            </div>
                        )}
                        <div className="flex gap-2">
                            {["未開封", "開封済", "傷あり"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => { setCondition(c); setErrors((e) => ({ ...e, condition: "" })); }}
                                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${condition === c
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
                        <h2 className="font-black">📝 メモ（任意）</h2>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="商品の状態や、交換してほしいアイテムなどを入力してください"
                            rows={3}
                            className="w-full bg-background border border-border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all resize-none"
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
                        <div className="bg-primary-light p-3 rounded-2xl flex gap-2 items-start animate-fade-in">
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
                    className="btn btn-primary w-full py-4 text-base animate-pulse-glow"
                >
                    コレクションに登録する
                </button>
            </div>
        </div>
    );
}
