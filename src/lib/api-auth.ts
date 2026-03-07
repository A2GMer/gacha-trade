import { createClient, type User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}

export function createServiceRoleClient() {
    const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export async function getAuthenticatedUser(): Promise<User | null> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }
    return user;
}

export async function isAdminUser(userId: string): Promise<boolean> {
    const supabaseAdmin = createServiceRoleClient();
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

    if (error || !data) {
        return false;
    }
    return data.role === "admin";
}

export function validateCronRequest(request: Request):
    | { ok: true }
    | { ok: false; status: number; error: string } {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return { ok: false, status: 500, error: "CRON_SECRET is not configured" };
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
        return { ok: false, status: 401, error: "Unauthorized" };
    }

    return { ok: true };
}


export function validateSameOrigin(request: Request):
    | { ok: true }
    | { ok: false; status: number; error: string } {
    const origin = request.headers.get("origin");
    if (!origin) {
        return { ok: false, status: 403, error: "Missing Origin header" };
    }

    let originUrl: URL;
    try {
        originUrl = new URL(origin);
    } catch {
        return { ok: false, status: 400, error: "Invalid Origin header" };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
        try {
            const expectedOrigin = new URL(siteUrl).origin;
            if (originUrl.origin !== expectedOrigin) {
                return { ok: false, status: 403, error: "Cross-site request blocked" };
            }
            return { ok: true };
        } catch {
            return { ok: false, status: 500, error: "NEXT_PUBLIC_SITE_URL is invalid" };
        }
    }

    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (!host) {
        return { ok: false, status: 500, error: "Unable to validate request origin" };
    }

    const expectedOrigin = `${proto}://${host}`;
    if (originUrl.origin !== expectedOrigin) {
        return { ok: false, status: 403, error: "Cross-site request blocked" };
    }

    return { ok: true };
}
