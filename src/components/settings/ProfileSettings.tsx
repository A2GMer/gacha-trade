"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, MapPin, Phone, ShieldCheck, X, CheckCircle, Search, UserMinus, AlertTriangle, Link as LinkIcon, Unlink } from "lucide-react";
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

    // X Link
    const [xUsername, setXUsername] = useState<string | null>(null);
    const [displayNameSource, setDisplayNameSource] = useState<"manual" | "twitter">("manual");
    const [isXLinked, setIsXLinked] = useState(false);
    const [xLinkLoading, setXLinkLoading] = useState(false);

    // General
    const [saving, setSaving] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "phone" | "address" | "x_link" | "account">("profile");

    // Delete Account
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState("");

    useEffect(() => {
        if (!user) return;
        async function load() {
            const { data: profile } = await supabase
                .from("profiles")
                .select("display_name, avatar_url, phone_verified, x_username, display_name_source")
                .eq("id", user!.id)
                .single();
            if (profile) {
                setDisplayName(profile.display_name || "");
                setAvatarUrl(profile.avatar_url);
                setPhoneVerified(profile.phone_verified || false);
                setPhoneNumber(user!.phone || "");
                setXUsername(profile.x_username || null);
                setDisplayNameSource(profile.display_name_source || "manual");
            }

            const { data: addr } = await supabase
                .from("user_addresses")
                .select("postal_code, prefecture, city, line1, line2")
                .eq("user_id", user!.id)
                .maybeSingle();
            if (addr) setAddress(addr);

            // X連携状態の確認 (app_metadataを見る)
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const providers = currentUser?.app_metadata?.providers || [];
            setIsXLinked(providers.includes("twitter"));
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
        const { error } = await supabase
            .from("profiles")
            .update({ display_name: displayName, display_name_source: displayNameSource })
            .eq("id", user.id);
        setSaving(false);
        if (!error) {
            setProfileSaved(true);
            onSaved?.();
            setTimeout(() => setProfileSaved(false), 2000);
        }
    };

    // ===== X Link / Unlink =====
    const handleXLink = async () => {
        setXLinkLoading(true);
        const { error } = await supabase.auth.linkIdentity({ provider: 'twitter' });
        if (error) {
            alert("Xアカウントの連携に失敗しました: " + error.message);
        }
        // linkIdentityはリダイレクトするためここは呼ばれない事が多い
        setXLinkLoading(false);
    };

    const handleXUnlink = async () => {
        if (!user || !confirm("Xとの連携を解除しますか？")) return;
        setXLinkLoading(true);
        const { data: identities } = await supabase.auth.getUserIdentities();
        const twitterIdentity = identities?.identities.find(i => i.provider === 'twitter');

        if (twitterIdentity) {
            const { error } = await supabase.auth.unlinkIdentity(twitterIdentity);
            if (!error) {
                setIsXLinked(false);
                setXUsername(null);
                setDisplayNameSource("manual");
                await supabase.from("profiles").update({
                    x_username: null,
                    display_name_source: "manual"
                }).eq("id", user.id);
            } else {
                alert("解除に失敗しました: " + error.message);
            }
        }
        setXLinkLoading(false);
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
        { key: "x_link" as const, label: "X連携", icon: LinkIcon },
        { key: "account" as const, label: "アカウント", icon: UserMinus },
    ];

    function XLogo({ className = "h-4 w-4" }: { className?: string }) {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        );
    }

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

                    {/* ===== X Link Tab ===== */}
                    {activeTab === "x_link" && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-foreground/5 rounded-2xl p-3">
                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><XLogo className="text-foreground" /> X（Twitter）連携</p>
                                <p className="text-[10px] text-muted mt-0.5">
                                    Xアカウントを連携すると、ログインが簡単になり、Xのユーザー名を表示名として使用できます。
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted block">連携ステータス</label>
                                {isXLinked ? (
                                    <div className="card p-4 border border-border flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-foreground text-white flex items-center justify-center">
                                                <XLogo className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">連携済み</p>
                                                {xUsername && <p className="text-xs text-muted">@{xUsername}</p>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleXUnlink}
                                            disabled={xLinkLoading}
                                            className="btn btn-outline text-xs px-3 py-1.5 gap-1.5"
                                        >
                                            {xLinkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                                            解除
                                        </button>
                                    </div>
                                ) : (
                                    <div className="card p-4 border border-border flex flex-col items-center justify-center space-y-3 text-center">
                                        <div className="w-12 h-12 rounded-full bg-foreground/10 text-foreground flex items-center justify-center mb-1">
                                            <XLogo className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">未連携</p>
                                            <p className="text-xs text-muted">アカウントを連携していません</p>
                                        </div>
                                        <button
                                            onClick={handleXLink}
                                            disabled={xLinkLoading}
                                            className="btn bg-foreground text-white hover:bg-foreground/90 w-full py-2.5 mt-2 gap-2"
                                        >
                                            {xLinkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                                            Xアカウントを連携する
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 表示名の選択（連携済みの場合のみ表示） */}
                            {isXLinked && xUsername && (
                                <div className="space-y-3 pt-4 border-t border-border mt-4">
                                    <label className="text-xs font-bold text-muted block">スワコレでの表示名</label>

                                    <div className="space-y-2">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${displayNameSource === "manual" ? "border-primary bg-primary/5" : "border-border hover:bg-surface"}`}>
                                            <input
                                                type="radio"
                                                name="displayNameSource"
                                                checked={displayNameSource === "manual"}
                                                onChange={() => setDisplayNameSource("manual")}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold">手動設定を使う</p>
                                                <p className="text-xs text-muted">{displayName}</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${displayNameSource === "twitter" ? "border-primary bg-primary/5" : "border-border hover:bg-surface"}`}>
                                            <input
                                                type="radio"
                                                name="displayNameSource"
                                                checked={displayNameSource === "twitter"}
                                                onChange={() => setDisplayNameSource("twitter")}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold">Xの表示名を使う</p>
                                                <p className="text-xs text-muted">@{xUsername}</p>
                                            </div>
                                        </label>
                                    </div>

                                    {profileSaved && (
                                        <div className="flex items-center gap-2 text-success text-xs font-bold animate-fade-in mt-2">
                                            <CheckCircle className="h-4 w-4" /> 保存しました！
                                        </div>
                                    )}

                                    <button onClick={saveProfile} disabled={saving} className="btn btn-primary w-full py-3 mt-4 disabled:opacity-50">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "設定を保存する"}
                                    </button>
                                </div>
                            )}
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
