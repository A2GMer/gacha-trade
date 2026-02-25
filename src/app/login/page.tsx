"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { signIn, signUp } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                const result = await signIn(email, password);
                if (result.error) {
                    setError(result.error);
                } else {
                    router.push("/");
                    router.refresh();
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
                } else {
                    setSignUpSuccess(true);
                }
            }
        } catch {
            setError("エラーが発生しました。もう一度お試しください。");
        } finally {
            setLoading(false);
        }
    };

    if (signUpSuccess) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center space-y-5 animate-bounce-in">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black mb-1">確認メールを送信しました 📧</h1>
                        <p className="text-sm text-muted">
                            <strong>{email}</strong> に確認メールを送信しました。<br />
                            メール内のリンクをクリックして、アカウントを有効化してください。
                        </p>
                    </div>
                    <button
                        onClick={() => { setSignUpSuccess(false); setIsLogin(true); }}
                        className="btn btn-primary w-full py-3"
                    >
                        ログイン画面に戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6 animate-fade-in-up">
                {/* Logo & Title */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 gradient-hero rounded-[24px] flex items-center justify-center mx-auto shadow-lg">
                        <span className="text-white font-black text-2xl">G</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">ガチャトレ</h1>
                        <p className="text-sm text-muted mt-1">
                            カプセルトイの物々交換サービス
                        </p>
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="bg-surface rounded-[20px] p-1 flex border border-border">
                    <button
                        onClick={() => { setIsLogin(true); setError(""); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-2xl transition-all ${isLogin
                                ? "bg-white text-foreground shadow-sm"
                                : "text-muted hover:text-foreground"
                            }`}
                    >
                        ログイン
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(""); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-2xl transition-all ${!isLogin
                                ? "bg-white text-foreground shadow-sm"
                                : "text-muted hover:text-foreground"
                            }`}
                    >
                        新規登録
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="card p-6 space-y-5">
                    {error && (
                        <div className="bg-danger/5 border border-danger/20 text-danger text-sm font-medium p-3 rounded-2xl animate-fade-in">
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted block">
                                表示名
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="ニックネーム"
                                    className="w-full bg-background border border-border rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                    autoComplete="name"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted block">
                            メールアドレス
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="w-full bg-background border border-border rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted block">
                            パスワード
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="6文字以上"
                                className="w-full bg-background border border-border rounded-2xl py-3 pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                required
                                minLength={6}
                                autoComplete={isLogin ? "current-password" : "new-password"}
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3.5 text-base gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isLogin ? "ログイン" : "アカウントを作成"}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Safety badge */}
                <div className="flex justify-center">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                        <span>安全な取引のための本人確認システム</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
