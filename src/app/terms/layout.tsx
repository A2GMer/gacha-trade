import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "利用規約",
    description:
        "ガチャトレードの利用規約です。ユーザー登録、禁止事項、免責事項についてご確認ください。",
    openGraph: {
        title: "利用規約 | ガチャトレード",
        description: "ガチャトレードの利用規約をご確認ください。",
    },
};

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
