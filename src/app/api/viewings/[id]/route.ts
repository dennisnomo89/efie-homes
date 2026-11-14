import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { viewingStatusSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/viewings/:id — the property's landlord confirms or declines. */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard(["LANDLORD", "ADMIN"]);
  if (g.response) return g.response;
  const { id } = await params;

  const viewing = await prisma.viewingRequest.findUnique({
    where: { id },
    include: { property: { select: { landlordId: true } } },
  });
  if (!viewing) return fail("Viewing request not found.", 404);
  if (viewing.property.landlordId !== g.session.sub && g.session.role !== "ADMIN") {
    return fail("You can only respond to requests for your own listings.", 403);
  }

  const parsed = viewingStatusSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const updated = await prisma.viewingRequest.update({
    where: { id },
    data: { status: parsed.data.status, landlordNote: parsed.data.landlordNote || null },
  });
  return ok({ viewing: updated });
}

/** DELETE /api/viewings/:id — a tenant withdraws a request that is still pending. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const g = await guard(["TENANT", "ADMIN"]);
  if (g.response) return g.response;
  const { id } = await params;

  const viewing = await prisma.viewingRequest.findUnique({ where: { id }, select: { tenantId: true, status: true } });
  if (!viewing) return fail("Viewing request not found.", 404);
  if (viewing.tenantId !== g.session.sub && g.session.role !== "ADMIN") {
    return fail("You can only cancel your own requests.", 403);
  }
  if (viewing.status !== "PENDING") return fail("Only pending requests can be cancelled.", 409);

  await prisma.viewingRequest.delete({ where: { id } });
  return ok({ success: true });
}
