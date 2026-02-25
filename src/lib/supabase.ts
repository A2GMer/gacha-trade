import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // ビルド時のプリレンダリングエラー防止
    if (!url || !key) {
        console.warn("Supabase URL or Key is missing. This might be during build time.");
        return createBrowserClient(
            url || "https://placeholder.supabase.co",
            key || "placeholder"
        );
    }

    return createBrowserClient(url, key);
}
