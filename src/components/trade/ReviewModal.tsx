"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

interface ReviewModalProps {
    tradeId: string;
    targetUserId: string;
    targetUserName: string;
    onClose: () => void;
    onComplete: () => void;
}

export function ReviewModal({ tradeId, targetUserId, targetUserName, onClose, onComplete }: ReviewModalProps) {
    const { user } = useAuth();
    const supabase = createClient();
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        if (!user || rating === 0) return;
        setSubmitting(true);

        const { error } = await supabase.from("reviews").insert({
            trade_id: tradeId,
            reviewer_id: user.id,
            reviewee_id: targetUserId,
            rating,
            comment: comment.trim() || null,
        });

        if (!error) {
            // profilesの平均レーティングを更新
            const { data: reviews } = await supabase
                .from("reviews")
                .select("rating")
                .eq("reviewee_id", targetUserId);

            if (reviews && reviews.length > 0) {
                const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                await supabase
                    .from("profiles")
                    .update({ rating_avg: Math.round(avg * 10) / 10, trade_count: reviews.length })
                    .eq("id", targetUserId);
            }

            setDone(true);
            setTimeout(() => onComplete(), 1500);
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-md animate-fade-in-up">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h2 className="font-bold text-sm">⭐ 取引相手を評価</h2>
                    <button onClick={onClose} className="p-1 hover:bg-background rounded-lg"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-4 space-y-4">
                    {done ? (
                        <div className="text-center py-6 space-y-3 animate-bounce-in">
                            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="h-7 w-7 text-success" />
                            </div>
                            <p className="text-sm font-bold">評価を送信しました！ 🎉</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-muted text-center">
                                <span className="font-bold text-foreground">{targetUserName}</span> さんとの取引はいかがでしたか？
                            </p>

                            {/* Star Rating */}
                            <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHovered(star)}
                                        onMouseLeave={() => setHovered(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`h-8 w-8 transition-colors ${star <= (hovered || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-border"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-xs text-muted">
                                {rating === 0 ? "タップして評価" :
                                    rating === 1 ? "悪い" :
                                        rating === 2 ? "やや不満" :
                                            rating === 3 ? "普通" :
                                                rating === 4 ? "良い" : "とても良い！"}
                            </p>

                            {/* Comment */}
                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">コメント（任意）</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="取引の感想を書いてください"
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || rating === 0}
                                className="btn btn-primary w-full py-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "評価を送信する"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
