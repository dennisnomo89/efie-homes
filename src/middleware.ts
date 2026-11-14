import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/jwt";

const ROLE_HOME: Record<string, string> = {
  TENANT: "/dashboard/tenant",
  LANDLORD: "/dashboard/landlord",
  ADMIN: "/dashboard/landlord",
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  // Logged-in users don't need the auth pages.
  if (pathname === "/login" || pathname === "/register") {
    if (session) return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/dashboard", req.url));
    return NextResponse.next();
  }

  // Everything below is a protected dashboard route.
  if (!session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(login);
    if (token) res.cookies.delete(AUTH_COOKIE); // drop expired / tampered tokens
    return res;
  }

  if (pathname.startsWith("/dashboard/landlord") && session.role !== "LANDLORD" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/tenant", req.url));
  }
  if (pathname.startsWith("/dashboard/tenant") && session.role !== "TENANT" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/landlord", req.url));
  }
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/dashboard/tenant", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
