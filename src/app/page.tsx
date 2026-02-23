import Image from "next/image";
import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";

const DUMMY_ITEMS = [
  {
    id: "1",
    name: "ピカチュウ (カプセルフィギュア Vol.1)",
    condition: "未開封",
    imageUrl: "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=400&h=400&fit=crop",
    user: { name: "たなか", rating: 4.8, smsVerified: true },
  },
  {
    id: "2",
    name: "ちいかわ サッカーボール",
    condition: "開封済",
    imageUrl: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop",
    user: { name: "さとう", rating: 4.5, smsVerified: true },
  },
  {
    id: "3",
    name: "機動戦士ガンダム モビルスーツアンサンブル",
    condition: "傷あり",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=400&fit=crop",
    user: { name: "すずき", rating: 4.9, smsVerified: true },
  },
  {
    id: "4",
    name: "すみっコぐらし ふにふにマスコット",
    condition: "未開封",
    imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop",
    user: { name: "たかはし", rating: 4.2, smsVerified: false },
  },
];

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero / Banner */}
      <div className="bg-white px-4 py-6 mb-4 border-b border-border">
        <h1 className="text-xl font-bold mb-2">交換可能な新着アイテム</h1>
        <p className="text-sm text-muted">ダブったアイテムを交換してコレクションを完成させよう！</p>
      </div>

      {/* Item Grid */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DUMMY_ITEMS.map((item) => (
            <Link key={item.id} href={`/item/${item.id}`} className="group">
              <div className="card h-full transition-transform active:scale-95">
                <div className="relative aspect-square">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Condition Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                    {item.condition}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2 mb-2 leading-tight group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 text-[10px] text-muted">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{item.user.rating}</span>
                      {item.user.smsVerified && (
                        <ShieldCheck className="h-3 w-3 text-secondary ml-1" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted">{item.user.name}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
