import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/saved-searches/:id/open — marks the results as seen (resets "N new") and shows them. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await getSession();
  const search = await prisma.savedSearch.findUnique({ where: { id }, select: { userId: true, query: true } });

  if (!search) return NextResponse.redirect(new URL("/properties", req.url));
  if (session?.sub === search.userId) {
    await prisma.savedSearch.update({ where: { id }, data: { lastSeenAt: new Date() } });
  }
  return NextResponse.redirect(new URL(`/properties${search.query ? `?${search.query}` : ""}`, req.url));
}
