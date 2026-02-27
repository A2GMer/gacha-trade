"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRightLeft, Search, ChevronRight } from "lucide-react";
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

      {/* ===== Hero Banner (compact) ===== */}
      <div className="bg-primary text-white px-4 py-6 sm:py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
                ダブったガチャ、交換しよう！
              </h1>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                カプセルトイの物々交換サービス。送料のみで欲しかったアイテムが手に入る。
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <Link
                  href="/search"
                  className="btn bg-white text-primary hover:bg-white/90 px-6 py-2.5 text-sm font-semibold gap-1.5"
                >
                  <Search className="h-4 w-4" />
                  探す
                </Link>
                <Link
                  href="/sell"
                  className="btn bg-white/15 text-white hover:bg-white/25 px-6 py-2.5 text-sm font-semibold border border-white/20 gap-1.5"
                >
                  出品する
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Logged-in Dashboard Link ===== */}
      {user && (
        <div className="container mx-auto max-w-5xl px-4 -mt-4 relative z-20">
          <Link
            href="/dashboard"
            className="card p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="bg-primary text-white p-2 rounded-lg">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">取引ダッシュボード</p>
              <p className="text-xs text-muted">交換の進行状況を確認する</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        </div>
      )}

      {/* ===== Category (Manufacturer) ===== */}
      {manufacturers.length > 0 && (
        <div className="container mx-auto max-w-5xl px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">メーカーから探す</h2>
            <Link href="/search" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              すべて見る <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {manufacturers.map((mfg) => (
              <Link
                key={mfg}
                href={`/search?manufacturer=${encodeURIComponent(mfg)}`}
                className="category-circle"
              >
                <div className="icon-wrap">
                  <span className="text-base">🎰</span>
                </div>
                <span>{mfg}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== Item Grid ===== */}
      <div className="container mx-auto max-w-5xl px-4 pt-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">新着アイテム</h2>
          <Link href="/search" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
            すべて見る <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state card py-12">
            <p className="text-2xl">🎰</p>
            <p className="message">まだアイテムがありません</p>
            <Link href="/sell" className="btn btn-primary px-5 py-2.5 text-sm inline-flex">
              最初のアイテムを出品する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {items.map((item) => (
              <div key={item.id}>
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

      {/* ===== How It Works (non-logged-in only) ===== */}
      {!user && (
        <div className="bg-background py-8 px-4 border-t border-border">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-sm font-bold text-center mb-6">交換のながれ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <Search className="h-5 w-5 text-primary" />, title: "1. 探す", desc: "欲しいアイテムを検索して見つける" },
                { icon: <ArrowRightLeft className="h-5 w-5 text-primary" />, title: "2. 提案する", desc: "自分のアイテムを選んで交換を提案" },
                { icon: <ShieldCheck className="h-5 w-5 text-primary" />, title: "3. 交換する", desc: "住所を入力して発送・受取で完了" },
              ].map((step, i) => (
                <div
                  key={i}
                  className="card p-5 text-center space-y-2"
                >
                  <div className="w-10 h-10 mx-auto bg-primary-light rounded-lg flex items-center justify-center">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{step.title}</h3>
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
