import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWishlistUnsubscribeToken } from "@/lib/wishlist-alerts";

function params(req: NextRequest) {
  return { userId: req.nextUrl.searchParams.get("u") ?? "", token: req.nextUrl.searchParams.get("token") ?? "" };
}

/**
 * GET /api/wishlist-alerts/unsubscribe?u=…&token=… — one-click "stop wishlist emails" from a price-drop email.
 * Works without logging in; the signed token proves the link came from our email.
 */
export async function GET(req: NextRequest) {
  const { userId, token } = params(req);
  const done = new URL("/unsubscribed", req.url);
  done.searchParams.set("kind", "wishlist");
  if (!userId || !verifyWishlistUnsubscribeToken(userId, token)) {
    done.searchParams.set("status", "invalid");
    return NextResponse.redirect(done);
  }
  const { count } = await prisma.user.updateMany({ where: { id: userId }, data: { wishlistAlerts: false } });
  done.searchParams.set("status", count ? "ok" : "gone");
  return NextResponse.redirect(done);
}

/** POST — RFC 8058 one-click unsubscribe, sent by mail providers (Gmail, Outlook) from their own button. */
export async function POST(req: NextRequest) {
  const { userId, token } = params(req);
  if (!userId || !verifyWishlistUnsubscribeToken(userId, token)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await prisma.user.updateMany({ where: { id: userId }, data: { wishlistAlerts: false } });
  return NextResponse.json({ ok: true });
}
