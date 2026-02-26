import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <div className="bg-surface sticky top-0 z-40 px-4 py-3 border-b border-border flex items-center gap-3">
                <Link href="/mypage" className="p-1 -ml-1 hover:bg-surface-hover rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm">運営者情報</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-8">
                <div className="card p-6 space-y-6 text-sm text-foreground/80 leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 pb-4 border-b border-border">
                        <Info className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-black text-foreground">運営者情報</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-3 border-b border-border pb-2">
                            <span className="font-bold text-foreground">サービス名</span>
                            <span className="col-span-2">ガチャトレ</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-border pb-2">
                            <span className="font-bold text-foreground">運営事業者</span>
                            <span className="col-span-2">株式会社〇〇（※仮設）</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-border pb-2">
                            <span className="font-bold text-foreground">代表責任者</span>
                            <span className="col-span-2">鈴木 一郎</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-border pb-2">
                            <span className="font-bold text-foreground">所在地</span>
                            <span className="col-span-2">〒100-0000<br />東京都千代田区〇〇1-2-3</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-border pb-2">
                            <span className="font-bold text-foreground">連絡先</span>
                            <span className="col-span-2">info@example.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
