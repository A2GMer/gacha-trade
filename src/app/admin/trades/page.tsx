"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ArrowRightLeft, RefreshCcw, ExternalLink } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Link from "next/link";

interface TradeUserRef {
    display_name: string | null;
}

interface AdminTrade {
    id: string;
    updated_at: string;
    status: string;
    proposer_shipped: boolean;
    receiver_shipped: boolean;
    proposer: TradeUserRef | null;
    receiver: TradeUserRef | null;
}

export default function AdminTradesPage() {
    const [trades, setTrades] = useState<AdminTrade[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchTrades = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("trades")
            .select(`
                *,
                proposer:proposer_id (display_name),
                receiver:receiver_id (display_name)
            `)
            .order("updated_at", { ascending: false })
            .limit(100);

        if (data) setTrades(data as AdminTrade[]);
        setLoading(false);
    };

    useEffect(() => {
        let isActive = true;
        supabase
            .from("trades")
            .select(`
                *,
                proposer:proposer_id (display_name),
                receiver:receiver_id (display_name)
            `)
            .order("updated_at", { ascending: false })
            .limit(100)
            .then(({ data }) => {
                if (!isActive) return;
                setTrades((data ?? []) as AdminTrade[]);
                setLoading(false);
            });
        return () => {
            isActive = false;
        };
    }, [supabase]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-success/10 text-success';
            case 'CANCELLED': return 'bg-surface border border-border text-muted';
            case 'DISPUTE': return 'bg-danger/10 text-danger';
            default: return 'bg-primary/10 text-primary';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <ArrowRightLeft className="text-primary" /> 取引監視 (最新100件)
                </h1>
                <button onClick={fetchTrades} className="btn bg-surface border border-border text-sm p-2 hover:bg-background">
                    <RefreshCcw className="h-4 w-4" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : trades.length === 0 ? (
                <div className="text-center p-10 text-muted">取引データがありません</div>
            ) : (
                <div className="bg-background rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface border-b border-border">
                            <tr>
                                <th className="p-3 font-bold text-muted">ID / 更新日時</th>
                                <th className="p-3 font-bold text-muted">ステータス</th>
                                <th className="p-3 font-bold text-muted">提案者</th>
                                <th className="p-3 font-bold text-muted">受取人</th>
                                <th className="p-3 font-bold text-muted text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {trades.map((t) => (
                                <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                                    <td className="p-3">
                                        <p className="text-[10px] font-mono text-muted truncate w-24" title={t.id}>{t.id}</p>
                                        <p className="text-xs">{formatTime(t.updated_at)}</p>
                                    </td>
                                    <td className="p-3">
                                        <span className={`badge text-[10px] font-bold ${getStatusColor(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs">
                                        {t.proposer?.display_name || '不明'} {t.proposer_shipped && '📦'}
                                    </td>
                                    <td className="p-3 text-xs">
                                        {t.receiver?.display_name || '不明'} {t.receiver_shipped && '📦'}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Link href={`/trade/${t.id}`} target="_blank" className="btn text-[10px] py-1.5 px-3 bg-surface border border-border hover:bg-background inline-flex">
                                            確認 <ExternalLink className="h-3 w-3 ml-1" />
                                        </Link>
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
