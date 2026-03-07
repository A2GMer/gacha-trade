import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, validateCronRequest } from "@/lib/api-auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const SCHEDULE_URL = "https://gashapon.jp/schedule/";
const CATALOG_SOURCE = "scrape";
const DEFAULT_MANUFACTURER = "Bandai";

interface ScrapedItem {
    name: string;
    price: number | null;
    manufacturer: string;
    series: string;
    janCode: string | null;
    imageUrl: string | null;
    confidence: number;
}

function decodeHtmlEntities(value: string): string {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");
}

function normalizeImageUrl(raw: string | null | undefined): string | null {
    if (!raw) {
        return null;
    }

    const cleaned = raw.replace(/\\\//g, "/").trim();
    if (!cleaned || cleaned.startsWith("data:")) {
        return null;
    }

    try {
        return new URL(cleaned, SCHEDULE_URL).toString();
    } catch {
        return null;
    }
}

function extractImageUrlNear(html: string, startIndex: number): string | null {
    const windowStart = Math.max(0, startIndex - 200);
    const windowEnd = Math.min(html.length, startIndex + 1200);
    const segment = html.slice(windowStart, windowEnd);

    const directMatch = segment.match(/(?:data-src|src)=["']([^"']+\.(?:webp|png|jpg|jpeg)[^"']*)["']/i);
    if (directMatch) {
        return normalizeImageUrl(directMatch[1]);
    }

    const styleMatch = segment.match(/background-image\s*:\s*url\((["']?)([^"')]+)\1\)/i);
    if (styleMatch) {
        return normalizeImageUrl(styleMatch[2]);
    }

    return null;
}

function parsePrice(rawName: string): number | null {
    const priceMatch = rawName.match(/(\d{2,4})(?=\D*$)/);
    return priceMatch ? parseInt(priceMatch[1], 10) : null;
}

function cleanProductName(rawName: string): string {
    return rawName
        .replace(/\s+/g, " ")
        .replace(/\d+\s*[^\d\s]+$/, "")
        .trim();
}

async function classifySeries(items: Array<{ name: string; price: number | null; janCode: string | null; imageUrl: string | null }>): Promise<ScrapedItem[]> {
    if (!GEMINI_API_KEY) {
        return items.map((item) => ({
            name: item.name,
            price: item.price,
            manufacturer: DEFAULT_MANUFACTURER,
            series: "",
            janCode: item.janCode,
            imageUrl: item.imageUrl,
            confidence: 0.6,
        }));
    }

    const prompt = [
        "Classify these capsule toy product names into series names.",
        "Return strict JSON array with shape [{\"name\": string, \"series\": string}].",
        "Do not include markdown.",
        ...items.map((item) => item.name),
    ].join("\n");

    const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                },
            }),
        }
    );

    let seriesMap: Array<{ name: string; series: string }> = [];
    if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const geminiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        try {
            seriesMap = JSON.parse(geminiText);
        } catch {
            seriesMap = [];
        }
    }

    return items.map((item) => {
        const matched = seriesMap.find((seriesItem) => seriesItem.name === item.name);
        return {
            name: item.name,
            price: item.price,
            manufacturer: DEFAULT_MANUFACTURER,
            series: matched?.series || "",
            janCode: item.janCode,
            imageUrl: item.imageUrl,
            confidence: 0.9,
        };
    });
}

