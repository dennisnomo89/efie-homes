import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

/*
 * First gate for dashboards and the login/sign-up pages (Next.js 16 proxy, Node.js runtime).
 * It reads the account from the database, so revoked sessions are rejected and role changes apply
 * immediately. Pages repeat the role check (requireUser) as a second layer.
 */

const HOME: Record<string, string> = {
  TENANT: "/dashboard/tenant",
  LANDLORD: "/dashboard/landlord",
  ADMIN: "/dashboard/admin",
};

/** Which roles may open each dashboard area. */
const AREAS: [prefix: string, roles: string[]][] = [
  ["/dashboard/admin", ["ADMIN"]],
  ["/dashboard/landlord", ["LANDLORD", "ADMIN"]],
  ["/dashboard/tenant", ["TENANT", "ADMIN"]],
];

async function liveRole(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const claims = await verifyToken(token);
  if (!claims) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { role: true, sessionVersion: true } });
  if (!user || user.sessionVersion !== claims.sv) return null; // deleted account or revoked session
  return user.role;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const role = await liveRole(token);

  const withClearedCookie = (res: NextResponse) => {
    if (token && !role) res.cookies.delete(AUTH_COOKIE); // drop expired, tampered or revoked cookies
    return res;
  };

  // Logged-in users don't need the auth pages.
  if (pathname === "/login" || pathname === "/register") {
    if (role) return NextResponse.redirect(new URL(HOME[role] ?? "/dashboard/tenant", req.url));
    return withClearedCookie(NextResponse.next());
  }

  // Everything below is a protected dashboard route.
  if (!role) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + search);
    return withClearedCookie(NextResponse.redirect(login));
  }

  const home = HOME[role] ?? "/dashboard/tenant";
  if (pathname === "/dashboard") return NextResponse.redirect(new URL(home, req.url));
  const area = AREAS.find(([prefix]) => pathname.startsWith(prefix));
  if (area && !area[1].includes(role)) return NextResponse.redirect(new URL(home, req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
