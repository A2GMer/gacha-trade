import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swacole.com";

    const sitemapEntries: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${siteUrl}/search`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${siteUrl}/help`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${siteUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${siteUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${siteUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    // 動的アイテムページのサイトマップを追加
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 公開されているアイテムIDを取得 (最大1000件程度)
        const { data: items } = await supabase
            .from("user_items")
            .select("id, updated_at")
            .eq("is_public", true)
            .order("updated_at", { ascending: false })
            .limit(1000);

        if (items) {
            const itemEntries = items.map((item) => ({
                url: `${siteUrl}/item/${item.id}`,
                lastModified: new Date(item.updated_at),
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }));
            sitemapEntries.push(...itemEntries);
        }
    }

    return sitemapEntries;
}