async function scrapeGashapon(): Promise<ScrapedItem[]> {
    const response = await fetch(SCHEDULE_URL, {
        headers: {
            "User-Agent": "GachaTrade-Bot/1.1 (Catalog Update)",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to scrape gashapon.jp: ${response.status}`);
    }

    const html = await response.text();
    const cardPattern = /<a[^>]+href="[^"]*jan_code=(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>\s*<\/div>/gi;
    const parsedByJan = new Map<string, { name: string; price: number | null; janCode: string | null; imageUrl: string | null }>();

    let match: RegExpExecArray | null;
    while ((match = cardPattern.exec(html)) !== null) {
        const janCode = match[1];
        const cardHtml = match[2];
        const linkHtml = match[0];

        // Keep only standard gashapon items in this phase.
        const isGashapon = /data-category="station"/i.test(cardHtml);
        if (!isGashapon) {
            continue;
        }

        const nameMatch = cardHtml.match(/<p class="c-card__name">([\s\S]*?)<\/p>/i);
        const altMatch = linkHtml.match(/alt="([^"]+)"/i);
        const rawName = decodeHtmlEntities(
            (nameMatch?.[1] || altMatch?.[1] || "").replace(/<[^>]+>/g, "").trim()
        );
        const name = cleanProductName(rawName);

        if (name.length < 2) {
            continue;
        }

        const priceMatch = cardHtml.match(/c-card__price--main">(\d{2,4})<\/span>/i);
        const price = priceMatch ? parseInt(priceMatch[1], 10) : parsePrice(rawName);

        const imageMatch = cardHtml.match(/(?:data-src|src)="([^"]+)"/i);
        const imageUrl = imageMatch
            ? normalizeImageUrl(imageMatch[1])
            : extractImageUrlNear(html, match.index);

        const existing = parsedByJan.get(janCode);
        if (!existing) {
            parsedByJan.set(janCode, { name, price, janCode, imageUrl });
            continue;
        }

        if (!existing.imageUrl && imageUrl) {
            parsedByJan.set(janCode, { ...existing, imageUrl });
        }
    }

    const parsedItems = Array.from(parsedByJan.values()).slice(0, 120);
    if (parsedItems.length === 0) {
        return [];
    }

    return classifySeries(parsedItems);
}

export async function GET(request: NextRequest) {
    const cronAuth = validateCronRequest(request);
    if (!cronAuth.ok) {
        return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
    }

    try {
        const supabaseAdmin = createServiceRoleClient();
        const scrapedItems = await scrapeGashapon();

        let added = 0;
        let skipped = 0;
        let updated = 0;

        for (const item of scrapedItems) {
            let existingId: string | null = null;

            if (item.janCode) {
                const { data: existingByJan } = await supabaseAdmin
                    .from("catalog_items")
                    .select("id")
                    .eq("jan_code", item.janCode)
                    .maybeSingle();

                existingId = existingByJan?.id || null;
            }

            if (!existingId) {
                const { data: existingByName } = await supabaseAdmin
                    .from("catalog_items")
                    .select("id")
                    .eq("name", item.name)
                    .eq("manufacturer", item.manufacturer)
                    .maybeSingle();

                existingId = existingByName?.id || null;
            }

            if (existingId) {
                const updatePayload: {
                    image_url?: string;
                    jan_code?: string;
                    price?: number;
                    series?: string;
                } = {};

                if (item.imageUrl) {
                    updatePayload.image_url = item.imageUrl;
                }
                if (item.janCode) {
                    updatePayload.jan_code = item.janCode;
                }
                if (item.price !== null) {
                    updatePayload.price = item.price;
                }
                if (item.series) {
                    updatePayload.series = item.series;
                }

                if (Object.keys(updatePayload).length > 0) {
                    const { error: updateError } = await supabaseAdmin
                        .from("catalog_items")
                        .update(updatePayload)
                        .eq("id", existingId);

                    if (updateError) {
                        console.error("Failed to update scraped catalog item:", updateError);
                    } else {
                        updated++;
                    }
                }

                skipped++;
                continue;
            }

            const { error: insertError } = await supabaseAdmin.from("catalog_items").insert({
                name: item.name,
                manufacturer: item.manufacturer,
                series: item.series,
                price: item.price,
                jan_code: item.janCode,
                image_url: item.imageUrl,
                source: CATALOG_SOURCE,
                ai_confidence: item.confidence,
                is_approved: true,
            });

            if (insertError) {
                console.error("Failed to insert scraped catalog item:", insertError);
            } else {
                added++;
            }
        }

        return NextResponse.json({
            success: true,
            scraped: scrapedItems.length,
            added,
            skipped,
            updated,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Catalog scrape error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
