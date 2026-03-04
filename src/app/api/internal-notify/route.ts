import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotificationEmail } from "@/lib/mailer";

// Create a Supabase admin client with the service role key to bypass RLS and read auth/user data
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function POST(req: NextRequest) {
    try {
        const { targetUserId, eventType, tradeId } = await req.json();

        if (!targetUserId || !eventType) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // 1. Fetch the target user's email using Admin API
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

        if (userError || !user || !user.email) {
            // We ignore errors if user has no email or is not found (perhaps deleted)
            console.error(`Could not fetch email for user ${targetUserId}:`, userError?.message);
            return NextResponse.json({ success: false, reason: "User or email not found" });
        }

        const email = user.email;

        // 2. Build the email content based on eventType
        let subject = "";
        let title = "";
        let contentHtml = "";
        const tradeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/trade/${tradeId || ''}`;
        let actionLabel = "取引画面を見る";

        switch (eventType) {
            case "NEW_PROPOSAL":
                subject = "【スワコレ】新しいトレードの提案が届きました！";
                title = "新しい提案のお知らせ";
                contentHtml = `<p>あなたの出品アイテムに対して、新しい交換の提案が届いています。</p>
                               <p>内容を確認し、承諾するかお断りするかを選択してください。</p>`;
                break;
            case "PROPOSAL_ACCEPTED":
                subject = "【スワコレ】提案が承諾されました！";
                title = "取引成立（デポジット待機）";
                contentHtml = `<p>あなたの提案が相手に承諾されました。</p>
                               <p>取引を安全に開始するため、取引画面からデポジット（預かり金）の手続きに進んでください。</p>`;
                break;
            case "DISPUTE_OPENED":
                subject = "【スワコレ】取引について問題が報告されました";
                title = "トラブル報告のお知らせ";
                contentHtml = `<p>現在進行中の取引について、相手から問題の報告がありました。</p>
                               <p>取引画面のメッセージ機能を使って、相手と状況を確認し合ってください。</p>`;
                break;
            case "NEW_MESSAGE":
                subject = "【スワコレ】取引メッセージが届きました";
                title = "新着メッセージ";
                contentHtml = `<p>取引相手から新しいメッセージが届いています。</p>`;
                break;
            default:
                return NextResponse.json({ error: "Unknown eventType" }, { status: 400 });
        }

        // 3. Send email via internal mailer utility (Resend)
        const sendResult = await sendNotificationEmail({
            to: email,
            subject,
            textPreview: title,
            title,
            contentHtml,
            actionLabel,
            actionUrl: tradeUrl,
        });

        if (!sendResult.success) {
            throw new Error(sendResult.error?.message || "Failed to send email");
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Internal Notification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
