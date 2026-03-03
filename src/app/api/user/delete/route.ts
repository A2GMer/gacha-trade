import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Using Service Role Key to bypass RLS for user deletion
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function POST(req: NextRequest) {
    try {
        // Authenticate the user requesting deletion
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;

        // Validation: Check if the user has any active trades
        const { data: activeTrades, error: checkError } = await supabaseAdmin
            .from("trades")
            .select("id")
            .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
            .not("status", "in", '("COMPLETED","CANCELLED")')
            .limit(1);

        if (checkError) {
            console.error("Error checking active trades:", checkError);
            return NextResponse.json({ error: "確認処理に失敗しました。" }, { status: 500 });
        }

        if (activeTrades && activeTrades.length > 0) {
            return NextResponse.json({
                error: "現在進行中の取引があるため、退会できません。すべての取引を完了させるかキャンセルしてください。"
            }, { status: 400 });
        }

        // If validation passes, we can proceed to delete the user.
        // We will delete the auth user. Because of database constraints (e.g. CASCADE in typical settings), 
        // their profile, items, and address records will either be deleted or they will be orphaned.
        // We will call admin.deleteUser to remove them from Auth.

        const { error: deletionError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deletionError) {
            console.error("Failed to delete user:", deletionError);
            return NextResponse.json({ error: "アカウントの削除に失敗しました。" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Account deleted successfully." });

    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
    }
}
