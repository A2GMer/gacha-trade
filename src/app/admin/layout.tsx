import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Shield, Users, AlertTriangle, ArrowRightLeft, LayoutDashboard, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect("/auth");
    }

    // roles are managed in profiles table
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        redirect("/"); // unauthorized
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col md:flex-row pb-20 md:pb-0">
            {/* Sidebar Desktop / Topbar Mobile */}
            <div className="w-full md:w-64 bg-background border-b md:border-b-0 md:border-r border-border shrink-0 flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2 text-danger font-bold">
                    <Shield className="h-5 w-5" />
                    <span>Admin Console</span>
                </div>
                <nav className="flex-1 p-2 space-y-1 overflow-x-auto md:overflow-y-auto flex md:block whitespace-nowrap">
                    <Link href="/admin" className="flex items-center gap-2 p-3 text-sm text-muted hover:bg-surface hover:text-foreground rounded-lg transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> 概要
                    </Link>
                    <Link href="/admin/disputes" className="flex items-center gap-2 p-3 text-sm text-danger hover:bg-danger/10 hover:text-danger rounded-lg transition-colors font-medium">
                        <AlertTriangle className="h-4 w-4" /> トラブル報告(紛争)
                    </Link>
                    <Link href="/admin/contacts" className="flex items-center gap-2 p-3 text-sm text-muted hover:bg-surface hover:text-foreground rounded-lg transition-colors">
                        <MessageSquare className="h-4 w-4" /> お問い合わせ
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-2 p-3 text-sm text-muted hover:bg-surface hover:text-foreground rounded-lg transition-colors">
                        <Users className="h-4 w-4" /> ユーザー管理
                    </Link>
                    <Link href="/admin/trades" className="flex items-center gap-2 p-3 text-sm text-muted hover:bg-surface hover:text-foreground rounded-lg transition-colors">
                        <ArrowRightLeft className="h-4 w-4" /> 取引監視
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-surface p-4 md:p-8 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
