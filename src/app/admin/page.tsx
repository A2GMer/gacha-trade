"use client";

import { useState, useEffect } from "react";
import {
    ShieldAlert,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Users,
    Package,
    ChevronRight,
    Search,
    Flag,
    UserX,
    Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

interface Report {
    id: string;
    reason: string;
    status: string;
    created_at: string;
    reporter_id: string;
    trade_id: string;
    evidence_urls: string[];
    admin_note: string | null;
}

interface PendingCatalog {
    id: string;
    name: string;
    manufacturer: string;
    series: string;
    image_url: string | null;
    is_approved: boolean;
    created_at: string;
}

interface FrozenUser {
    id: string;
    display_name: string;
    is_frozen: boolean;
    trade_count: number;
    rating_avg: number;
}

export default function AdminPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState("reports");
    const [reports, setReports] = useState<Report[]>([]);
    const [pendingCatalog, setPendingCatalog] = useState<PendingCatalog[]>([]);
    const [users, setUsers] = useState<FrozenUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [reportsRes, catalogRes, usersRes] = await Promise.all([
                supabase
                    .from("disputes")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(50),
                supabase
                    .from("catalog_items")
                    .select("*")
                    .eq("is_approved", false)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("profiles")
                    .select("id, display_name, is_frozen, trade_count, rating_avg")
                    .order("created_at", { ascending: false })
                    .limit(50),
            ]);

            if (reportsRes.data) setReports(reportsRes.data as Report[]);
            if (catalogRes.data) setPendingCatalog(catalogRes.data as PendingCatalog[]);
            if (usersRes.data) setUsers(usersRes.data as FrozenUser[]);
            setLoading(false);
        }
        fetchData();
    }, [supabase]);

    async function approveItem(id: string) {
        await supabase.from("catalog_items").update({ is_approved: true }).eq("id", id);
        setPendingCatalog((prev) => prev.filter((c) => c.id !== id));
    }

    async function rejectItem(id: string) {
        await supabase.from("catalog_items").delete().eq("id", id);
        setPendingCatalog((prev) => prev.filter((c) => c.id !== id));
    }

    async function toggleFreeze(userId: string, freeze: boolean) {
        await supabase.from("profiles").update({ is_frozen: freeze }).eq("id", userId);
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, is_frozen: freeze } : u))
        );
    }

    async function resolveDispute(id: string, note: string) {
        await supabase
            .from("disputes")
            .update({ status: "RESOLVED", admin_note: note })
            .eq("id", id);
        setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: "RESOLVED", admin_note: note } : r))
        );
    }

    const tabs = [
        { key: "reports", label: "通報・紛争", icon: Flag, count: reports.filter((r) => r.status === "OPEN").length },
        { key: "catalog", label: "カタログ申請", icon: Package, count: pendingCatalog.length },
        { key: "users", label: "ユーザー管理", icon: Users, count: users.filter((u) => u.is_frozen).length },
    ];

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface px-4 py-5 border-b border-border">
                <h1 className="text-lg font-black flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    運営管理画面
                </h1>
            </div>

            {/* Tabs */}
            <div className="tab-bar bg-surface px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`tab-item flex items-center justify-center gap-1.5 ${activeTab === tab.key ? "active" : ""
                            }`}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="container mx-auto max-w-3xl px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Reports */}
                        {activeTab === "reports" && (
                            <div className="space-y-3">
                                {reports.length === 0 ? (
                                    <div className="empty-state card">
                                        <Flag className="h-10 w-10 text-muted opacity-30" />
                                        <p className="message">通報・紛争はありません</p>
                                    </div>
                                ) : (
                                    reports.map((report) => (
                                        <div key={report.id} className="card p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className={`badge ${report.status === "OPEN" ? "bg-danger/10 text-danger" :
                                                        report.status === "RESOLVED" ? "bg-success/10 text-success" :
                                                            "bg-muted/10 text-muted"
                                                    }`}>
                                                    {report.status === "OPEN" ? "未対応" : report.status === "RESOLVED" ? "解決済み" : report.status}
                                                </span>
                                                <span className="text-[10px] text-muted">
                                                    {new Date(report.created_at).toLocaleDateString("ja-JP")}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold">{report.reason}</p>
                                            {report.trade_id && (
                                                <Link
                                                    href={`/trade/${report.trade_id}`}
                                                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                                >
                                                    取引を確認 <ChevronRight className="h-3 w-3" />
                                                </Link>
                                            )}
                                            {report.status === "OPEN" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => resolveDispute(report.id, "対応済み")}
                                                        className="btn btn-primary text-xs px-3 py-1.5 gap-1"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        解決済みにする
                                                    </button>
                                                </div>
                                            )}
                                            {report.admin_note && (
                                                <p className="text-xs text-muted bg-background p-2 rounded-lg">
                                                    管理者メモ: {report.admin_note}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Catalog */}
                        {activeTab === "catalog" && (
                            <div className="space-y-3">
                                {pendingCatalog.length === 0 ? (
                                    <div className="empty-state card">
                                        <Package className="h-10 w-10 text-muted opacity-30" />
                                        <p className="message">承認待ちのカタログ申請はありません</p>
                                    </div>
                                ) : (
                                    pendingCatalog.map((item) => (
                                        <div key={item.id} className="card p-4 flex items-center gap-3">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-border bg-background shrink-0">
                                                {item.image_url && (
                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{item.name}</p>
                                                <p className="text-[10px] text-muted truncate">
                                                    {item.manufacturer} / {item.series}
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => approveItem(item.id)}
                                                    className="p-2 bg-success/10 text-success rounded-xl hover:bg-success/20 transition-colors"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => rejectItem(item.id)}
                                                    className="p-2 bg-danger/10 text-danger rounded-xl hover:bg-danger/20 transition-colors"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Users */}
                        {activeTab === "users" && (
                            <div className="space-y-3">
                                {users.map((u) => (
                                    <div key={u.id} className="card p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shrink-0">
                                            {(u.display_name || "?")[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">
                                                {u.display_name || "未設定"}
                                                {u.is_frozen && (
                                                    <span className="badge bg-danger/10 text-danger ml-2 text-[10px]">凍結中</span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-muted">
                                                取引{u.trade_count}回 / ★{u.rating_avg || 0}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleFreeze(u.id, !u.is_frozen)}
                                            className={`btn text-xs px-3 py-1.5 gap-1 ${u.is_frozen ? "btn-outline" : "bg-danger/10 text-danger hover:bg-danger/20"
                                                }`}
                                        >
                                            <UserX className="h-3.5 w-3.5" />
                                            {u.is_frozen ? "凍結解除" : "凍結する"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
