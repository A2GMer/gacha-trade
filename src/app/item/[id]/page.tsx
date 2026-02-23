import Link from "next/link";
import { Star, ShieldCheck, Flag, Ban, ChevronLeft, MessageCircle } from "lucide-react";

// Mock data lookup (would be Supabase call in production)
const getItemData = (id: string) => {
    return {
        id,
        name: "ピカチュウ (カプセルフィギュア Vol.1)",
        manufacturer: "ポケモン",
        series: "カプセルフィギュア Vol.1",
        condition: "未開封",
        images: [
            "https://images.unsplash.com/photo-1610894517343-c5b1fc9a840b?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=800&fit=crop",
        ],
        description: "カプセルから出したばかりの未開封品です。ミニブックも付属します。ダブってしまったので、リザードンか他の同シリーズアイテムと交換希望です。",
        user: {
            id: "u1",
            name: "たなか",
            rating: 4.8,
            trade_count: 52,
            smsVerified: true,
            avatar: "https://ui-avatars.com/api/?name=TN&background=random",
        },
    };
};

export default async function ItemPage({ params }: { params: { id: string } }) {
    const item = getItemData(params.id);

    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Mobile Top Header */}
            <div className="sm:hidden sticky top-0 bg-white/80 backdrop-blur-md z-40 p-4 border-b border-border flex items-center justify-between">
                <Link href="/">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="flex gap-4">
                    <Flag className="h-5 w-5 text-muted" />
                    <Ban className="h-5 w-5 text-muted" />
                </div>
            </div>

            <div className="container mx-auto max-w-4xl sm:py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Images */}
                <div className="space-y-4">
                    <div className="aspect-square bg-white rounded-lg overflow-hidden border border-border">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 px-4 sm:px-0">
                        {item.images.map((img, i) => (
                            <div key={i} className="aspect-square rounded-md overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity">
                                <img src={img} alt={`${item.name} ${i}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="px-4 sm:px-0 space-y-6">
                    <div className="bg-white p-6 card">
                        <h1 className="text-xl font-bold mb-2 leading-tight">{item.name}</h1>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                                状態: {item.condition}
                            </span>
                            <span className="text-xs text-muted">カテゴリー: {item.manufacturer} / {item.series}</span>
                        </div>

                        <div className="border-t border-border pt-4">
                            <h2 className="text-sm font-bold text-muted mb-2 uppercase">商品の説明</h2>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.description}</p>
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="bg-white p-6 card flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src={item.user.avatar} alt={item.user.name} className="w-12 h-12 rounded-full border border-border" />
                            <div>
                                <div className="flex items-center gap-1 font-bold">
                                    {item.user.name}
                                    {item.user.smsVerified && <ShieldCheck className="h-4 w-4 text-secondary fill-secondary/10" />}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted">
                                    <div className="flex items-center gap-0.5">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>{item.user.rating}</span>
                                    </div>
                                    <span>取引数: {item.user.trade_count}回</span>
                                </div>
                            </div>
                        </div>
                        <Link href={`/user/${item.user.id}`} className="text-sm text-secondary font-bold hover:underline">
                            一覧を見る
                        </Link>
                    </div>

                    {/* Action Row for Desktop */}
                    <div className="hidden sm:flex gap-4">
                        <button className="flex-1 bg-primary text-white font-bold py-4 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            交換を提案する
                        </button>
                        <button className="px-4 bg-white border border-border rounded-lg hover:bg-background transition-colors" title="通報">
                            <Flag className="h-6 w-6 text-muted" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar for Mobile */}
            <div className="sm:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-border z-40">
                <button className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-lg active:scale-95 transition-transform">
                    交換を提案する
                </button>
            </div>
        </div>
    );
}
