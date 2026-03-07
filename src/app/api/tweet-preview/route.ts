import { NextResponse } from "next/server";

const ALLOWED_TWEET_HOSTS = new Set([
    "twitter.com",
    "www.twitter.com",
    "x.com",
    "www.x.com",
    "mobile.twitter.com",
    "mobile.x.com",
]);

function isSupportedTweetUrl(rawUrl: string): boolean {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== "https:") {
            return false;
        }

        if (!ALLOWED_TWEET_HOSTS.has(parsed.hostname.toLowerCase())) {
            return false;
        }

        return parsed.pathname.includes("/status/");
    } catch {
        return false;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    if (!isSupportedTweetUrl(url)) {
        return NextResponse.json({ error: "Unsupported tweet URL" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&lang=ja`;
        const response = await fetch(oembedUrl, {
            signal: controller.signal,
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch tweet preview" },
                { status: response.status }
            );
        }

        const data = await response.json();
        const rawHtml = typeof data?.html === "string" ? data.html : "";
        const sanitizedHtml = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

        return NextResponse.json({ html: sanitizedHtml });
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
            return NextResponse.json({ error: "Tweet preview request timed out" }, { status: 504 });
        }

        console.error("API /tweet-preview error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        clearTimeout(timeout);
    }
}
