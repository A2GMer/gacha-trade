"use client";

import Link from "next/link";
import { Search, Bell, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/20">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 gradient-hero rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <span className="text-white font-black text-lg">G</span>
          </div>
          <span className="font-black text-lg hidden sm:block tracking-tight">
            ガチャトレ
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input
            type="text"
            placeholder="キーワードで検索..."
            className="w-full bg-background/80 border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all placeholder:text-muted-light"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-1">
          <button className="p-2.5 hover:bg-primary-light rounded-2xl relative transition-colors">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white animate-pulse"></span>
          </button>
          <button className="p-2.5 hover:bg-primary-light rounded-2xl sm:hidden transition-colors">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
