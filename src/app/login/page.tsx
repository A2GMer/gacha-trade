"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Eye, EyeOff, ArrowRightLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (isLogin) {
            const result = await signIn(email, password);
            if (result.error) {
                setError(result.error);
                setLoading(false);
            } else {
                router.push("/dashboard");
            }
        } else {
            if (!displayName.trim()) {
                setError("表示名を入力してください");
                setLoading(false);
                return;
            }
            const result = await signUp(email, password, displayName);
            if (result.error) {
                setError(result.error);
                setLoading(false);
            } else {
                setSuccess(true);
                setLoading(false);
            }
        }
    }

    if (success) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center space-y-4 animate-bounce-in">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="h-8 w-8 text-success" />
                    </div>
                    <h2 className="text-lg font-bold">確認メールを送信しました</h2>
                    <p className="text-sm text-muted leading-relaxed">
                        <strong>{email}</strong> に確認メールを送信しました。
                        メール内のリンクをクリックして、アカウントを有効化してください。
                    </p>
                    <button
                        onClick={() => { setSuccess(false); setIsLogin(true); }}
                        className="btn btn-primary px-6 py-3"
                    >
                        ログイン画面に戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6 animate-fade-in-up">
                    {/* Logo & Tagline */}
                    <div className="text-center space-y-2">
                        <img src="/logo.webp" alt="スワコレ" className="h-12 mx-auto object-contain" />
                        <p className="text-sm text-muted">カプセルトイの物々交換サービス</p>
                    </div>

                    {/* Toggle */}
                    <div className="flex bg-background rounded-lg p-1 border border-border">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isLogin ? "bg-surface shadow-sm text-foreground" : "text-muted"
                                }`}
                        >
                            ログイン
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isLogin ? "bg-surface shadow-sm text-foreground" : "text-muted"
                                }`}
                        >
                            新規登録
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted">表示名</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="ニックネーム"
                                        className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted">メールアドレス</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    required
                                    className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted">パスワード</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="8文字以上"
                                    required
                                    minLength={8}
                                    className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                                <p className="text-xs text-danger font-bold">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3.5 text-base gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? "ログイン" : "アカウントを作成"}
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Trust Message */}
                    <div className="card p-4 bg-accent-light border border-accent/10">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-accent">安心・安全な交換のために</p>
                                <p className="text-[10px] text-accent/70 mt-0.5 leading-relaxed">
                                    本人確認（電話番号認証）を行うと、取引相手からの信頼度が向上し、交換成立率がアップします
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
