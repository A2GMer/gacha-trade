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

const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ガチャトレ";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swacole.com";
const SITE_DESCRIPTION =
  "ガチャトレは、不要なアイテムを交換して新しいコレクションに出会える、ぶつぶつ交換サービスです。";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E53935",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | コレクターアイテムの交換・売買サービス`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "ガチャトレ",
    "コレクション",
    "ぶつぶつ交換",
    "トレード",
    "アイテム交換",
    "フリマ",
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
    title: `${SITE_NAME} | コレクターアイテムの交換・売買サービス`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/hero-illustration.webp",
        width: 768,
        height: 512,
        alt: `${SITE_NAME} サービスイメージ`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | コレクターアイテムの交換・売買サービス`,
    description: SITE_DESCRIPTION,
    images: ["/hero-illustration.webp"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
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