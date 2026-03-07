"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRightLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ItemCard } from "@/components/items/ItemCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { getProfileDisplayName, DisplayNameProfile } from "@/lib/profile";

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
    x_username: string | null;
    display_name_source: "manual" | "twitter";
  };
}

interface ListingCatalogRow {
  catalog_item_id: string;
  images: string[];
}

interface CatalogItemRow {
  id: string;
  name: string;
  manufacturer: string;
  series: string;
  image_url: string | null;
}

interface WantCatalogRow {
  catalog_item_id: string;
}

interface PopularCatalogItem {
  id: string;
  name: string;
  manufacturer: string;
  series: string;
  image_url: string | null;
  listingCount: number;
  wantCount: number;
  score: number;
}

interface OfficialCatalogItem {
  id: string;
  name: string;
  manufacturer: string;
  series: string;
  image_url: string;
}

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  const [featuredCatalogItems, setFeaturedCatalogItems] = useState<PopularCatalogItem[]>([]);
  const [activeCatalogItems, setActiveCatalogItems] = useState<PopularCatalogItem[]>([]);
  const [officialCatalogItems, setOfficialCatalogItems] = useState<OfficialCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const [itemsRes, catalogRes, listingRes, wantsRes] = await Promise.all([
        supabase
          .from("user_items")
          .select(`
            id, images, condition, trade_status,
            catalog_items (name, series, manufacturer),
            profiles:owner_id (display_name, rating_avg, phone_verified, x_username, display_name_source)
          `)
          .eq("is_public", true)
          .neq("trade_status", "COMPLETED")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("catalog_items")
          .select("id, name, manufacturer, series, image_url")
          .eq("is_approved", true)
          .limit(1000),
        supabase
          .from("user_items")
          .select("catalog_item_id, images")
          .eq("is_public", true)
          .neq("trade_status", "COMPLETED")
          .limit(2000),
        supabase
          .from("wants")
          .select("catalog_item_id")
          .limit(5000),
      ]);

      if (itemsRes.data) {
        setItems(itemsRes.data as unknown as ItemWithProfile[]);
      }

      const listingCountMap = new Map<string, number>();
      const listingImageMap = new Map<string, string>();

      if (listingRes.data) {
        for (const row of listingRes.data as ListingCatalogRow[]) {
          if (!row.catalog_item_id) {
            continue;
          }

          listingCountMap.set(row.catalog_item_id, (listingCountMap.get(row.catalog_item_id) || 0) + 1);

          if (!listingImageMap.has(row.catalog_item_id) && row.images?.[0]) {
            listingImageMap.set(row.catalog_item_id, row.images[0]);
          }
        }
      }

      const wantCountMap = new Map<string, number>();

      if (wantsRes.data) {
        for (const row of wantsRes.data as WantCatalogRow[]) {
          if (!row.catalog_item_id) {
            continue;
          }

          wantCountMap.set(row.catalog_item_id, (wantCountMap.get(row.catalog_item_id) || 0) + 1);
        }
      }

      if (catalogRes.data) {
        const catalogRows = catalogRes.data as CatalogItemRow[];

        setOfficialCatalogItems(
          catalogRows
            .filter((catalog) => Boolean(catalog.image_url))
            .sort((a, b) => a.name.localeCompare(b.name, "ja"))
            .slice(0, 12)
            .map((catalog) => ({
              id: catalog.id,
              name: catalog.name,
              manufacturer: catalog.manufacturer,
              series: catalog.series,
              image_url: catalog.image_url as string,
            }))
        );

        const ranked = catalogRows
          .map((catalog) => {
            const listingCount = listingCountMap.get(catalog.id) || 0;
            const wantCount = wantCountMap.get(catalog.id) || 0;
            const imageUrl = catalog.image_url || listingImageMap.get(catalog.id) || null;

            if (!imageUrl) {
              return null;
            }

            return {
              id: catalog.id,
              name: catalog.name,
              manufacturer: catalog.manufacturer,
              series: catalog.series,
              image_url: imageUrl,
              listingCount,
              wantCount,
              score: listingCount * 3 + wantCount * 2,
            } as PopularCatalogItem;
          })
          .filter((catalog): catalog is PopularCatalogItem => catalog !== null && catalog.score > 0)
          .sort(
            (a, b) =>
              b.score - a.score ||
              b.listingCount - a.listingCount ||
              b.wantCount - a.wantCount ||
              a.name.localeCompare(b.name, "ja")
          );

        setFeaturedCatalogItems(ranked.slice(0, 12));
        setActiveCatalogItems(ranked.filter((catalog) => catalog.listingCount > 0).slice(0, 12));
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);


  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://swacole.com/#website",
        url: "https://swacole.com",
        name: "ガチャトレ",
        description: "カプセルトイ（ガチャ）の交換サービス",
        inLanguage: "ja",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://swacole.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://swacole.com/#organization",
        name: "ガチャトレ",
        url: "https://swacole.com",
        logo: { "@type": "ImageObject", url: "https://swacole.com/logo.svg" },
      },
    ],
  };

  return (
    <div className="bg-background min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <HeroCarousel />

      {user && (
        <div className="container mx-auto max-w-5xl px-4 -mt-4 relative z-20">
          <Link href="/dashboard" className="card p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="bg-primary text-white p-2 rounded-lg">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">ダッシュボードへ</p>
              <p className="text-xs text-muted">進行中の交換や通知を確認できます</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        </div>
      )}

      {featuredCatalogItems.length > 0 && (
        <div className="container mx-auto max-w-5xl px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold">人気カタログ</h2>
              <p className="text-[11px] text-muted">欲しい登録と出品数から表示しています</p>
            </div>
            <Link href="/search" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              すべて見る <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {featuredCatalogItems.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/search?catalogItemId=${encodeURIComponent(catalog.id)}`}
                className="card group overflow-hidden"
              >
                <div className="relative aspect-square bg-background">
                  <Image
                    src={catalog.image_url || "/logo.svg"}
                    alt={`${catalog.name} 公式画像`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-1.5 left-1.5 badge bg-primary text-white text-[10px]">
                    出品{catalog.listingCount}
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-bold line-clamp-2 leading-snug">{catalog.name}</p>
                  <p className="text-[10px] text-muted mt-1">欲しい {catalog.wantCount}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeCatalogItems.length > 0 && (
        <div className="container mx-auto max-w-5xl px-4 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold">出品中の人気カタログ</h2>
              <p className="text-[11px] text-muted">いま交換できるアイテム</p>
            </div>
            <Link href="/search" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              すべて見る <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {activeCatalogItems.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/search?catalogItemId=${encodeURIComponent(catalog.id)}`}
                className="card group overflow-hidden"
              >
                <div className="relative aspect-square bg-background">
                  <Image
                    src={catalog.image_url || "/logo.svg"}
                    alt={`${catalog.name} 公式画像`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-1.5 left-1.5 badge bg-primary text-white text-[10px]">
                    {catalog.listingCount}件
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-bold line-clamp-2 leading-snug">{catalog.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-5xl px-4 pt-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">新着出品</h2>
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
            <p className="text-2xl">📦</p>
            <p className="message">まだ出品がありません</p>
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
                  ownerName={getProfileDisplayName(item.profiles as DisplayNameProfile, "ユーザー")}
                  ownerRating={item.profiles?.rating_avg}
                  ownerVerified={item.profiles?.phone_verified}
                  size="md"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {officialCatalogItems.length > 0 && (
        <div className="container mx-auto max-w-5xl px-4 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">{"\u516c\u5f0f\u30ab\u30bf\u30ed\u30b0"}</h2>
            <Link href="/search" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              {"\u3059\u3079\u3066\u898b\u308b"} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {officialCatalogItems.map((catalog) => (
              <Link key={catalog.id} href={`/search?catalogItemId=${encodeURIComponent(catalog.id)}`} className="block group">
                <div className="card">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={catalog.image_url}
                      alt={`${catalog.name} official image`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                    <div className="absolute top-2 left-2 z-20">
                      <span className="badge bg-foreground/70 text-white">{"\u516c\u5f0f"}</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <h3 className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {catalog.name}
                    </h3>
                    <p className="text-[10px] text-muted truncate">
                      {catalog.manufacturer} / {catalog.series}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-white py-10 px-4 border-t border-border">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-base font-bold text-center mb-2">使い方はかんたん</h2>
            <p className="text-xs text-muted text-center mb-8">ガチャを選んで、出品を見て、交渉するだけです。</p>

            <div className="space-y-4">
              <div className="card p-4">
                <p className="text-xs font-bold">1. 公式画像からアイテムを選択</p>
                <p className="text-xs text-muted mt-1">検索画面で公式カタログ画像を見ながら選べます。</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-bold">2. 欲しい出品をチェック</p>
                <p className="text-xs text-muted mt-1">一覧にはユーザーの実物写真が表示されます。</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-bold">3. 交渉して交換成立</p>
                <p className="text-xs text-muted mt-1">条件が合えばそのまま交換へ進めます。</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/login?tab=register" className="btn btn-primary px-8 py-3 text-sm font-semibold">
                無料で始める
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
