import { Resend } from "resend";

interface SendMailParams {
    to: string;
    subject: string;
    textPreview: string;
    title: string;
    contentHtml: string;
    actionLabel?: string;
    actionUrl?: string;
}

export async function sendNotificationEmail(params: SendMailParams) {
    if (typeof window !== "undefined") {
        throw new Error("sendNotificationEmail must run on the server.");
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return {
            success: false,
            error: { message: "RESEND_API_KEY is not configured" },
        };
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Gacha Trade <noreply@resend.dev>";

    const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${params.subject}</title>
    </head>
    <body style="font-family: sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #2F327D; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Gacha Trade</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="font-size: 18px; color: #2F327D; margin-top: 0;">${params.title}</h2>
                <div style="font-size: 14px; line-height: 1.6; color: #444;">
                    ${params.contentHtml}
                </div>
                ${params.actionUrl ? `
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${params.actionUrl}" style="background-color: #F8B400; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold; display: inline-block;">
                        ${params.actionLabel || "Open"}
                    </a>
                </div>
                ` : ""}
            </div>
            <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 11px; color: #888;">
                <p style="margin: 0;">This email was sent automatically.</p>
                <p style="margin: 5px 0 0;">Gacha Trade Team</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: params.to,
        subject: params.subject,
        html,
    });

    if (error) {
        console.error("Resend delivery failed:", error);
        return { success: false, error };
    }

    return { success: true, data };
}
