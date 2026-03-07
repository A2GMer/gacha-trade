import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthenticatedUser, validateSameOrigin } from "@/lib/api-auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const KNOWN_MANUFACTURERS = [
    "Bandai",
    "Takara Tomy A.R.T.S",
    "Kitan Club",
    "EPOCH",
    "Bushiroad",
    "SO-TA",
];

interface EnrichResult {
    name: string;
    manufacturer: string;
    series: string;
    confidence: number;
}

async function callGemini(productName: string): Promise<EnrichResult> {
    const prompt = [
        "Classify this capsule toy product name.",
        `Input: ${productName}`,
        "Return strict JSON object with keys: name, manufacturer, series, confidence.",
        `Known manufacturers: ${KNOWN_MANUFACTURERS.join(", ")}`,
        "Confidence must be 0.0 to 1.0.",
    ].join("\n");

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

    if (!response.ok) {
        return { name: productName, manufacturer: "", series: "", confidence: 0 };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
        const parsed = JSON.parse(text) as EnrichResult;
        return {
            name: parsed.name || productName,
            manufacturer: parsed.manufacturer || "",
            series: parsed.series || "",
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
        };
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

    if (knownManufacturers.includes(aiResult.manufacturer)) {
        score += 0.1;
    }

    if (knownSeries.includes(aiResult.series)) {
        score += 0.1;
    }

    score += Math.min(0.1, userTradeCount * 0.01);

    return Math.max(0, Math.min(1, score));
}

export async function POST(request: NextRequest) {
    try {
        const originCheck = validateSameOrigin(request);
        if (!originCheck.ok) {
            return NextResponse.json({ error: originCheck.error }, { status: originCheck.status });
        }

        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
        }

        const { productName } = await request.json();
        if (!productName || typeof productName !== "string") {
            return NextResponse.json({ error: "productName is required" }, { status: 400 });
        }

        const normalizedName = productName.trim();
        if (normalizedName.length < 2 || normalizedName.length > 120) {
            return NextResponse.json({ error: "productName length is invalid" }, { status: 400 });
        }

        const aiResult = await callGemini(normalizedName);
        const supabaseAdmin = createServiceRoleClient();

        const { data: existingCatalog } = await supabaseAdmin
            .from("catalog_items")
            .select("manufacturer, series")
            .eq("is_approved", true);

        const knownManufacturers = [
            ...new Set(
                (existingCatalog || [])
                    .map((catalogItem) => catalogItem.manufacturer)
                    .filter(Boolean)
            ),
        ];

        const knownSeries = [
            ...new Set(
                (existingCatalog || [])
                    .map((catalogItem) => catalogItem.series)
                    .filter(Boolean)
            ),
        ];

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("trade_count")
            .eq("id", user.id)
            .maybeSingle();

        const userTradeCount = profile?.trade_count || 0;
        const trustScore = calculateTrustScore(
            aiResult,
            knownManufacturers,
            knownSeries,
            userTradeCount
        );
        const autoApproved = trustScore >= 0.8;

        const { data: existing } = await supabaseAdmin
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
