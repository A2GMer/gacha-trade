import type { Metadata } from "next";

const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "スワコレ";

export const metadata: Metadata = {
    title: `お問い合わせ | ${SITE_NAME}`,
    description: `${SITE_NAME}（スワコレ）に関するお問い合わせ、ご要望、不具合の報告はこちらからご連絡ください。`,
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
