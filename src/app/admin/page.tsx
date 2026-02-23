"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Users, Package, MessageSquare, ExternalLink } from "lucide-react";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("disputes");

    const reports = [
        { id: "r1", type: "取引", target: "TR-9021", reason: "未発送（期限超過）", reporter: "さとう", time: "2時間前" },
        { id: "r2", type: "ユーザー", target: "たかはし", reason: "暴言・迷惑行為", reporter: "すずき", time: "5時間前" },
        { id: "r3", type: "アイテム", target: "ピカチュウフィギュア", reason: "偽造品の疑い", reporter: "たなか", time: "1日前" },
    ];

    const pendingCatalog = [
        { id: "c1", name: "リザードン", manufacturer: "ポケモン", series: "カプセル Vol.1", images: 1, note: "公式URLあり" },
    ];

    return (
        <div className="bg-background min-h-screen">
            {/* Admin Header */}
            <div className="bg-white p-6 border-b border-border shadow-sm">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-lg">
                            <ShieldAlert className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">運営管理パネル</h1>
                            <p className="text-xs text-muted">gachatore admin dashboard</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center px-4 border-r border-border">
                            <p className="text-[10px] text-muted font-bold uppercase">未処理の通報</p>
                            <p className="text-lg font-bold text-primary">12</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-[10px] text-muted font-bold uppercase">紛争中</p>
                            <p className="text-lg font-bold text-orange-500">3</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl py-8 px-4 flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 space-y-2">
                    {[
                        { id: "disputes", label: "通報・紛争処理", icon: AlertTriangle },
                        { id: "catalog", label: "カタログ追加申請", icon: Package },
                        { id: "users", label: "ユーザー制限・凍結", icon: Users },
                        { id: "logs", label: "システムログ", icon: MessageSquare },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === item.id ? "bg-primary text-white" : "bg-white text-muted hover:bg-border/20"
                                }`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    {activeTab === "disputes" && (
                        <div className="bg-white card overflow-hidden">
                            <div className="p-4 bg-background border-b border-border flex justify-between items-center">
                                <h2 className="font-bold text-sm">未処理の通報一覧</h2>
                                <span className="text-[10px] text-muted bg-white px-2 py-1 rounded border border-border">最新順</span>
                            </div>
                            <div className="divide-y divide-border">
                                {reports.map((r) => (
                                    <div key={r.id} className="p-6 flex items-start justify-between hover:bg-background/50 transition-colors">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.type === '取引' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {r.type}
                                                </span>
                                                <span className="text-sm font-bold">{r.target}</span>
                                                <span className="text-xs text-muted">{r.time}</span>
                                            </div>
                                            <p className="text-sm font-medium">{r.reason}</p>
                                            <div className="flex items-center gap-1 text-[10px] text-muted">
                                                <span>通報者: {r.reporter}</span>
                                                <ChevronRight className="h-3 w-3" />
                                                <span className="text-secondary hover:underline cursor-pointer flex items-center gap-0.5">
                                                    証拠画像を確認 <ExternalLink className="h-2 w-2" />
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-100 transition-colors" title="承認（ペナルティなし）">
                                                <CheckCircle className="h-5 w-5" />
                                            </button>
                                            <button className="p-2 text-primary hover:bg-primary/5 rounded-lg border border-primary/10 transition-colors" title="警告・制限">
                                                <AlertTriangle className="h-5 w-5" />
                                            </button>
                                            <button className="p-2 text-muted hover:bg-border/20 rounded-lg border border-border transition-colors" title="詳細を表示">
                                                <XCircle className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "catalog" && (
                        <div className="bg-white card p-6 text-center py-20 space-y-4">
                            <Package className="h-12 w-12 text-muted mx-auto" />
                            <div>
                                <h3 className="font-bold">申請中のカタログは1件です</h3>
                                <p className="text-sm text-muted">内容を確認してカタログに反映してください</p>
                            </div>
                            <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg text-sm">
                                申請を確認する
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
