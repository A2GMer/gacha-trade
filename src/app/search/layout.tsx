import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "アイテムを検索",
    description:
        "スワコレでガチャガチャ・一番くじ・推し活グッズを検索。メーカーやシリーズで絞り込んで交換したいアイテムを見つけましょう。",
    openGraph: {
        title: "アイテムを検索 | スワコレ",
        description:
            "カプセルトイのアイテムを検索して、交換相手を見つけましょう。",
    },
};

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
