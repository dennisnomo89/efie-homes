import { prisma } from "./prisma";

/* In-app notifications: the bell in the navbar. Created next to each email, so people hear about things
 * even when email isn't set up or lands in spam. Like the emails, these never throw. */

export type NotificationType =
  | "VIEWING_REQUESTED"
  | "VIEWING_ANSWERED"
  | "VIEWING_CANCELLED"
  | "NEW_MESSAGE"
  | "REVIEW_RECEIVED"
  | "PRICE_DROP"
  | "BACK_ON_MARKET"
  | "SEARCH_MATCH"
  | "LISTING_REPORTED";

export type NewNotification = { type: NotificationType; title: string; body?: string | null; url: string };

/** The bell shows this many; older ones are still in the database until pruned. */
export const INBOX_SIZE = 20;
/** Read notifications older than this are deleted now and then. */
const KEEP_READ_MS = 90 * 24 * 60 * 60 * 1000;
const BODY_MAX = 200;

const clip = (s: string | null | undefined) => (s ? (s.length > BODY_MAX ? `${s.slice(0, BODY_MAX - 1).trimEnd()}…` : s) : null);

/**
 * Adds a notification for each user.
 * `collapse`: if the user already has an unread one of this type for the same link (e.g. a busy message thread),
 * refresh it and move it to the top instead of adding another.
 */
export async function pushNotification(userIds: string | string[], n: NewNotification, opts: { collapse?: boolean } = {}): Promise<void> {
  const ids = [...new Set(Array.isArray(userIds) ? userIds : [userIds])];
  try {
    for (const userId of ids) {
      const data = { type: n.type, title: n.title, body: clip(n.body), url: n.url };
      if (opts.collapse) {
        const { count } = await prisma.notification.updateMany({
          where: { userId, type: n.type, url: n.url, readAt: null },
          data: { ...data, createdAt: new Date() },
        });
        if (count > 0) continue;
      }
      await prisma.notification.create({ data: { ...data, userId } });
    }
    if (Math.random() < 0.02) {
      await prisma.notification.deleteMany({ where: { readAt: { lt: new Date(Date.now() - KEEP_READ_MS) } } });
    }
  } catch (err) {
    console.error("[inbox] push:", err instanceof Error ? err.message : err);
  }
}

export async function inboxFor(userId: string) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: INBOX_SIZE,
      select: { id: true, type: true, title: true, body: true, url: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unread };
}

/** Marks some (or all) of a user's notifications read. Returns how many changed. */
export async function markNotificationsRead(userId: string, ids: string[] | "all"): Promise<number> {
  const { count } = await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(ids === "all" ? {} : { id: { in: ids } }) },
    data: { readAt: new Date() },
  });
  return count;
}

/** Opening a thread (or page) clears the notifications that pointed to it. */
export async function markReadByUrl(userId: string, url: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, url, readAt: null }, data: { readAt: new Date() } }).catch(() => undefined);
}
