import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { ok: boolean; transport: "resend" | "outbox" | "log"; error?: string };

/** Public base URL used in email links. */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

/**
 * Sends an email. Never throws: emails are best-effort and must not break the request that triggered them.
 *
 * Transport, in order of preference:
 *  1. RESEND_API_KEY set     → sent through Resend (https://resend.com)
 *  2. EMAIL_OUTBOX_DIR set   → written as a JSON file (used by tests and local development)
 *  3. otherwise              → only logged (body included outside production)
 */
export async function sendEmail(email: Email): Promise<SendResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (apiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM?.trim() || "Efie Homes <onboarding@resend.dev>",
          to: [email.to],
          subject: email.subject,
          html: email.html,
          text: email.text,
          ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        }),
      });
      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 300);
        console.error(`[email] Resend rejected "${email.subject}" (${res.status}): ${detail}`);
        return { ok: false, transport: "resend", error: `HTTP ${res.status}` };
      }
      return { ok: true, transport: "resend" };
    }

    const outbox = process.env.EMAIL_OUTBOX_DIR?.trim();
    if (outbox) {
      const dir = path.resolve(/* turbopackIgnore: true */ outbox);
      await mkdir(dir, { recursive: true });
      const file = path.join(/* turbopackIgnore: true */ dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
      await writeFile(file, JSON.stringify({ ...email, createdAt: new Date().toISOString() }, null, 2));
      return { ok: true, transport: "outbox" };
    }

    if (process.env.NODE_ENV === "production") {
      // Don't write message bodies (which can contain reset links) to production logs.
      console.warn(`[email] RESEND_API_KEY is not set; not sending "${email.subject}".`);
    } else {
      console.info(`[email] (not sent, no RESEND_API_KEY)\n  To: ${email.to}\n  Subject: ${email.subject}\n\n${email.text}\n`);
    }
    return { ok: false, transport: "log", error: "No email transport configured" };
  } catch (err) {
    console.error(`[email] Failed to send "${email.subject}":`, err instanceof Error ? err.message : err);
    return { ok: false, transport: "log", error: "Send failed" };
  }
}
