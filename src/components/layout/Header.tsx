import Link from "next/link";
import { Search, Bell, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">g</span>
          </div>
          <span className="font-bold text-xl hidden sm:block tracking-tighter">
            ガチャトレ
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input
            type="text"
            placeholder="何をお探しですか？"
            className="w-full bg-background border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-background rounded-full relative">
            <Bell className="h-6 w-6 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 hover:bg-background rounded-full sm:hidden">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
