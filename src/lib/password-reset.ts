import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const RESET_TOKEN_MINUTES = 60;
/** Max reset emails per account per hour, to stop someone flooding an inbox. */
export const RESET_REQUESTS_PER_HOUR = 3;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a reset token for the user and returns the raw value (only ever sent by email).
 * Returns null when the hourly limit has been reached.
 */
export async function createResetToken(userId: string): Promise<string | null> {
  const token = randomBytes(32).toString("base64url");
  return prisma.$transaction(async (tx) => {
    // Serialise requests for the same account so simultaneous requests can't all pass the limit check.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const recent = await tx.passwordResetToken.count({
      where: { userId, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= RESET_REQUESTS_PER_HOUR) return null;
    await tx.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
      },
    });
    return token;
  });
}

export type ResetOutcome = { ok: true; email: string } | { ok: false; reason: "invalid" | "expired" | "used" };

/** Sets a new password if the token is valid, then invalidates every outstanding token for that user. */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<ResetOutcome> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!record) return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date();
  // Claim the token atomically so two simultaneous submissions can't both succeed.
  const claimed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now } });
    if (count === 0) return false;
    // New password + new session version: every device that was logged in is signed out.
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    await tx.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } });
    return true;
  });
  if (!claimed) return { ok: false, reason: "used" };
  return { ok: true, email: record.user.email };
}
