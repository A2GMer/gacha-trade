"use client";

import Link from "next/link";
import { Star, ShieldCheck, ArrowRightLeft, Search, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ItemCard } from "@/components/items/ItemCard";

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

interface Manufacturer {
  manufacturer: string;
}

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const [itemsRes, mfgRes] = await Promise.all([
        supabase
          .from("user_items")
          .select(`
            id, images, condition, trade_status,
            catalog_items (name, series, manufacturer),
            profiles:owner_id (display_name, rating_avg, phone_verified)
          `)
          .eq("is_public", true)
          .neq("trade_status", "COMPLETED")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("catalog_items")
          .select("manufacturer")
          .eq("is_approved", true),
      ]);

      if (itemsRes.data) setItems(itemsRes.data as unknown as ItemWithProfile[]);
      if (mfgRes.data) {
        const unique = [...new Set((mfgRes.data as Manufacturer[]).map((m) => m.manufacturer))];
        setManufacturers(unique.slice(0, 10));
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://gacha-trade.com/#website",
        url: "https://gacha-trade.com",
        name: "ガチャトレード",
        description: "カプセルトイ（ガチャガチャ）の物々交換プラットフォーム",
        inLanguage: "ja",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://gacha-trade.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://gacha-trade.com/#organization",
        name: "ガチャトレード",
        url: "https://gacha-trade.com",
        logo: { "@type": "ImageObject", url: "https://gacha-trade.com/logo.webp" },
      },
    ],
  };

  return (
    <div className="bg-background min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== Hero Banner ===== */}
      <div className="gradient-hero text-white px-4 py-10 sm:py-16 relative overflow-hidden">
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-2 left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight animate-fade-in-up">
                ダブったガチャ、<br />
                <span className="text-white/90">交換しよう！</span>
              </h1>
              <p className="text-white/80 text-sm sm:text-base mb-8 animate-fade-in-up delay-1 leading-relaxed max-w-xl">
                カプセルトイの物々交換サービス。<br className="hidden sm:block md:hidden" />
                送料のみで欲しかったアイテムが手に入る 🎯
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 animate-fade-in-up delay-2">
                <Link
                  href="/search"
                  className="btn bg-white text-primary hover:bg-white/90 px-8 py-3.5 text-base font-bold shadow-xl border-none gap-2"
                >
                  <Search className="h-5 w-5" />
                  探す
                </Link>
                <Link
                  href="/sell"
                  className="btn bg-white/20 text-white hover:bg-white/30 px-8 py-3.5 text-base font-bold backdrop-blur-sm border border-white/20 gap-2"
                >
                  出品する
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

      {/* ===== Logged-in Dashboard Link ===== */}
      {user && (
        <div className="container mx-auto max-w-5xl px-4 -mt-5 relative z-20 animate-bounce-in delay-3">
          <Link
            href="/dashboard"
            className="card p-4 flex items-center gap-3 bg-surface border-2 border-primary/10 hover:border-primary/30 transition-all"
          >
            <div className="bg-primary text-white p-2.5 rounded-2xl">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">取引ダッシュボード</p>
              <p className="text-xs text-muted">交換の進行状況を確認する</p>
            </div>
            <span className="text-xs text-primary font-bold">確認する →</span>
          </Link>
        </div>
      )}

      {/* ===== Category Circles (Mercari-style) ===== */}
      {manufacturers.length > 0 && (
        <div className="container mx-auto max-w-5xl px-4 pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              メーカーから探す
            </h2>
            <Link href="/search" className="text-xs text-primary font-bold hover:underline">
              すべて見る →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {manufacturers.map((mfg) => (
              <Link
                key={mfg}
                href={`/search?manufacturer=${encodeURIComponent(mfg)}`}
                className="category-circle"
              >
                <div className="icon-wrap">
                  <span className="text-lg">🎰</span>
                </div>
                <span>{mfg}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== Item Grid (3 columns like Mercari) ===== */}
      <div className="container mx-auto max-w-5xl px-4 pt-6 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black">🆕 新着アイテム</h2>
          <Link href="/search" className="text-xs text-primary font-bold hover:underline">
            すべて見る →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state card py-16">
            <span className="text-4xl">🎰</span>
            <p className="message">まだアイテムがありません</p>
            <Link href="/sell" className="btn btn-primary px-6 py-3 inline-flex">
              最初のアイテムを出品する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {items.map((item, index) => (
              <div key={item.id} className={`animate-fade-in-up delay-${(index % 6) + 1}`}>
                <ItemCard
                  id={item.id}
                  image={item.images?.[0] || ""}
                  name={item.catalog_items?.name || "不明なアイテム"}
                  condition={item.condition}
                  tradeStatus={item.trade_status}
                  series={item.catalog_items?.series}
                  manufacturer={item.catalog_items?.manufacturer}
                  ownerName={item.profiles?.display_name}
                  ownerRating={item.profiles?.rating_avg}
                  ownerVerified={item.profiles?.phone_verified}
                  size="md"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== How It Works (for non-logged-in) ===== */}
      {!user && (
        <div className="gradient-hero-soft py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-lg font-black text-center mb-8">交換のながれ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { emoji: "🔍", title: "1. 探す", desc: "欲しいアイテムを検索して見つける" },
                { emoji: "🤝", title: "2. 提案する", desc: "自分のアイテムを選んで交換を提案" },
                { emoji: "📦", title: "3. 交換する", desc: "住所を入力して発送・受取で完了" },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`card p-6 text-center space-y-2 animate-fade-in-up delay-${i + 1}`}
                >
                  <p className="text-3xl">{step.emoji}</p>
                  <h3 className="font-black text-sm">{step.title}</h3>
                  <p className="text-xs text-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
