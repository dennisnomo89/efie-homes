import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { adminPropertySchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/properties/:id — hide/unhide or feature/unfeature a listing (admins only). */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard(["ADMIN"]);
  if (g.response) return g.response;
  const { id } = await params;

  const parsed = adminPropertySchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const exists = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return fail("Property not found.", 404);

  const data = parsed.data;
  const property = await prisma.property.update({
    where: { id },
    // A hidden listing can't stay featured.
    data: { ...data, ...(data.isHidden ? { isFeatured: false } : {}) },
    select: { id: true, title: true, isHidden: true, isFeatured: true },
  });
  return ok({ property });
}
