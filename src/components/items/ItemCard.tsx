"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShieldCheck } from "lucide-react";

interface ItemCardProps {
    id: string;
    image: string;
    name: string;
    condition: string;
    tradeStatus?: string;
    series?: string;
    manufacturer?: string;
    ownerName?: string;
    ownerRating?: number;
    ownerVerified?: boolean;
    showOwner?: boolean;
    size?: "sm" | "md";
}

export function ItemCard({
    id,
    image,
    name,
    condition,
    tradeStatus,
    series,
    manufacturer,
    ownerName,
    ownerRating,
    ownerVerified,
    showOwner = true,
    size = "md",
}: ItemCardProps) {
    const conditionStyle =
        condition === "未開封"
            ? "bg-accent text-white"
            : condition === "傷あり"
                ? "bg-warning text-white"
                : "bg-foreground/70 text-white";

    return (
        <Link href={`/item/${id}`} className="block group">
            <div className="card">
                <div className="relative aspect-square overflow-hidden">
                    <Image
                        src={image || "/placeholder.png"}
                        alt={`${name} - ${series || ""} ${condition}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                    {tradeStatus === "TRADING" && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
                            <span className="bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                                取引中
                            </span>
                        </div>
                    )}
                    <div className="absolute top-2 left-2 z-20">
                        <span className={`badge ${conditionStyle}`}>{condition}</span>
                    </div>
                </div>

                {size === "md" && (
                    <div className="p-3 space-y-1.5">
                        <h3 className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {name}
                        </h3>
                        {manufacturer && (
                            <p className="text-[10px] text-muted truncate">
                                {manufacturer} / {series}
                            </p>
                        )}
                        {showOwner && ownerName && (
                            <div className="flex items-center gap-1 text-[10px] text-muted">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-foreground">
                                    {ownerRating || 0}
                                </span>
                                {ownerVerified && (
                                    <ShieldCheck className="h-3 w-3 text-accent" />
                                )}
                                <span className="ml-0.5 truncate">{ownerName}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
