import Link from "next/link";
import { Home, Search, Camera, Bell, User } from "lucide-react";

export function BottomNav() {
    return (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-2 z-50">
            <div className="flex justify-between items-center">
                <Link href="/" className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors">
                    <Home className="h-6 w-6" />
                    <span className="text-[10px]">ホーム</span>
                </Link>
                <Link href="/search" className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors">
                    <Search className="h-6 w-6" />
                    <span className="text-[10px]">検索</span>
                </Link>
                <Link href="/sell" className="flex flex-col items-center transition-transform active:scale-95">
                    <div className="bg-primary text-white p-3 rounded-full -mt-8 border-4 border-background shadow-lg">
                        <Camera className="h-7 w-7" />
                    </div>
                    <span className="text-[10px] font-bold text-primary">出品</span>
                </Link>
                <Link href="/notifications" className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors">
                    <Bell className="h-6 w-6" />
                    <span className="text-[10px]">お知らせ</span>
                </Link>
                <Link href="/mypage" className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors">
                    <User className="h-6 w-6" />
                    <span className="text-[10px]">マイページ</span>
                </Link>
            </div>
        </nav>
    );
}
