import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "運営者情報",
    description:
        "ガチャトレードの運営者情報です。事業者名、所在地、連絡先をご確認いただけます。",
    openGraph: {
        title: "運営者情報 | ガチャトレード",
        description: "ガチャトレードの運営者情報をご確認ください。",
    },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
