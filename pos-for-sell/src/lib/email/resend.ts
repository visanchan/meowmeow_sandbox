import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("[resend] missing RESEND_API_KEY in env");
  }
  cached = new Resend(key);
  return cached;
}

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

export async function sendEmail(args: SendEmailArgs) {
  const from =
    args.from ??
    process.env.EMAIL_FROM ??
    "Cat Booth POS <onboarding@resend.dev>";

  const resend = getResend();
  const result = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    replyTo: args.replyTo,
  });

  if (result.error) {
    throw new Error(`[resend] send failed: ${result.error.message}`);
  }
  return result.data;
}

export function adminEmail(): string {
  const v = process.env.ADMIN_EMAIL;
  if (!v) throw new Error("[resend] missing ADMIN_EMAIL in env");
  return v;
}
