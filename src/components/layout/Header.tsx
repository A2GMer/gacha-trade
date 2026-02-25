"use client";

import Link from "next/link";
import { Search, Bell, Menu, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          {loading ? (
            <div className="w-9 h-9 rounded-2xl bg-background animate-pulse" />
          ) : user ? (
            <>
              <Link href="/notifications" className="p-2.5 hover:bg-primary-light rounded-2xl relative transition-colors">
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white animate-pulse"></span>
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2.5 hover:bg-primary-light rounded-2xl transition-colors"
                >
                  <User className="h-5 w-5 text-foreground" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-lg border border-border py-2 min-w-[160px] animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-bold truncate">{user.user_metadata?.display_name || user.email}</p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/mypage"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2.5 text-sm font-medium hover:bg-background transition-colors"
                    >
                      マイページ
                    </Link>
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        await signOut();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/5 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary text-xs px-4 py-2 gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
