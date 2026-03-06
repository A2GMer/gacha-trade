import type { Metadata } from "next";

const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "スワコレ";

export const metadata: Metadata = {
    title: `アイテムを出品する | ${SITE_NAME}`,
    description: `ダブったガチャガチャ・カプセルトイを簡単に出品できます。${SITE_NAME}なら送料のみで欲しかったアイテムと交換可能です。`,
};

export default function SellLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
