import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function AdminDashboardPage() {
    const supabase = await createServerSupabaseClient();

    // 簡易的な統計情報を取得
    const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: tradeCount } = await supabase.from("trades").select("*", { count: "exact", head: true });
    const { count: disputeCount } = await supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "OPEN");

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold">ダッシュボード概要</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5 border-l-4 border-primary">
                    <p className="text-sm text-muted">総ユーザー数</p>
                    <p className="text-2xl font-bold mt-1">{userCount || 0}</p>
                </div>
                <div className="card p-5 border-l-4 border-accent">
                    <p className="text-sm text-muted">累計取引数</p>
                    <p className="text-2xl font-bold mt-1">{tradeCount || 0}</p>
                </div>
                <div className="card p-5 border-l-4 border-danger">
                    <p className="text-sm text-muted text-danger font-bold">未解決の紛争</p>
                    <p className="text-2xl font-bold mt-1 text-danger">{disputeCount || 0}</p>
                </div>
            </div>

            <div className="card p-5 mt-6 border-border">
                <h2 className="font-bold text-sm mb-4">運営ガイド・お知らせ</h2>
                <ul className="space-y-2 text-sm text-muted">
                    <li>・未解決の紛争（トラブル）がある場合は、優先的に対応してください。</li>
                    <li>・Stripeのデポジット没収/返還操作は、一度行うと取り消しできません。慎重に行ってください。</li>
                    <li>・特定ユーザーの通報が続く場合は、ユーザー管理から利用停止(BAN)措置を検討してください。</li>
                </ul>
            </div>
        </div>
    );
}
