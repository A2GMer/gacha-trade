"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell, LogOut, User, ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    if (q?.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
          <Image src="/logo.svg" alt="????" width={36} height={36} className="h-8 sm:h-9 w-auto object-contain" />
          <span className="font-bold text-lg tracking-tight">スワコレ</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input
            type="text"
            name="q"
            placeholder="キーワードで検索..."
            className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:border-primary/40 outline-none transition-colors placeholder:text-muted-light"
          />
        </form>

        {/* Icons */}
        <div className="flex items-center gap-1">
          {loading ? (
            <div className="w-8 h-8 rounded-lg bg-background animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:flex p-2 hover:bg-primary-light rounded-lg transition-colors"
                title="取引ダッシュボード"
              >
                <ArrowRightLeft className="h-5 w-5 text-foreground" />
              </Link>
              <Link href="/notifications" className="p-2 hover:bg-primary-light rounded-lg relative transition-colors">
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-primary-light rounded-lg transition-colors"
                >
                  <User className="h-5 w-5 text-foreground" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[160px] animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-bold truncate">{user.user_metadata?.display_name || user.email}</p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2.5 text-sm font-medium hover:bg-background transition-colors"
                    >
                      取引ダッシュボード
                    </Link>
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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-muted hover:text-foreground transition-colors hidden sm:block"
              >
                ログイン
              </Link>
              <Link
                href="/login?tab=register"
                className="btn btn-primary text-xs px-4 py-2"
              >
                無料登録
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
