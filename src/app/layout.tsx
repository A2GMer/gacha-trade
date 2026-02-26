import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/auth/AuthProvider";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const SITE_NAME = "ガチャトレード";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gacha-trade.com";
const SITE_DESCRIPTION =
  "ダブったカプセルトイ（ガチャガチャ）を安全に物々交換できるサービス。Xでシェアして交換相手を見つけよう！送料のみで欲しかったアイテムが手に入ります。";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E53935",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | カプセルトイの物々交換サービス`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "ガチャガチャ", "カプセルトイ", "物々交換", "トレード",
    "ガチャ交換", "フィギュア交換", "ダブり交換",
    "ガチャトレード", "ガチャポン", "コレクション",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | カプセルトイの物々交換サービス`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/hero-illustration.webp",
        width: 768,
        height: 512,
        alt: "ガチャトレード - カプセルトイの物々交換プラットフォーム",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | カプセルトイの物々交換サービス`,
    description: SITE_DESCRIPTION,
    images: ["/hero-illustration.webp"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/icon.webp",
    apple: "/icon.webp",
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
          <main className="min-h-screen flex flex-col">
            {children}
            <Footer />
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
