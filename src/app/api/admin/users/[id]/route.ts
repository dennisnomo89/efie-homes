import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { adminUserSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/:id — verify or unverify a landlord/agent (admins only). */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard(["ADMIN"]);
  if (g.response) return g.response;
  const { id } = await params;

  const parsed = adminUserSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) return fail("User not found.", 404);
  if (user.role !== "LANDLORD") return fail("Only landlord/agent accounts can be verified.", 422);

  const updated = await prisma.user.update({
    where: { id },
    data: { isVerified: parsed.data.isVerified },
    select: { id: true, name: true, isVerified: true },
  });
  return ok({ user: updated });
}
