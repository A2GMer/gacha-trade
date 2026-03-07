"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { MessageSquare, RefreshCcw, CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface ContactMessage {
    id: string;
    name: string | null;
    email: string | null;
    message: string | null;
    status: string;
    created_at: string;
}

export default function AdminContactsPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchMessages = async () => {
        setLoading(true);
        // Supabase error handling missing contact_messages table was addressed previously in migrations
        const { data, error } = await supabase
            .from("contact_messages")
            .select(`*`)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch contact messages", error);
        } else if (data) {
            setMessages(data as ContactMessage[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isActive = true;
        supabase
            .from("contact_messages")
            .select(`*`)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!isActive) return;
                if (error) {
                    console.error("Failed to fetch contact messages", error);
                } else {
                    setMessages((data ?? []) as ContactMessage[]);
                }
                setLoading(false);
            });
        return () => {
            isActive = false;
        };
    }, [supabase]);

    const markAsResolved = async (id: string) => {
        await supabase.from("contact_messages").update({ status: "RESOLVED" }).eq("id", id);
        fetchMessages();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-primary" /> お問い合わせ一覧
                </h1>
                <button onClick={fetchMessages} className="btn bg-surface border border-border text-sm p-2 hover:bg-background">
                    <RefreshCcw className="h-4 w-4" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : messages.length === 0 ? (
                <div className="text-center p-10 text-muted">お問い合わせはありません</div>
            ) : (
                <div className="space-y-4">
                    {messages.map((m) => (
                        <div key={m.id} className={`card p-5 border-l-4 ${m.status === 'NEW' ? 'border-primary' : 'border-success'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`badge ${m.status === 'NEW' ? 'bg-primary text-white' : 'bg-success/10 text-success'} text-xs font-bold`}>
                                        {m.status === 'NEW' ? '未対応' : '対応済み'}
                                    </span>
                                    <span className="text-xs text-muted ml-2">{formatTime(m.created_at)}</span>
                                </div>
                                {m.status === 'NEW' && (
                                    <button onClick={() => markAsResolved(m.id)} className="btn text-xs py-1.5 bg-success text-white">
                                        <CheckCircle className="h-3 w-3 mr-1" /> 対応済みにする
                                    </button>
                                )}
                            </div>

                            <p className="text-sm font-bold mt-3">名前: {m.name} | Email: {m.email}</p>
                            <div className="bg-surface p-3 mt-3 rounded-lg text-sm border border-border whitespace-pre-wrap">
                                {m.message}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
