import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "スワコレ";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swacole.com";

interface ItemRow {
    id: string;
    condition: string;
    is_tradeable: boolean;
    images: string[];
    catalog_items: {
        name: string;
        series: string;
        manufacturer: string;
    };
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;

    // サーバー側でSupabaseから直接フェッチ
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return { title: `アイテム詳細 | ${SITE_NAME}` };
    }

    const supabase = createClient(url, key);
    const { data } = await supabase
        .from("user_items")
        .select("id, condition, is_tradeable, images, catalog_items (name, series, manufacturer)")
        .eq("id", id)
        .single();

    const item = data as unknown as ItemRow | null;

    if (!item) {
        return { title: `アイテムが見つかりません | ${SITE_NAME}` };
    }

    const itemName = item.catalog_items?.name || "アイテム";
    const series = item.catalog_items?.series || "";
    const manufacturer = item.catalog_items?.manufacturer || "";
    const condition = item.condition;
    const tradeLabel = item.is_tradeable ? "交換募集中" : "コレクション";

    const title = `${itemName}｜${tradeLabel}`;
    const description = `${series}${manufacturer ? ` / ${manufacturer}` : ""} - ${condition}｜${SITE_NAME}で安全に交換`;

    const itemUrl = `${SITE_URL}/item/${id}`;
    const ogImageUrl = `${SITE_URL}/api/og?itemId=${id}`;

    // 実画像があればそれを優先、なければOG Image API
    const imageUrl = item.images?.[0] || ogImageUrl;

    return {
        title,
        description,
        openGraph: {
            type: "website",
            locale: "ja_JP",
            url: itemUrl,
            siteName: SITE_NAME,
            title: `${itemName}｜${tradeLabel} | ${SITE_NAME}`,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 600,
                    height: 600,
                    alt: `${itemName} - ${condition}`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${itemName}｜${tradeLabel} | ${SITE_NAME}`,
            description,
            images: [imageUrl],
        },
        alternates: {
            canonical: itemUrl,
        },
    };
}

export default function ItemLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
