import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/auth/AuthProvider";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "ガチャトレ | カプセルトイの物々交換サービス",
  description: "ダブったガチャガチャを安全に交換。Xでシェアして交換相手を見つけよう！送料のみで欲しかったアイテムが手に入る。",
  openGraph: {
    title: "ガチャトレ | カプセルトイの物々交換",
    description: "ダブったガチャ、シェアして交換しよう！",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ガチャトレ | カプセルトイの物々交換",
    description: "ダブったガチャ、シェアして交換しよう！",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-[family-name:var(--font-noto-sans-jp)] antialiased pb-20 sm:pb-0`}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
