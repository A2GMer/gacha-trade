import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// 既知のメーカー一覧（DB初期データ + スクレイピング結果から蓄積される）
const KNOWN_MANUFACTURERS = [
    "バンダイ", "タカラトミーアーツ", "キタンクラブ", "夢屋", "エポック",
    "ブシロード", "SO-TA", "クオリア", "エール", "ケンエレファント",
    "いきもん", "海洋堂", "フクヤ", "アミューズ", "メガハウス",
    "トイズキャビン", "トイズスピリッツ", "スクウェアエニックス",
    "グッドスマイルカンパニー", "Jドリーム", "石川玩具",
];

interface EnrichResult {
    name: string;
    manufacturer: string;
    series: string;
    confidence: number;
}

async function callGemini(productName: string): Promise<EnrichResult> {
    const prompt = `以下のカプセルトイ（ガチャガチャ）の商品名から、構造化データを抽出してください。

入力: "${productName}"

出力は以下のJSON形式のみで回答してください（説明文は不要）:
{
  "name": "正式な商品名（入力をベースに正式名称に補正）",
  "manufacturer": "メーカー名",
  "series": "シリーズ名（キャラクター作品名やIPなど。不明の場合は空文字）",
  "confidence": 0.0〜1.0（情報の確度。確信がある場合は0.9以上）
}

メーカー候補: ${KNOWN_MANUFACTURERS.join(", ")}

注意:
- ガチャガチャ/カプセルトイの商品名です
- メーカーが候補にない場合は推測してください
- confidence は情報の確度です（該当メーカーの製品であることの確信度）`;

    const response = await fetch(
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

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
        return JSON.parse(text) as EnrichResult;
    } catch {
        return { name: productName, manufacturer: "", series: "", confidence: 0 };
    }
}

function calculateTrustScore(
    aiResult: EnrichResult,
    knownManufacturers: string[],
    knownSeries: string[],
    userTradeCount: number
): number {
    let score = aiResult.confidence;

    // 既知メーカーと一致 → +0.1
    if (knownManufacturers.some(m => m === aiResult.manufacturer)) {
        score += 0.1;
    }

    // 既知シリーズと一致 → +0.1
    if (knownSeries.some(s => s === aiResult.series)) {
        score += 0.1;
    }

    // ユーザー信頼度 → 取引実績に応じて加算
    score += Math.min(0.1, userTradeCount * 0.01);

    return Math.min(1.0, score);
}

export async function POST(request: NextRequest) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
        }

        const { productName, userId } = await request.json();

        if (!productName || typeof productName !== "string") {
            return NextResponse.json({ error: "productName is required" }, { status: 400 });
        }

        // AI解析
        const aiResult = await callGemini(productName.trim());

        // DB接続して既知データと照合
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // 既知メーカー・シリーズ一覧を取得
        const { data: existingCatalog } = await supabase
            .from("catalog_items")
            .select("manufacturer, series")
            .eq("is_approved", true);

        const knownManufacturers = [...new Set((existingCatalog || []).map(c => c.manufacturer))];
        const knownSeries = [...new Set((existingCatalog || []).map(c => c.series).filter(Boolean))];

        // ユーザーの取引実績
        let userTradeCount = 0;
        if (userId) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("trade_count")
                .eq("id", userId)
                .single();
            userTradeCount = profile?.trade_count || 0;
        }

        // 信頼スコア計算
        const trustScore = calculateTrustScore(aiResult, knownManufacturers, knownSeries, userTradeCount);
        const autoApproved = trustScore >= 0.8;

        // 重複チェック
        const { data: existing } = await supabase
            .from("catalog_items")
            .select("id, name, manufacturer, series")
            .eq("name", aiResult.name)
            .eq("manufacturer", aiResult.manufacturer)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({
                exists: true,
                catalogItem: existing,
                aiResult,
                trustScore,
            });
        }

        return NextResponse.json({
            exists: false,
            aiResult: {
                ...aiResult,
                trustScore,
                autoApproved,
            },
        });
    } catch (error) {
        console.error("AI enrich error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
