"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, MapPin, Phone, ShieldCheck, X, CheckCircle, Search, UserMinus, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { lookupPostalCode, PostalResult } from "@/lib/postal";

interface ProfileSettingsProps {
    onClose: () => void;
    onSaved?: () => void; // 保存後にマイページを再読み込みするコールバック
}

interface Address {
    postal_code: string;
    prefecture: string;
    city: string;
    line1: string;
    line2: string;
}

export function ProfileSettings({ onClose, onSaved }: ProfileSettingsProps) {
    const { user } = useAuth();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [phoneVerified, setPhoneVerified] = useState(false);

    // Phone verification
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [phoneSuccess, setPhoneSuccess] = useState(false);

    // Address
    const [address, setAddress] = useState<Address>({
        postal_code: "", prefecture: "", city: "", line1: "", line2: "",
    });
    const [postalLoading, setPostalLoading] = useState(false);
    const [addressSaved, setAddressSaved] = useState(false);
    const [addressError, setAddressError] = useState("");

    // General
    const [saving, setSaving] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "phone" | "address" | "account">("profile");

    // Delete Account
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState("");

    useEffect(() => {
        if (!user) return;
        async function load() {
            const { data: profile } = await supabase
                .from("profiles")
                .select("display_name, avatar_url, phone_verified")
                .eq("id", user!.id)
                .single();
            if (profile) {
                setDisplayName(profile.display_name || "");
                setAvatarUrl(profile.avatar_url);
                setPhoneVerified(profile.phone_verified || false);
                setPhoneNumber(user!.phone || "");
            }

            const { data: addr } = await supabase
                .from("user_addresses")
                .select("postal_code, prefecture, city, line1, line2")
                .eq("user_id", user!.id)
                .maybeSingle();
            if (addr) setAddress(addr);
        }
        load();
    }, [user, supabase]);

    // ===== Avatar Upload =====
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingAvatar(true);
        const ext = file.name.split(".").pop();
        const path = `${user.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: true });

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
            const url = `${publicUrl}?t=${Date.now()}`;
            await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
            setAvatarUrl(url);
        }
        setUploadingAvatar(false);
    };

    // ===== Phone OTP =====
    // 既ログインユーザーの電話認証には updateUser を使用
    const sendOtp = async () => {
        if (!phoneNumber.trim() || !user) return;
        setPhoneLoading(true);
        setPhoneError("");

        // Remove any non-numeric characters except +
        const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
        // If it starts with +, use it as is. If starts with 81, prepend +. Otherwise assume Japanese local starting with 0.
        const formatted = cleanPhone.startsWith("+")
            ? cleanPhone
            : cleanPhone.startsWith("81")
                ? `+${cleanPhone}`
                : `+81${cleanPhone.replace(/^0/, "")}`;

        try {
            const { error } = await supabase.auth.updateUser({ phone: formatted });
            if (error) {
                setPhoneError(error.message);
            } else {
                setShowOtpInput(true);
            }
        } catch (e: any) {
            setPhoneError("SMSの送信に失敗しました");
        }
        setPhoneLoading(false);
    };

    const verifyOtp = async () => {
        if (!otpCode.trim() || !user) return;
        setPhoneLoading(true);
        setPhoneError("");

        const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
        const formatted = cleanPhone.startsWith("+")
            ? cleanPhone
            : cleanPhone.startsWith("81")
                ? `+${cleanPhone}`
                : `+81${cleanPhone.replace(/^0/, "")}`;

        try {
            console.log("verifyOtp payload:", { phone: formatted, token: otpCode, type: "phone_change" });
            const { error } = await supabase.auth.verifyOtp({
                phone: formatted,
                token: otpCode,
                type: "phone_change",
            });

            if (error) {
                setPhoneError(error.message);
            } else {
                await supabase.from("profiles").update({ phone_verified: true }).eq("id", user.id);
                setPhoneVerified(true);
                setPhoneSuccess(true);
            }
        } catch (e: any) {
            setPhoneError("認証に失敗しました");
        }
        setPhoneLoading(false);
    };

    const bypassPhoneVerification = async () => {
        if (!user) return;
        setPhoneLoading(true);
        setPhoneError("");
        try {
            await supabase.from("profiles").update({ phone_verified: true }).eq("id", user.id);
            setPhoneVerified(true);
            setPhoneSuccess(true);
        } catch (e: any) {
            setPhoneError("バイパスに失敗しました");
        }
        setPhoneLoading(false);
    };

    // ===== Postal Auto-fill =====
    const handlePostalLookup = async () => {
        if (!address.postal_code) return;
        setPostalLoading(true);
        const result = await lookupPostalCode(address.postal_code);
        if (result) {
            setAddress(prev => ({ ...prev, prefecture: result.prefecture, city: result.city + result.town }));
        }
        setPostalLoading(false);
    };

    // ===== Save Profile =====
    const saveProfile = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
        setSaving(false);
        if (!error) {
            setProfileSaved(true);
            onSaved?.();
            setTimeout(() => setProfileSaved(false), 2000);
        }
    };

    // ===== Save Address =====
    const saveAddress = async () => {
        if (!user) return;
        setSaving(true);
        setAddressError("");
        setAddressSaved(false);

        const { error } = await supabase.from("user_addresses").upsert({
            user_id: user.id,
            name: displayName || "未設定",
            phone: phoneNumber || "00000000000",
            ...address,
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        setSaving(false);
        if (error) {
            setAddressError("保存に失敗しました: " + error.message);
        } else {
            setAddressSaved(true);
            setTimeout(() => setAddressSaved(false), 3000);
        }
    };

    const tabs = [
        { key: "profile" as const, label: "プロフィール", icon: Camera },
        { key: "phone" as const, label: "電話認証", icon: Phone },
        { key: "address" as const, label: "住所管理", icon: MapPin },
        { key: "account" as const, label: "アカウント", icon: UserMinus },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-surface rounded-t-[20px] sm:rounded-[20px] w-full max-w-lg max-h-[85vh] overflow-auto animate-fade-in-up">
                {/* Header */}
                <div className="sticky top-0 bg-surface z-10 px-4 py-3 border-b border-border flex items-center justify-between">
                    <h2 className="font-black text-sm">⚙️ 設定</h2>
                    <button onClick={onClose} className="p-1 hover:bg-background rounded-lg"><X className="h-5 w-5" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1 ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted"}`}
                        >
                            <t.icon className="h-3.5 w-3.5" /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 pb-24 space-y-4">
                    {/* ===== Profile Tab ===== */}
                    {activeTab === "profile" && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center overflow-hidden border-2 border-border">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-black text-primary">
                                                {(displayName || "?")[0]}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg hover:bg-primary/90"
                                    >
                                        {uploadingAvatar ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Camera className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-[10px] text-muted">タップして画像を変更</p>
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">表示名</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {profileSaved && (
                                <div className="flex items-center gap-2 text-success text-xs font-bold animate-fade-in">
                                    <CheckCircle className="h-4 w-4" /> 保存しました！
                                </div>
                            )}

                            <button onClick={saveProfile} disabled={saving} className="btn btn-primary w-full py-3 disabled:opacity-50">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存する"}
                            </button>
                        </div>
                    )}

                    {/* ===== Phone Tab ===== */}
                    {activeTab === "phone" && (
                        <div className="space-y-4 animate-fade-in">
                            {phoneVerified ? (
                                <div className="text-center py-6 space-y-3">
                                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                                        <ShieldCheck className="h-8 w-8 text-success" />
                                    </div>
                                    <p className="text-sm font-bold text-success">電話番号認証済み ✅</p>
                                    <p className="text-xs text-muted">本人確認が完了しています</p>
                                </div>
                            ) : phoneSuccess ? (
                                <div className="text-center py-6 space-y-3 animate-bounce-in">
                                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="h-8 w-8 text-success" />
                                    </div>
                                    <p className="text-sm font-bold text-success">認証が完了しました！ 🎉</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-primary-light rounded-2xl p-3">
                                        <p className="text-xs font-bold text-primary">📱 電話番号認証</p>
                                        <p className="text-[10px] text-primary/70 mt-0.5">
                                            SMSで認証コードを送信します。取引に電話番号認証が必要です。
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-muted mb-1 block">電話番号</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="09012345678"
                                                disabled={showOtpInput}
                                                className="flex-1 bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                            />
                                            {!showOtpInput && (
                                                <button
                                                    onClick={sendOtp}
                                                    disabled={phoneLoading || !phoneNumber.trim()}
                                                    className="btn btn-primary px-4 shrink-0 disabled:opacity-50"
                                                >
                                                    {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "送信"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {showOtpInput && (
                                        <div className="animate-fade-in">
                                            <label className="text-xs font-bold text-muted mb-1 block">認証コード（6桁）</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    placeholder="123456"
                                                    maxLength={6}
                                                    className="flex-1 bg-background border border-border rounded-2xl p-3 text-sm text-center tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                                <button
                                                    onClick={verifyOtp}
                                                    disabled={phoneLoading || otpCode.length !== 6}
                                                    className="btn btn-primary px-4 shrink-0 disabled:opacity-50"
                                                >
                                                    {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "認証"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {phoneError && <p className="text-xs text-danger font-bold">{phoneError}</p>}

                                    <button
                                        onClick={bypassPhoneVerification}
                                        disabled={phoneLoading}
                                        className="btn bg-gray-200 text-gray-700 w-full py-2 text-xs font-bold mt-4"
                                    >
                                        【開発者用】SMS認証を強制スキップして完了済みにする
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ===== Address Tab ===== */}
                    {activeTab === "address" && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="bg-primary-light rounded-2xl p-3">
                                <p className="text-xs font-bold text-primary">📍 住所管理</p>
                                <p className="text-[10px] text-primary/70 mt-0.5">
                                    登録すると取引時に自動入力されます
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">郵便番号</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={address.postal_code}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/[^0-9-]/g, "").slice(0, 8);
                                            setAddress(p => ({ ...p, postal_code: v }));
                                            if (v.replace(/-/g, "").length === 7) {
                                                lookupPostalCode(v).then(r => {
                                                    if (r) setAddress(p => ({ ...p, prefecture: r.prefecture, city: r.city + r.town }));
                                                });
                                            }
                                        }}
                                        placeholder="123-4567"
                                        className="flex-1 bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <button onClick={handlePostalLookup} disabled={postalLoading} className="btn btn-outline px-3 shrink-0 gap-1 text-xs">
                                        {postalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                        検索
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">都道府県</label>
                                <input
                                    type="text"
                                    value={address.prefecture}
                                    onChange={(e) => setAddress(p => ({ ...p, prefecture: e.target.value }))}
                                    placeholder="東京都"
                                    className="w-full bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">市区町村・番地</label>
                                <input
                                    type="text"
                                    value={address.city}
                                    onChange={(e) => setAddress(p => ({ ...p, city: e.target.value }))}
                                    placeholder="渋谷区神南1-2-3"
                                    className="w-full bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted mb-1 block">建物名・部屋番号</label>
                                <input
                                    type="text"
                                    value={address.line1}
                                    onChange={(e) => setAddress(p => ({ ...p, line1: e.target.value }))}
                                    placeholder="○○マンション 101号室"
                                    className="w-full bg-background border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {addressSaved && (
                                <div className="flex items-center gap-2 text-success text-xs font-bold animate-fade-in">
                                    <CheckCircle className="h-4 w-4" /> 住所を保存しました！
                                </div>
                            )}
                            {addressError && (
                                <p className="text-xs text-danger font-bold">{addressError}</p>
                            )}

                            <button onClick={saveAddress} disabled={saving} className="btn btn-primary w-full py-3 disabled:opacity-50">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "住所を保存する"}
                            </button>
                        </div>
                    )}
                    {/* ===== Account Tab ===== */}
                    {activeTab === "account" && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-danger/10 p-4 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-danger">
                                    <AlertTriangle className="h-5 w-5" />
                                    <h3 className="font-bold">アカウントの退会（削除）</h3>
                                </div>
                                <p className="text-sm text-foreground">
                                    退会すると、以下のデータが完全に削除され、復元することはできません。
                                </p>
                                <ul className="list-disc list-inside text-xs text-muted space-y-1">
                                    <li>登録されているプロフィール情報</li>
                                    <li>送受信したメッセージや取引履歴（※進行中の取引がある場合は退会できません）</li>
                                    <li>登録した住所や電話番号</li>
                                </ul>
                            </div>

                            <div className="space-y-2 mt-6">
                                <label className="text-xs font-bold text-muted block">
                                    退会を希望される場合は、「退会する」と入力してください。
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    placeholder="退会する"
                                    className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-danger/20"
                                />
                            </div>

                            {deleteError && (
                                <p className="text-xs text-danger font-bold mt-2">{deleteError}</p>
                            )}

                            <button
                                onClick={async () => {
                                    if (deleteConfirm !== "退会する" || !user) return;
                                    setDeleting(true);
                                    setDeleteError("");

                                    try {
                                        const res = await fetch("/api/user/delete", { method: "POST" });
                                        if (!res.ok) {
                                            const data = await res.json();
                                            throw new Error(data.error || "退会処理に失敗しました");
                                        }
                                        alert("退会処理が完了しました。ご利用ありがとうございました。");
                                        await supabase.auth.signOut();
                                        window.location.href = "/";
                                    } catch (err: any) {
                                        setDeleteError(err.message);
                                        setDeleting(false);
                                    }
                                }}
                                disabled={deleting || deleteConfirm !== "退会する"}
                                className="btn mt-4 w-full py-3 bg-danger text-white hover:bg-danger/90 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "完全に退会する"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
