import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { propertySlots } from "@/lib/viewing-slots";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/properties/:id/slots?date=YYYY-MM-DD — which viewing times can be booked that day
 * (the landlord's viewing hours minus times already confirmed for this home). Shows times only, never who booked.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return fail("Pick a date (YYYY-MM-DD).", 422);

  const property = await prisma.property.findUnique({ where: { id }, select: { isHidden: true } });
  if (!property || property.isHidden) return fail("Property not found.", 404);

  const picture = await propertySlots(id, date);
  const res = ok({ date, ...picture! });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
