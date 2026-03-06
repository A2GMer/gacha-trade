"use client";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, Suspense } from "react";
import { ArrowRight, ShieldCheck, X } from "lucide-react";
import Link from "next/link";

function XReferralBannerInner() {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    const utmSource = searchParams.get("utm_source");

    // X経由 かつ 未ログインの場合のみ表示
    if (utmSource !== "x" || user || dismissed) return null;

    return (
        <div className="relative bg-gradient-to-r from-foreground to-foreground/90 text-white px-4 py-4 animate-fade-in-up">
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="h-4 w-4 text-white/60" />
            </button>
            <div className="container mx-auto max-w-4xl">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-white/80 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-bold">
                            スワコレなら、DM不要で安全に交換できます
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                            住所の安全管理・取引トラブルサポート・相互評価システムで、安心して交換できる環境を提供しています。
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 bg-white text-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors mt-1"
                        >
                            無料で始める
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function XReferralBanner() {
    return (
        <Suspense fallback={null}>
            <XReferralBannerInner />
        </Suspense>
    );
}
