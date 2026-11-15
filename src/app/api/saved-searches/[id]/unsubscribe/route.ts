import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/saved-searches";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/saved-searches/:id/unsubscribe?token=… — one-click "stop these emails" from an alert.
 * Works without logging in; the signed token proves the link came from our email.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const done = new URL("/unsubscribed", req.url);

  if (!verifyUnsubscribeToken(id, token)) {
    done.searchParams.set("status", "invalid");
    return NextResponse.redirect(done);
  }
  const { count } = await prisma.savedSearch.updateMany({ where: { id }, data: { emailAlerts: false } });
  done.searchParams.set("status", count ? "ok" : "gone");
  return NextResponse.redirect(done);
}

/** POST — RFC 8058 one-click unsubscribe, sent by mail providers (Gmail, Outlook) from their own button. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!verifyUnsubscribeToken(id, token)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await prisma.savedSearch.updateMany({ where: { id }, data: { emailAlerts: false } });
  return NextResponse.json({ ok: true });
}
