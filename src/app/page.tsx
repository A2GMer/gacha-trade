"use client";

import Link from "next/link";
import { Star, ShieldCheck, Heart, Eye, Share2 } from "lucide-react";
import { shareOnX } from "@/lib/share";

const DUMMY_ITEMS = [
  {
    id: "1",
    name: "ピカチュウ (カプセルフィギュア Vol.1)",
    condition: "未開封",
    series: "カプセルフィギュア Vol.1",
    manufacturer: "ポケモン",
    imageUrl: "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=400&h=400&fit=crop",
    user: { name: "たなか", rating: 4.8, smsVerified: true },
    watchCount: 14,
    liked: false,
  },
  {
    id: "2",
    name: "ちいかわ サッカーボール",
    condition: "開封済",
    series: "ちいかわスポーツ",
    manufacturer: "ナガノ",
    imageUrl: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop",
    user: { name: "さとう", rating: 4.5, smsVerified: true },
    watchCount: 8,
    liked: true,
  },
  {
    id: "3",
    name: "機動戦士ガンダム モビルスーツアンサンブル",
    condition: "傷あり",
    series: "MSアンサンブル",
    manufacturer: "バンダイ",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=400&fit=crop",
    user: { name: "すずき", rating: 4.9, smsVerified: true },
    watchCount: 23,
    liked: false,
  },
  {
    id: "4",
    name: "すみっコぐらし ふにふにマスコット",
    condition: "未開封",
    series: "ふにふにマスコット",
    manufacturer: "サンエックス",
    imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop",
    user: { name: "たかはし", rating: 4.2, smsVerified: false },
    watchCount: 5,
    liked: false,
  },
  {
    id: "5",
    name: "ワンピース カプセルフィギュア ルフィ",
    condition: "未開封",
    series: "ワンピースカプセル",
    manufacturer: "バンダイ",
    imageUrl: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc19?w=400&h=400&fit=crop",
    user: { name: "やまだ", rating: 4.7, smsVerified: true },
    watchCount: 31,
    liked: false,
  },
  {
    id: "6",
    name: "ポケモン テラスタル フィギュア",
    condition: "開封済",
    series: "テラスタルコレクション",
    manufacturer: "ポケモン",
    imageUrl: "https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=400&h=400&fit=crop",
    user: { name: "いとう", rating: 5.0, smsVerified: true },
    watchCount: 19,
    liked: true,
  },
];

// X logo SVG component
function XLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      {/* ===== Hero Banner ===== */}
      <div className="gradient-hero text-white px-4 py-10 sm:py-16 relative overflow-hidden">
        {/* Decorative capsule shapes */}
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-2 left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="container mx-auto max-w-2xl text-center relative z-10">
          <h1 className="text-2xl sm:text-4xl font-black mb-3 leading-tight animate-fade-in-up">
            ダブったガチャ、<br />
            <span className="text-white/90">Xでシェアして交換しよう！</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base mb-6 animate-fade-in-up delay-1">
            カプセルトイの物々交換サービス。<br className="sm:hidden" />
            送料のみで欲しかったアイテムが手に入る 🎯
          </p>
          <div className="flex justify-center gap-3 animate-fade-in-up delay-2">
            <button className="btn btn-x text-base px-6 py-3 gap-2">
              <XLogo className="h-5 w-5" />
              Xでシェアして始める
            </button>
            <Link href="/sell" className="btn bg-white/20 text-white hover:bg-white/30 px-6 py-3 text-base backdrop-blur-sm border border-white/20">
              出品する
            </Link>
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
          <button className="btn btn-x shrink-0 text-xs px-4 py-2">
            <XLogo className="h-3.5 w-3.5" />
            シェア
          </button>
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

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {DUMMY_ITEMS.map((item, index) => (
            <div key={item.id} className={`animate-fade-in-up delay-${index + 1}`}>
              <div className="card group">
                <Link href={`/item/${item.id}`}>
                  <div className="relative aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Condition badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`badge ${item.condition === "未開封" ? "bg-accent text-white" :
                          item.condition === "開封済" ? "bg-foreground/70 text-white" :
                            "bg-warning text-white"
                        }`}>
                        {item.condition}
                      </span>
                    </div>
                    {/* Like button */}
                    <button
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className={`h-4 w-4 ${item.liked ? "fill-primary text-primary" : "text-muted"}`} />
                    </button>
                    {/* Watch count */}
                    <div className="absolute bottom-2 right-2 badge bg-black/50 text-white backdrop-blur-sm">
                      <Eye className="h-3 w-3" />
                      {item.watchCount}
                    </div>
                  </div>
                </Link>

                <div className="p-3 space-y-2">
                  <Link href={`/item/${item.id}`}>
                    <h3 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-muted">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-foreground">{item.user.rating}</span>
                      {item.user.smsVerified && (
                        <ShieldCheck className="h-3 w-3 text-accent" />
                      )}
                      <span className="ml-0.5">{item.user.name}</span>
                    </div>
                    {/* X share mini button */}
                    <button
                      className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-x-black bg-background hover:bg-foreground/5 px-2 py-1 rounded-full transition-colors"
                      onClick={() =>
                        shareOnX({
                          itemName: item.name,
                          condition: item.condition,
                          series: item.series,
                          manufacturer: item.manufacturer,
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
      </div>
    </div>
  );
}
