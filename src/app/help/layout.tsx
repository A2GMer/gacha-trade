import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ヘルプ・ガイド",
    description:
        "ガチャトレードの使い方や取引の流れ、送料、トラブル時の対応方法など、よくある質問をまとめています。",
    openGraph: {
        title: "ヘルプ・ガイド | ガチャトレード",
        description:
            "取引の流れや送料、トラブル対応などのよくある質問をご覧いただけます。",
    },
};

export default function HelpLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
