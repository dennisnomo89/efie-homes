import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { savedSearchUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

async function ownSearch(id: string, userId: string) {
  const s = await prisma.savedSearch.findUnique({ where: { id }, select: { userId: true } });
  return s && s.userId === userId;
}

/** PATCH /api/saved-searches/:id — rename or turn email alerts on/off. */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;
  const { id } = await params;
  if (!(await ownSearch(id, g.session.sub))) return fail("Saved search not found.", 404);

  const parsed = savedSearchUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const search = await prisma.savedSearch.update({ where: { id }, data: parsed.data });
  return ok({ search });
}

/** DELETE /api/saved-searches/:id */
export async function DELETE(_req: Request, { params }: Ctx) {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;
  const { id } = await params;
  if (!(await ownSearch(id, g.session.sub))) return fail("Saved search not found.", 404);

  await prisma.savedSearch.delete({ where: { id } });
  return ok({ success: true });
}
