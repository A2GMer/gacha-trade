"use client";

import Link from "next/link";
import { Star, ShieldCheck, Heart, Eye } from "lucide-react";
import { shareOnX } from "@/lib/share";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface ItemWithProfile {
  id: string;
  images: string[];
  condition: string;
  trade_status?: string;
  catalog_items: {
    name: string;
    series: string;
    manufacturer: string;
  };
  profiles: {
    display_name: string;
    rating_avg: number;
    phone_verified: boolean;
  };
}

export default function Home() {
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from("user_items")
        .select(`
          id,
          images,
          condition,
          trade_status,
          catalog_items (name, series, manufacturer),
          profiles:owner_id (display_name, rating_avg, phone_verified)
        `)
        .eq("is_public", true)
        .neq("trade_status", "COMPLETED")
        .order("created_at", { ascending: false })
        .limit(15);

      if (data && !error) {
        setItems(data as unknown as ItemWithProfile[]);
      }
      setLoading(false);
    }
    fetchItems();
  }, [supabase]);

  return (
    <div className="bg-background min-h-screen">
      {/* ===== Hero Banner ===== */}
      <div className="gradient-hero text-white px-4 py-10 sm:py-16 relative overflow-hidden">
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-2 left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight animate-fade-in-up">
                ダブったガチャ、<br />
                <span className="text-white/90">Xでシェアして交換しよう！</span>
              </h1>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-8 animate-fade-in-up delay-1 leading-relaxed max-w-xl">
                カプセルトイの物々交換サービス。<br className="hidden sm:block md:hidden" />
                送料のみで欲しかったアイテムが手に入る 🎯
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 animate-fade-in-up delay-2">
                <Link href="/sell" className="btn bg-white text-primary hover:bg-white/90 px-8 py-3.5 text-base font-bold shadow-xl border-none">
                  出品する
                </Link>
                <Link href="/search" className="btn bg-white/20 text-white hover:bg-white/30 px-8 py-3.5 text-base font-bold backdrop-blur-sm border border-white/20">
                  検索する
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full max-w-md md:max-w-none animate-fade-in-up delay-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
                <img
                  src="/hero-illustration.webp"
                  alt="ガチャガチャ交換"
                  className="relative z-10 w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-float"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== X Share Incentive Banner ===== */}
      <div className="bg-surface mx-4 sm:mx-auto max-w-2xl -mt-6 relative z-20 rounded-[20px] shadow-lg p-5 border border-border animate-bounce-in delay-3">
        <div className="flex items-center gap-4">
          <div className="bg-x-black text-white p-3 rounded-2xl shrink-0">
            <XLogo className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-0.5">🎰 Xで拡散して交換率UP！</p>
            <p className="text-xs text-muted">
              アイテムをXでシェアすると、交換相手が見つかる確率が<span className="text-primary font-bold">3倍</span>に！
            </p>
          </div>
        </div>
      </div>

      {/* ===== Item Grid ===== */}
      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">🆕 新着アイテム</h2>
          <Link href="/search" className="text-xs text-primary font-bold hover:underline">
            すべて見る →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-4xl">🎰</p>
            <p className="text-muted font-bold">まだアイテムがありません</p>
            <Link href="/sell" className="btn btn-primary px-6 py-3 inline-flex">
              最初のアイテムを出品する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {items.map((item, index) => (
              <div key={item.id} className={`animate-fade-in-up delay-${index + 1}`}>
                <div className="card group">
                  <Link href={`/item/${item.id}`}>
                    <div className="relative aspect-square">
                      <img
                        src={item.images?.[0] || "/placeholder.png"}
                        alt={item.catalog_items?.name || "アイテム"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.trade_status === "TRADING" && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
                          <span className="bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">取引中</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 z-20">
                        <span className={`badge ${item.condition === "未開封" ? "bg-accent text-white" :
                          item.condition === "開封済" ? "bg-foreground/70 text-white" :
                            "bg-warning text-white"
                          }`}>
                          {item.condition}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-3 space-y-2">
                    <Link href={`/item/${item.id}`}>
                      <h3 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {item.catalog_items?.name || "不明なアイテム"}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-muted">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-foreground">{item.profiles?.rating_avg || 0}</span>
                        {item.profiles?.phone_verified && (
                          <ShieldCheck className="h-3 w-3 text-accent" />
                        )}
                        <span className="ml-0.5">{item.profiles?.display_name || "ユーザー"}</span>
                      </div>
                      <button
                        className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-x-black bg-background hover:bg-foreground/5 px-2 py-1 rounded-full transition-colors"
                        onClick={() =>
                          shareOnX({
                            itemName: item.catalog_items?.name || "",
                            condition: item.condition,
                            series: item.catalog_items?.series,
                            manufacturer: item.catalog_items?.manufacturer,
                            itemId: item.id,
                          })
                        }
                      >
                        <XLogo className="h-3 w-3" />
                        共有
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
