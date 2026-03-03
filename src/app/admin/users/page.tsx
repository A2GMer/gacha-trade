"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Users, RefreshCcw, ShieldAlert, Star } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("profiles")
            .select(`*`)
            .order("created_at", { ascending: false })
            .limit(100); // 簡略化のため最新100件

        if (data) setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleAdminRole = async (userId: string, currentRole: string) => {
        if (!confirm(`本当にこのユーザーの権限を「${currentRole === 'admin' ? '一般' : '管理者'}」に変更しますか？`)) return;

        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
        fetchUsers();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Users className="text-primary" /> ユーザー管理 (最新100件)
                </h1>
                <button onClick={fetchUsers} className="btn bg-surface border border-border text-sm p-2 hover:bg-background">
                    <RefreshCcw className="h-4 w-4" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : users.length === 0 ? (
                <div className="text-center p-10 text-muted">ユーザーが見つかりません</div>
            ) : (
                <div className="bg-background rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface border-b border-border">
                            <tr>
                                <th className="p-3 font-bold text-muted">ID / 名前</th>
                                <th className="p-3 font-bold text-muted">Email</th>
                                <th className="p-3 font-bold text-muted">評価</th>
                                <th className="p-3 font-bold text-muted">登録日時</th>
                                <th className="p-3 font-bold text-muted">権限</th>
                                <th className="p-3 font-bold text-muted text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                                    <td className="p-3">
                                        <p className="font-bold">{u.display_name || "無名"}</p>
                                        <p className="text-[10px] text-muted font-mono truncate w-24">{u.id}</p>
                                    </td>
                                    <td className="p-3">{u.email || "-"}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3 w-3 text-accent fill-accent" />
                                            <span>{u.rating_avg ? u.rating_avg.toFixed(1) : "-"}</span>
                                            <span className="text-[10px] text-muted">({u.rating_count}件)</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-xs text-muted">{formatTime(u.created_at)}</td>
                                    <td className="p-3">
                                        <span className={`badge text-[10px] ${u.role === 'admin' ? 'bg-danger/10 text-danger' : 'bg-surface border border-border text-muted'}`}>
                                            {u.role === 'admin' ? '管理者' : '一般'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <button
                                            onClick={() => toggleAdminRole(u.id, u.role)}
                                            className="btn text-[10px] py-1.5 px-3 bg-surface border border-border hover:bg-background"
                                        >
                                            <ShieldAlert className="h-3 w-3 mr-1 inline-block" /> 権限変更
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
