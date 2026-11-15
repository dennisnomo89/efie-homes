import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { toView } from "@/lib/properties";
import { favoriteSchema } from "@/lib/validations";

/** GET /api/favorites — the current user's wishlist. */
export async function GET() {
  const g = await guard();
  if (g.response) return g.response;

  const saved = await prisma.savedProperty.findMany({
    where: { userId: g.session.sub },
    orderBy: { createdAt: "desc" },
    include: { property: true },
  });
  return ok({ favorites: saved.map((s) => ({ ...s, property: toView(s.property) })) });
}

/** POST /api/favorites — save a property (idempotent). */
export async function POST(req: Request) {
  const g = await guard(["TENANT", "ADMIN"]);
  if (g.response) return g.response;

  const parsed = favoriteSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const exists = await prisma.property.findUnique({ where: { id: parsed.data.propertyId }, select: { id: true, isHidden: true } });
  if (!exists || exists.isHidden) return fail("Property not found.", 404);

  const saved = await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: g.session.sub, propertyId: parsed.data.propertyId } },
    update: {},
    create: { userId: g.session.sub, propertyId: parsed.data.propertyId },
  });
  return ok({ saved: true, id: saved.id }, 201);
}
