import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
        return new ImageResponse(
            (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                        color: "white",
                        fontSize: 48,
                        fontWeight: "bold",
                    }}
                >
                    スワコレ
                </div>
            ),
            { width: 1200, height: 630 }
        );
    }

    // Supabaseからアイテム情報取得
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let itemName = "アイテム";
    let series = "";
    let condition = "";
    let imageUrl = "";
    let isTradeable = false;

    if (url && key) {
        const supabase = createClient(url, key);
        const { data } = await supabase
            .from("user_items")
            .select("condition, is_tradeable, images, catalog_items (name, series)")
            .eq("id", itemId)
            .single();

        if (data) {
            const item = data as any;
            itemName = item.catalog_items?.name || "アイテム";
            series = item.catalog_items?.series || "";
            condition = item.condition || "";
            imageUrl = item.images?.[0] || "";
            isTradeable = item.is_tradeable;
        }
    }

    const statusText = isTradeable ? "交換募集中" : "コレクション";
    const statusColor = isTradeable ? "#E53935" : "#6c757d";

    return new ImageResponse(
        (
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    padding: 60,
                    fontFamily: "sans-serif",
                }}
            >
                {/* 左側: アイテム画像 */}
                <div
                    style={{
                        display: "flex",
                        width: 420,
                        height: 420,
                        borderRadius: 24,
                        overflow: "hidden",
                        border: "4px solid rgba(255,255,255,0.15)",
                        flexShrink: 0,
                        marginTop: "auto",
                        marginBottom: "auto",
                    }}
                >
                    {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imageUrl}
                            alt=""
                            width={420}
                            height={420}
                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: "100%",
                                background: "rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.3)",
                                fontSize: 80,
                            }}
                        >
                            🎯
                        </div>
                    )}
                </div>

                {/* 右側: テキスト情報 */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        marginLeft: 48,
                        flex: 1,
                        gap: 16,
                    }}
                >
                    {/* ステータスバッジ */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                background: statusColor,
                                color: "white",
                                padding: "8px 20px",
                                borderRadius: 50,
                                fontSize: 22,
                                fontWeight: "bold",
                            }}
                        >
                            {statusText}
                        </div>
                        {condition && (
                            <div
                                style={{
                                    display: "flex",
                                    background: "rgba(255,255,255,0.1)",
                                    color: "rgba(255,255,255,0.7)",
                                    padding: "8px 16px",
                                    borderRadius: 50,
                                    fontSize: 20,
                                }}
                            >
                                {condition}
                            </div>
                        )}
                    </div>

                    {/* アイテム名 */}
                    <div
                        style={{
                            display: "flex",
                            color: "white",
                            fontSize: 44,
                            fontWeight: "bold",
                            lineHeight: 1.3,
                            maxWidth: 580,
                        }}
                    >
                        {itemName}
                    </div>

                    {/* シリーズ名 */}
                    {series && (
                        <div
                            style={{
                                display: "flex",
                                color: "rgba(255,255,255,0.5)",
                                fontSize: 24,
                            }}
                        >
                            📦 {series}
                        </div>
                    )}

                    {/* ロゴ */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginTop: 24,
                            color: "rgba(255,255,255,0.4)",
                            fontSize: 22,
                        }}
                    >
                        🔄 スワコレ｜安全な物々交換サービス
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
