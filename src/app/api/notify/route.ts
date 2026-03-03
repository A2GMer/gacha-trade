import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_key_for_build");

// We will send from a verified domain or onboarding domain
// If no domain is verified yet, Resend allows sending to the registered onboarding email address.
const FROM_EMAIL = 'Gacha Trade <noreply@resend.dev>';

export async function POST(req: NextRequest) {
    try {
        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Resend API Error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Failed to send email:", error);
        return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
    }
}
