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
