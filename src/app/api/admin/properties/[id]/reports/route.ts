import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { reportDecisionSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/properties/:id/reports — close every open report on a listing:
 * { status: "RESOLVED" (action taken, e.g. listing hidden) | "DISMISSED" (nothing wrong), adminNote? }.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard(["ADMIN"]);
  if (g.response) return g.response;
  const { id } = await params;

  const parsed = reportDecisionSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const exists = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return fail("Property not found.", 404);

  const { count } = await prisma.listingReport.updateMany({
    where: { propertyId: id, status: "OPEN" },
    data: { status: parsed.data.status, adminNote: parsed.data.adminNote || null, resolvedAt: new Date() },
  });
  if (count === 0) return fail("This listing has no open reports.", 409);
  return ok({ closed: count });
}
