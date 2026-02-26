"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface DeadlineCountdownProps {
    status: string;
    acceptedAt?: string; // ACCEPTED or ADDRESS_PENDING時の基準時刻
    addressLockedAt?: string; // 住所確定時刻
    shippedAt?: string; // 発送時刻
    onExpired?: () => void;
}

// 仕様書 §8: 住所入力48h / 発送5日 / 受取3日
const DEADLINES = {
    ADDRESS: 48 * 60 * 60 * 1000, // 48時間
    SHIPMENT: 5 * 24 * 60 * 60 * 1000, // 5日
    RECEIPT: 3 * 24 * 60 * 60 * 1000, // 3日
};

function getDeadlineInfo(status: string, acceptedAt?: string, addressLockedAt?: string, shippedAt?: string) {
    const now = Date.now();

    if ((status === "ACCEPTED" || status === "ADDRESS_PENDING") && acceptedAt) {
        const deadline = new Date(acceptedAt).getTime() + DEADLINES.ADDRESS;
        const remaining = deadline - now;
        return { label: "住所入力期限", remaining, total: DEADLINES.ADDRESS };
    }

    if ((status === "ADDRESS_LOCKED" || status === "SHIPMENT_PENDING") && addressLockedAt) {
        const deadline = new Date(addressLockedAt).getTime() + DEADLINES.SHIPMENT;
        const remaining = deadline - now;
        return { label: "発送期限", remaining, total: DEADLINES.SHIPMENT };
    }

    if ((status === "SHIPPED") && shippedAt) {
        const deadline = new Date(shippedAt).getTime() + DEADLINES.RECEIPT;
        const remaining = deadline - now;
        return { label: "受取確認期限", remaining, total: DEADLINES.RECEIPT };
    }

    return null;
}

function formatRemaining(ms: number): string {
    if (ms <= 0) return "期限超過";

    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `残り ${days}日 ${hours}時間`;
    if (hours > 0) return `残り ${hours}時間 ${minutes}分`;
    return `残り ${minutes}分`;
}

export function DeadlineCountdown({ status, acceptedAt, addressLockedAt, shippedAt, onExpired }: DeadlineCountdownProps) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60 * 1000); // 1分ごとに更新
        return () => clearInterval(timer);
    }, []);

    const info = getDeadlineInfo(status, acceptedAt, addressLockedAt, shippedAt);
    if (!info) return null;

    const isExpired = info.remaining <= 0;
    const isUrgent = info.remaining > 0 && info.remaining < 6 * 60 * 60 * 1000; // 6時間未満
    const progressPct = Math.max(0, Math.min(100, ((info.total - info.remaining) / info.total) * 100));

    if (isExpired && onExpired) onExpired();

    return (
        <div className={`rounded-2xl p-3 ${isExpired ? "bg-danger/10 border border-danger/20" : isUrgent ? "bg-warning/10 border border-warning/20" : "bg-primary-light border border-primary/10"}`}>
            <div className="flex items-center gap-2 mb-1.5">
                {isExpired ? (
                    <AlertTriangle className="h-4 w-4 text-danger" />
                ) : (
                    <Clock className={`h-4 w-4 ${isUrgent ? "text-warning" : "text-primary"}`} />
                )}
                <span className={`text-xs font-bold ${isExpired ? "text-danger" : isUrgent ? "text-warning" : "text-primary"}`}>
                    {info.label}
                </span>
                <span className={`text-xs font-bold ml-auto ${isExpired ? "text-danger" : isUrgent ? "text-warning" : "text-foreground"}`}>
                    {formatRemaining(info.remaining)}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${isExpired ? "bg-danger" : isUrgent ? "bg-warning" : "bg-primary"}`}
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {isExpired && (
                <p className="text-[10px] text-danger mt-1.5 font-bold">
                    ⚠️ 期限を超過しました。紛争を提起できます。
                </p>
            )}
        </div>
    );
}
