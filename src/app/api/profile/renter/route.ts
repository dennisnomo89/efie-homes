import { prisma } from "@/lib/prisma";
import { guard, ok, readJson, validationFailed } from "@/lib/api";
import { dateToMonth, monthToDate } from "@/lib/renter";
import { renterProfileSchema } from "@/lib/validations";

const select = { occupation: true, householdSize: true, moveInFrom: true, about: true } as const;

/** The profile as the form uses it (move-in month as "YYYY-MM"). */
function view(p: { occupation: string | null; householdSize: number | null; moveInFrom: Date | null; about: string | null } | null) {
  return {
    occupation: p?.occupation ?? null,
    householdSize: p?.householdSize ?? null,
    moveInFrom: p?.moveInFrom ? dateToMonth(p.moveInFrom) : null,
    about: p?.about ?? null,
  };
}

/** GET /api/profile/renter — your own renter profile (tenants). */
export async function GET() {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;
  const profile = await prisma.renterProfile.findUnique({ where: { userId: g.session.sub }, select });
  return ok({ profile: view(profile) });
}

/**
 * PUT /api/profile/renter — save your renter profile: { occupation?, householdSize?, moveInFrom?: "YYYY-MM", about? }.
 * Clearing every field removes it. Landlords see it only on viewing requests you send them.
 */
export async function PUT(req: Request) {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;
  const parsed = renterProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const { moveInFrom, ...rest } = parsed.data;
  const data = { ...rest, moveInFrom: moveInFrom ? monthToDate(moveInFrom) : null };
  const userId = g.session.sub;

  if (!data.occupation && !data.householdSize && !data.moveInFrom && !data.about) {
    await prisma.renterProfile.deleteMany({ where: { userId } });
    return ok({ profile: view(null) });
  }
  const profile = await prisma.renterProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data, select });
  return ok({ profile: view(profile) });
}
