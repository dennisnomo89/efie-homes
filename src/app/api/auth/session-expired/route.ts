import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/jwt";

/** GET /api/auth/session-expired?next=/path — clears a revoked session cookie and sends the visitor to log in. */
export function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  const login = new URL("/login", req.url);
  login.searchParams.set("next", next);
  const res = NextResponse.redirect(login);
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
