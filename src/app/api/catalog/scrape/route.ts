import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

interface ScrapedItem {
    name: string;
    price: number | null;
    manufacturer: string;
    series: string;
    janCode: string | null;
    confidence: number;
}

/**
 * gashapon.jp の発売スケジュールをスクレイピング
 */
async function scrapeGashapon(): Promise<ScrapedItem[]> {
    const response = await fetch("https://gashapon.jp/schedule/", {
        headers: {
            "User-Agent": "GachaTrade-Bot/1.0 (Catalog Update)",
        },
    });
    const html = await response.text();

    // HTMLからリスト化（簡易パース：janコード + 商品名 + 価格を正規表現で抽出）
    const items: { name: string; price: number | null; janCode: string | null }[] = [];

    // jan_codeパターン: /products/detail.php?jan_code=XXXXX
    const productPattern = /jan_code=(\d+)\d{3}[^>]*>([^<]+)</g;
    let match;
    while ((match = productPattern.exec(html)) !== null) {
        const janCode = match[1];
        const rawName = match[2].trim();
        // 価格パターン: 数字+円 の直前テキスト
        const priceMatch = rawName.match(/(\d+)円$/);
        const price = priceMatch ? parseInt(priceMatch[1]) : null;
        const name = rawName.replace(/ガシャポン\d+円.*$/, "").trim();

        if (name && name.length > 2) {
            items.push({ name, price, janCode });
        }
    }

    // Gemini で一括構造化
    if (items.length === 0) return [];

    const itemList = items.slice(0, 30).map(i => i.name).join("\n");

    const prompt = `以下はバンダイのカプセルトイ（ガシャポン）の商品名リストです。
各商品について、シリーズ名（キャラクターIPなど）を推定してください。

商品名リスト:
${itemList}

出力はJSON配列のみで回答してください（説明文は不要）:
[
  { "name": "商品名", "series": "シリーズ名" },
  ...
]

注意:
- メーカーは全て「バンダイ」です
- シリーズ名はキャラクター作品名やIPです（例：ちいかわ、おじゃる丸、仮面ライダー等）
- 不明の場合はseriesを空文字にしてください`;

    const geminiRes = await fetch(
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

    const geminiData = await geminiRes.json();
    const geminiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let seriesMap: { name: string; series: string }[] = [];
    try {
        seriesMap = JSON.parse(geminiText);
    } catch {
        seriesMap = [];
    }

    return items.slice(0, 30).map((item) => {
        const matched = seriesMap.find(s => s.name === item.name);
        return {
            name: item.name,
            price: item.price,
            manufacturer: "バンダイ",
            series: matched?.series || "",
            janCode: item.janCode,
            confidence: 0.9, // 公式サイトからの取得なので高信頼
        };
    });
}

/**
 * 週1 Cron: gashapon.jp をスクレイピングしてカタログ更新
 * Vercel Cron: vercel.json に追加
 * { "crons": [{ "path": "/api/catalog/scrape", "schedule": "0 9 * * 1" }] }
 */
export async function GET(request: NextRequest) {
    try {
        // Cron認証（Vercelの場合）
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // gashapon.jp スクレイピング
        const scrapedItems = await scrapeGashapon();

        let added = 0;
        let skipped = 0;

        for (const item of scrapedItems) {
            // 重複チェック（名前+メーカー or JANコード）
            const { data: existing } = await supabase
                .from("catalog_items")
                .select("id")
                .or(`and(name.eq.${item.name},manufacturer.eq.${item.manufacturer})${item.janCode ? `,jan_code.eq.${item.janCode}` : ""}`)
                .maybeSingle();

            if (existing) {
                skipped++;
                continue;
            }

            // 新規追加（公式サイトから取得のため自動承認）
            const { error } = await supabase.from("catalog_items").insert({
                name: item.name,
                manufacturer: item.manufacturer,
                series: item.series,
                price: item.price,
                jan_code: item.janCode,
                source: "scrape",
                ai_confidence: item.confidence,
                is_approved: true, // 公式サイトからの取得は自動承認
            });

            if (!error) added++;
        }

        return NextResponse.json({
            success: true,
            scraped: scrapedItems.length,
            added,
            skipped,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Scraping error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
