import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/mailer";
import { createServiceRoleClient, getAuthenticatedUser, validateSameOrigin } from "@/lib/api-auth";

type SupportedEvent = "NEW_PROPOSAL" | "PROPOSAL_ACCEPTED" | "DISPUTE_OPENED" | "NEW_MESSAGE";

const EVENT_CONTENT: Record<SupportedEvent, { subject: string; title: string; body: string }> = {
    NEW_PROPOSAL: {
        subject: "[Gacha Trade] New proposal received",
        title: "New trade proposal",
        body: "You received a new trade proposal. Open the trade room to review the details.",
    },
    PROPOSAL_ACCEPTED: {
        subject: "[Gacha Trade] Proposal accepted",
        title: "Your proposal was accepted",
        body: "Your trade proposal was accepted. Please proceed with the next steps.",
    },
    DISPUTE_OPENED: {
        subject: "[Gacha Trade] Dispute opened",
        title: "A dispute was opened",
        body: "A dispute was opened for this trade. Please check the trade room and respond.",
    },
    NEW_MESSAGE: {
        subject: "[Gacha Trade] New message",
        title: "You have a new message",
        body: "There is a new message in your trade room.",
    },
};

export async function POST(req: NextRequest) {
    try {
        const originCheck = validateSameOrigin(req);
        if (!originCheck.ok) {
            return NextResponse.json({ error: originCheck.error }, { status: originCheck.status });
        }

        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetUserId, eventType, tradeId } = await req.json();
        if (!targetUserId || !eventType || !tradeId) {
            return NextResponse.json(
                { error: "targetUserId, eventType and tradeId are required" },
                { status: 400 }
            );
        }

        if (!(eventType in EVENT_CONTENT)) {
            return NextResponse.json({ error: "Unknown eventType" }, { status: 400 });
        }

        const supabaseAdmin = createServiceRoleClient();
        const { data: trade, error: tradeError } = await supabaseAdmin
            .from("trades")
            .select("id, proposer_id, receiver_id, status")
            .eq("id", tradeId)
            .maybeSingle();

        if (tradeError) {
            console.error("Failed to load trade for notification:", tradeError);
            return NextResponse.json({ error: "Failed to validate trade" }, { status: 500 });
        }

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        const isParticipant = trade.proposer_id === user.id || trade.receiver_id === user.id;
        if (!isParticipant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const partnerId = trade.proposer_id === user.id ? trade.receiver_id : trade.proposer_id;
        if (targetUserId !== partnerId) {
            return NextResponse.json({ error: "Invalid targetUserId" }, { status: 400 });
        }

        const typedEvent = eventType as SupportedEvent;
        if (typedEvent === "NEW_PROPOSAL" && trade.proposer_id !== user.id) {
            return NextResponse.json({ error: "Only proposer can send this event" }, { status: 403 });
        }
        if (typedEvent === "PROPOSAL_ACCEPTED" && trade.receiver_id !== user.id) {
            return NextResponse.json({ error: "Only receiver can send this event" }, { status: 403 });
        }

        const {
            data: { user: targetUser },
            error: userError,
        } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

        if (userError || !targetUser || !targetUser.email) {
            console.error(`Could not fetch email for user ${targetUserId}:`, userError?.message);
            return NextResponse.json({ success: false, reason: "User or email not found" });
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const tradeUrl = `${baseUrl}/trade/${tradeId}`;
        const content = EVENT_CONTENT[typedEvent];

        const sendResult = await sendNotificationEmail({
            to: targetUser.email,
            subject: content.subject,
            textPreview: content.title,
            title: content.title,
            contentHtml: `<p>${content.body}</p>`,
            actionLabel: "Open trade",
            actionUrl: tradeUrl,
        });

        if (!sendResult.success) {
            throw new Error(sendResult.error?.message || "Failed to send email");
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Internal Notification Error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
