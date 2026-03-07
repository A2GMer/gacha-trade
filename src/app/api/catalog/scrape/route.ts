import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, validateCronRequest } from "@/lib/api-auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

interface ScrapedItem {
    name: string;
    price: number | null;
    manufacturer: string;
    series: string;
    janCode: string | null;
    confidence: number;
}

async function scrapeGashapon(): Promise<ScrapedItem[]> {
    const response = await fetch("https://gashapon.jp/schedule/", {
        headers: {
            "User-Agent": "GachaTrade-Bot/1.0 (Catalog Update)",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to scrape gashapon.jp: ${response.status}`);
    }

    const html = await response.text();
    const parsedItems: { name: string; price: number | null; janCode: string | null }[] = [];

    const productPattern = /jan_code=(\d+)\d{3}[^>]*>([^<]+)</g;
    let match: RegExpExecArray | null;

    while ((match = productPattern.exec(html)) !== null) {
        const janCode = match[1];
        const rawName = match[2].trim();
        const priceMatch = rawName.match(/(\d+)円/);
        const price = priceMatch ? parseInt(priceMatch[1], 10) : null;
        const name = rawName.replace(/ガシャポン\d+円?$/, "").trim();

        if (name.length > 2) {
            parsedItems.push({ name, price, janCode });
        }
    }

    if (parsedItems.length === 0) {
        return [];
    }

    const limitedItems = parsedItems.slice(0, 30);
    const prompt = [
        "Classify these capsule toy product names into series names.",
        "Return strict JSON array with shape [{\"name\": string, \"series\": string}].",
        "Do not include markdown.",
        ...limitedItems.map((item) => item.name),
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

    return limitedItems.map((item) => {
        const matched = seriesMap.find((seriesItem) => seriesItem.name === item.name);
        return {
            name: item.name,
            price: item.price,
            manufacturer: "Bandai",
            series: matched?.series || "",
            janCode: item.janCode,
            confidence: 0.9,
        };
    });
}

export async function GET(request: NextRequest) {
    const cronAuth = validateCronRequest(request);
    if (!cronAuth.ok) {
        return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
    }

    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    try {
        const supabaseAdmin = createServiceRoleClient();
        const scrapedItems = await scrapeGashapon();

        let added = 0;
        let skipped = 0;

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
                skipped++;
                continue;
            }

            const { error: insertError } = await supabaseAdmin.from("catalog_items").insert({
                name: item.name,
                manufacturer: item.manufacturer,
                series: item.series,
                price: item.price,
                jan_code: item.janCode,
                source: "scrape",
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
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Catalog scrape error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
