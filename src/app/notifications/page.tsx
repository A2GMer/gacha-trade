"use client";

import { Bell, MessageSquare, ArrowRightLeft, Package, Heart, ChevronRight, Megaphone } from "lucide-react";

const NOTIFICATIONS = [
    {
        id: "1",
        type: "proposal",
        icon: ArrowRightLeft,
        iconBg: "bg-primary-light",
        iconColor: "text-primary",
        title: "新しい交換提案が届きました",
        body: "たなかさんが「ピカチュウ」と「リザードン」の交換を提案しています",
        time: "3分前",
        unread: true,
    },
    {
        id: "2",
        type: "message",
        icon: MessageSquare,
        iconBg: "bg-secondary-light",
        iconColor: "text-secondary",
        title: "新しいメッセージ",
        body: "さとうさん: 「発送しました！追跡番号は...」",
        time: "1時間前",
        unread: true,
    },
    {
        id: "3",
        type: "status",
        icon: Package,
        iconBg: "bg-accent-light",
        iconColor: "text-accent",
        title: "取引ステータスが更新されました",
        body: "TR-9021の取引が「発送済み」に変わりました",
        time: "3時間前",
        unread: false,
    },
    {
        id: "4",
        type: "want",
        icon: Heart,
        iconBg: "bg-primary-light",
        iconColor: "text-primary",
        title: "欲しいリストのアイテムが出品されました！",
        body: "「リザードン カプセルフィギュア Vol.1」が出品されました",
        time: "昨日",
        unread: false,
    },
    {
        id: "5",
        type: "system",
        icon: Megaphone,
        iconBg: "bg-background",
        iconColor: "text-muted",
        title: "お知らせ",
        body: "ガチャトレのメール通知設定が有効です。重要な更新をメールでもお届けします。",
        time: "2日前",
        unread: false,
    },
];

export default function NotificationsPage() {
    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface px-4 py-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-black flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        お知らせ
                    </h1>
                    <button className="text-xs text-primary font-bold hover:underline">
                        すべて既読にする
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-border">
                {NOTIFICATIONS.map((notif, i) => (
                    <div
                        key={notif.id}
                        className={`px-4 py-4 flex items-start gap-3 hover:bg-surface cursor-pointer transition-colors animate-fade-in-up delay-${i + 1} ${notif.unread ? "bg-primary-light/30" : ""
                            }`}
                    >
                        <div className={`p-2.5 rounded-2xl shrink-0 ${notif.iconBg}`}>
                            <notif.icon className={`h-5 w-5 ${notif.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className={`text-sm font-bold truncate ${notif.unread ? "text-foreground" : "text-muted"}`}>
                                    {notif.title}
                                </h3>
                                {notif.unread && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                            </div>
                            <p className="text-xs text-muted line-clamp-2 leading-relaxed">{notif.body}</p>
                            <p className="text-[10px] text-muted-light mt-1 font-medium">{notif.time}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-light shrink-0 mt-1" />
                    </div>
                ))}
            </div>

            {/* Email notification info */}
            <div className="mx-4 mt-6">
                <div className="card p-4 bg-accent-light border border-accent/20">
                    <p className="text-xs font-bold text-accent">📧 メール通知が有効です</p>
                    <p className="text-[10px] text-accent/70 mt-0.5">交換提案やメッセージをメールでもお知らせします</p>
                </div>
            </div>
        </div>
    );
}
