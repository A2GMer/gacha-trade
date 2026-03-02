"use client";

import { useState } from "react";
import { ChevronLeft, Send, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

const CATEGORIES = [
    { value: "general", label: "一般的な質問" },
    { value: "trade", label: "取引について" },
    { value: "account", label: "アカウントについて" },
    { value: "report", label: "不正・違反の報告" },
    { value: "bug", label: "不具合の報告" },
    { value: "other", label: "その他" },
];

export default function ContactPage() {
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();

    const [category, setCategory] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState(user?.email || "");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!category || !subject.trim() || !message.trim()) {
            setError("すべての項目を入力してください");
            return;
        }
        setSubmitting(true);
        setError("");

        const { error: insertError } = await supabase.from("contact_messages").insert({
            user_id: user?.id || null,
            email: email || null,
            category,
            subject: subject.trim(),
            message: message.trim(),
        });

        if (insertError) {
            console.error("Contact form error:", insertError);
            if (insertError.code === "42P01") {
                setError("お問い合わせ情報の保存先（contact_messagesテーブル）が作成されていません。管理者に連絡するか、マイグレーション（phase1_migration.sql）を実行してください。");
            } else if (insertError.code === "42501") {
                setError("権限エラー: ログインしてから再度お試しください。");
            } else {
                setError(`送信に失敗しました（${insertError.message}）。もう一度お試しください。`);
            }
        } else {
            setSubmitted(true);
        }
        setSubmitting(false);
    };

    if (submitted) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center space-y-5 animate-bounce-in">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold mb-1">送信完了 ✉️</h1>
                        <p className="text-sm text-muted">お問い合わせを受け付けました。担当者より回答いたします。</p>
                    </div>
                    <button onClick={() => router.push("/mypage")} className="btn btn-primary w-full py-3">
                        マイページに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-28 sm:pb-8">
            <div className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-1 hover:bg-primary-light rounded-lg transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="font-bold text-sm">お問い合わせ</h1>
                <div className="w-8" />
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-5">
                {error && (
                    <div className="flex items-center gap-2 text-danger text-sm font-bold bg-danger/5 p-4 rounded-lg animate-fade-in">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="card p-5 space-y-4 animate-fade-in-up">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h2 className="font-bold">お問い合わせフォーム</h2>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-muted mb-1 block">カテゴリ</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">選択してください</option>
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    {!user && (
                        <div>
                            <label className="text-xs font-bold text-muted mb-1 block">メールアドレス</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-muted mb-1 block">件名</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="お問い合わせの件名"
                            className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-muted mb-1 block">メッセージ</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="お問い合わせ内容を詳しくご記入ください"
                            rows={5}
                            className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="btn btn-primary w-full py-4 text-base disabled:opacity-50"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Send className="h-4 w-4" /> 送信する</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
