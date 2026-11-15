import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { AUTH_COOKIE, SESSION_MAX_AGE, signToken, verifyToken, type SessionPayload } from "./jwt";
import type { Role } from "./constants";

/**
 * The current session, or null. Besides checking the token's signature, this confirms the account
 * still exists and the token hasn't been revoked (sessionVersion), and takes the role from the
 * database so role changes apply immediately. Cached for the duration of one request.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifyToken(token);
  if (!claims) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { role: true, name: true, email: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== claims.sv) return null;
  return { sub: claims.sub, role: user.role as Role, name: user.name, email: user.email, sv: user.sessionVersion };
});

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isVerified: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.sub }, select: publicUserSelect });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For server components: returns the user or redirects to login. */
export async function requireUser(roles?: Role[], nextPath = "/dashboard"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    // A cookie that no longer works (revoked or account deleted) must be cleared first,
    // otherwise the middleware keeps treating the visitor as logged in.
    const hasCookie = Boolean((await cookies()).get(AUTH_COOKIE));
    const next = encodeURIComponent(nextPath);
    redirect(hasCookie ? `/api/auth/session-expired?next=${next}` : `/login?next=${next}`);
  }
  if (roles && !roles.includes(user.role as Role)) redirect("/dashboard");
  return user;
}

export async function createSession(user: { id: string; role: string; name: string; email: string; sessionVersion: number }) {
  const token = await signToken({ sub: user.id, role: user.role as Role, name: user.name, email: user.email, sv: user.sessionVersion });
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

/** Invalidates every existing session for the user. Returns the new version. */
export async function revokeAllSessions(userId: string): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return updated.sessionVersion;
}
