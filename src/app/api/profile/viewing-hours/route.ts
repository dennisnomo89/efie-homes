import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { guard, ok, readJson, validationFailed } from "@/lib/api";
import { parseHours } from "@/lib/viewing-hours";
import { viewingHoursSchema } from "@/lib/validations";

/** GET /api/profile/viewing-hours — your viewing hours (landlords). null = any listed time. */
export async function GET() {
  const g = await guard(["LANDLORD", "ADMIN"]);
  if (g.response) return g.response;
  const user = await prisma.user.findUnique({ where: { id: g.session.sub }, select: { viewingHours: true } });
  return ok({ hours: parseHours(user?.viewingHours) });
}

/** PUT /api/profile/viewing-hours — { hours: { "0".."6": ["09:00", ...] } } or { hours: null } for any listed time. */
export async function PUT(req: Request) {
  const g = await guard(["LANDLORD", "ADMIN"]);
  if (g.response) return g.response;
  const parsed = viewingHoursSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const hours = parsed.data.hours === null ? null : parseHours(parsed.data.hours);
  await prisma.user.update({ where: { id: g.session.sub }, data: { viewingHours: hours ?? Prisma.DbNull } });
  return ok({ hours });
}
