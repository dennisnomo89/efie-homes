import { createHmac, timingSafeEqual } from "node:crypto";

/** At most one wishlist email per saved home in this period. */
export const WISHLIST_ALERT_THROTTLE_MS = 24 * 60 * 60 * 1000;

/* ---------- One-click "stop wishlist emails" links ---------- */

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET is missing or too short");
  return s;
}

export function wishlistUnsubscribeToken(userId: string): string {
  return createHmac("sha256", secret()).update(`wishlist-alerts:${userId}`).digest("base64url").slice(0, 32);
}

export function verifyWishlistUnsubscribeToken(userId: string, token: string): boolean {
  const expected = Buffer.from(wishlistUnsubscribeToken(userId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
