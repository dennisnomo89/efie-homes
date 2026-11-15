import { prisma } from "./prisma";

/*
 * Database-backed rate limiting, so limits hold across every serverless instance.
 * Each counted attempt is a row in RateLimitHit; a limit is "at most N hits for this key in the window".
 */

export type Limit = { key: string; max: number; windowMs: number };

export type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

const MINUTE = 60_000;

/** The limits used across the app. Keys are namespaced so they never collide. */
export const LIMITS = {
  /** Failed logins for one account (any network). */
  loginEmail: (email: string): Limit => ({ key: `login:email:${email}`, max: 10, windowMs: 15 * MINUTE }),
  /** Failed logins from one network address (any account). */
  loginIp: (ip: string): Limit => ({ key: `login:ip:${ip}`, max: 30, windowMs: 15 * MINUTE }),
  /** New accounts from one network address. */
  registerIp: (ip: string): Limit => ({ key: `register:ip:${ip}`, max: 10, windowMs: 60 * MINUTE }),
  /** "Forgot password" requests from one network address (each account is also limited to 3/hour). */
  forgotIp: (ip: string): Limit => ({ key: `forgot:ip:${ip}`, max: 10, windowMs: 60 * MINUTE }),
  /** Password reset submissions from one network address. */
  resetIp: (ip: string): Limit => ({ key: `reset:ip:${ip}`, max: 20, windowMs: 15 * MINUTE }),
};

/** Has this key reached its limit? Does not record anything. */
export async function checkLimit(limit: Limit): Promise<LimitResult> {
  const since = new Date(Date.now() - limit.windowMs);
  const hits = await prisma.rateLimitHit.findMany({
    where: { key: limit.key, createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
    take: limit.max,
  });
  if (hits.length < limit.max) return { ok: true };
  // The oldest hit in the window decides when a slot frees up.
  const freesAt = hits[0].createdAt.getTime() + limit.windowMs;
  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((freesAt - Date.now()) / 1000)) };
}

/** Checks several limits at once; returns the longest wait if any is exceeded. */
export async function checkLimits(limits: Limit[]): Promise<LimitResult> {
  const results = await Promise.all(limits.map(checkLimit));
  const blocked = results.filter((r): r is { ok: false; retryAfterSeconds: number } => !r.ok);
  if (blocked.length === 0) return { ok: true };
  return { ok: false, retryAfterSeconds: Math.max(...blocked.map((b) => b.retryAfterSeconds)) };
}

/** Records one attempt against each key, and occasionally prunes rows older than a day. */
export async function recordHits(keys: string[]): Promise<void> {
  await prisma.rateLimitHit.createMany({ data: keys.map((key) => ({ key })) });
  if (Math.random() < 0.02) {
    await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * MINUTE) } } });
  }
}

/** Clears an account's failed-login count after a successful login. */
export async function clearKey(key: string): Promise<void> {
  await prisma.rateLimitHit.deleteMany({ where: { key } });
}

/**
 * The visitor's network address. On Vercel, x-real-ip / x-forwarded-for are set by the platform
 * (client-supplied values are not passed through), so they can be trusted there.
 */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

