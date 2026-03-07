import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthenticatedUser } from "@/lib/api-auth";

export async function POST() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = createServiceRoleClient();

        const { data: activeTrades, error: checkError } = await supabaseAdmin
            .from("trades")
            .select("id")
            .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .not("status", "in", '("COMPLETED","CANCELLED")')
            .limit(1);

        if (checkError) {
            console.error("Error checking active trades:", checkError);
            return NextResponse.json({ error: "Failed to validate active trades" }, { status: 500 });
        }

        if (activeTrades && activeTrades.length > 0) {
            return NextResponse.json(
                {
                    error:
                        "You have active trades. Complete or cancel all trades before deleting your account.",
                },
                { status: 400 }
            );
        }

        const { error: deletionError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deletionError) {
            console.error("Failed to delete user:", deletionError);
            return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Account deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
