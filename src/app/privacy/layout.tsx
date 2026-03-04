import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "プライバシーポリシー",
    description:
        "スワコレにおける個人情報の取り扱い方針です。収集する情報、利用目的、第三者提供について説明しています。",
    openGraph: {
        title: "プライバシーポリシー | スワコレ",
        description: "個人情報の取り扱いに関するポリシーをご確認ください。",
    },
};

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
