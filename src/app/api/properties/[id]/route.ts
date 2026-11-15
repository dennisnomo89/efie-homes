import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { landlordSelect, toView } from "@/lib/properties";
import { notifyWishlistChange } from "@/lib/notifications";
import { propertySchema, propertyStatusSchema } from "@/lib/validations";
import { rentChangeFields } from "@/lib/price-drop";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: { landlord: { select: landlordSelect } },
  });
  if (!property) return fail("Property not found.", 404);
  if (property.isHidden) {
    const session = await getSession();
    const canManage = session && (session.sub === property.landlordId || session.role === "ADMIN");
    if (!canManage) return fail("Property not found.", 404);
  }
  return ok({ property: toView(property) });
}

async function loadOwned(id: string, userId: string, role: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, landlordId: true, status: true, monthlyRent: true, previousRent: true, rentReducedAt: true },
  });
  if (!property) return { response: fail("Property not found.", 404) };
  if (property.landlordId !== userId && role !== "ADMIN") {
    return { response: fail("You can only manage your own listings.", 403) };
  }
  return { property };
}

/**
 * PATCH /api/properties/:id
 * - `{ status: "RENTED" | "AVAILABLE" }` toggles availability
 * - a full property payload updates the listing
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard(["LANDLORD", "ADMIN"]);
  if (g.response) return g.response;
  const { id } = await params;
  const owned = await loadOwned(id, g.session.sub, g.session.role);
  if (owned.response) return owned.response;

  const body = await readJson(req);
  const isStatusOnly =
    body !== null && typeof body === "object" && Object.keys(body as object).length === 1 && "status" in (body as object);

  if (isStatusOnly) {
    const parsed = propertyStatusSchema.safeParse(body);
    if (!parsed.success) return validationFailed(parsed.error);
    const property = await prisma.property.update({ where: { id }, data: { status: parsed.data.status } });
    if (owned.property.status === "RENTED" && property.status === "AVAILABLE") {
      after(() => notifyWishlistChange(id, { kind: "available" }));
    }
    return ok({ property: toView(property) });
  }

  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) return validationFailed(parsed.error);
  const { images, amenities, ...data } = parsed.data;
  const before = owned.property;
  const rentFields = rentChangeFields(before, data.monthlyRent);
  const property = await prisma.property.update({
    where: { id },
    data: { ...data, ...rentFields, images: JSON.stringify(images), amenities: JSON.stringify(amenities) },
  });
  if (data.monthlyRent < before.monthlyRent) {
    after(() => notifyWishlistChange(id, { kind: "price", from: before.monthlyRent, to: data.monthlyRent }));
  } else if (before.status === "RENTED" && property.status === "AVAILABLE") {
    after(() => notifyWishlistChange(id, { kind: "available" }));
  }
  return ok({ property: toView(property) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const g = await guard(["LANDLORD", "ADMIN"]);
  if (g.response) return g.response;
  const { id } = await params;
  const owned = await loadOwned(id, g.session.sub, g.session.role);
  if (owned.response) return owned.response;

  await prisma.property.delete({ where: { id } });
  return ok({ success: true });
}
