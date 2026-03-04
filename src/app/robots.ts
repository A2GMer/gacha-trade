import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swacole.com";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/admin/", "/trade/", "/mypage/", "/notifications/", "/login/"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
