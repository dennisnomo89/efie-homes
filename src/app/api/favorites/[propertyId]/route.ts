import { prisma } from "@/lib/prisma";
import { guard, ok } from "@/lib/api";

type Ctx = { params: Promise<{ propertyId: string }> };

/** DELETE /api/favorites/:propertyId — remove from wishlist (idempotent). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const g = await guard();
  if (g.response) return g.response;
  const { propertyId } = await params;

  await prisma.savedProperty.deleteMany({ where: { userId: g.session.sub, propertyId } });
  return ok({ saved: false });
}
