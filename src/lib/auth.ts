import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { AUTH_COOKIE, SESSION_MAX_AGE, signToken, verifyToken, type SessionPayload } from "./jwt";
import type { Role } from "./constants";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

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

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.sub }, select: publicUserSelect });
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For server components: returns the user or redirects to login. */
export async function requireUser(roles?: Role[], nextPath = "/dashboard"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (roles && !roles.includes(user.role as Role)) redirect("/dashboard");
  return user;
}

export async function createSession(user: { id: string; role: string; name: string; email: string }) {
  const token = await signToken({ sub: user.id, role: user.role as Role, name: user.name, email: user.email });
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
