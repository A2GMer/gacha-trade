import { NextResponse } from "next/server";

const ALLOWED_TWEET_HOSTS = new Set([
    "twitter.com",
    "www.twitter.com",
    "x.com",
    "www.x.com",
    "mobile.twitter.com",
    "mobile.x.com",
]);

const NETWORK_ERROR_CODES = new Set([
    "EACCES",
    "ECONNREFUSED",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ENOTFOUND",
    "ETIMEDOUT",
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

function isNetworkConnectivityError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const cause = (error as Error & { cause?: unknown }).cause;
    if (!cause || typeof cause !== "object") {
        return false;
    }

    const causeCode = (cause as { code?: unknown }).code;
    if (typeof causeCode === "string" && NETWORK_ERROR_CODES.has(causeCode)) {
        return true;
    }

    const nestedErrors = (cause as { errors?: unknown }).errors;
    if (!Array.isArray(nestedErrors)) {
        return false;
    }

    return nestedErrors.some((entry) => {
        if (!entry || typeof entry !== "object") {
            return false;
        }
        const nestedCode = (entry as { code?: unknown }).code;
        return typeof nestedCode === "string" && NETWORK_ERROR_CODES.has(nestedCode);
    });
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

        if (isNetworkConnectivityError(error)) {
            return NextResponse.json(
                { error: "Tweet preview provider is unavailable" },
                { status: 502 }
            );
        }

        console.error("API /tweet-preview error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        clearTimeout(timeout);
    }
}
