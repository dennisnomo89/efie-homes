import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * When the server runs with EMAIL_OUTBOX_DIR set (and no RESEND_API_KEY), every email it "sends"
 * is written there as JSON. Email tests read them back from the same folder.
 */
export const OUTBOX_DIR = process.env.EMAIL_OUTBOX_DIR?.trim() || "";
export const outboxEnabled = Boolean(OUTBOX_DIR);

export type OutboxEmail = { to: string; subject: string; text: string; html: string; replyTo?: string; createdAt: string };

async function readAll(): Promise<OutboxEmail[]> {
  const dir = path.resolve(OUTBOX_DIR);
  const files = await readdir(dir).catch(() => [] as string[]);
  const emails = await Promise.all(
    files.filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as OutboxEmail),
  );
  return emails.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Emails to `to` created after `since`, optionally only those whose subject contains `subject`.
 * Emails are sent just after the HTTP response, so this polls briefly.
 */
export async function waitForEmails(to: string, since: Date, count = 1, timeoutMs = 10_000, subject?: string): Promise<OutboxEmail[]> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = (await readAll()).filter(
      (e) => e.to === to && new Date(e.createdAt) >= since && (!subject || e.subject.includes(subject)),
    );
    if (found.length >= count || Date.now() > deadline) return found;
    await new Promise((r) => setTimeout(r, 200));
  }
}
