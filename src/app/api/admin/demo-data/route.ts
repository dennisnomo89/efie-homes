import { prisma } from "@/lib/prisma";
import { guard, ok } from "@/lib/api";
import { DEMO_EMAIL_DOMAIN } from "@/lib/constants";

/** Demo accounts are the seeded @efiehomes.test users, never the admin running the cleanup. */
function demoWhere(currentUserId: string) {
  return { email: { endsWith: DEMO_EMAIL_DOMAIN }, id: { not: currentUserId } };
}

async function summary(currentUserId: string) {
  const where = demoWhere(currentUserId);
  const [accounts, listings, viewings] = await Promise.all([
    prisma.user.count({ where }),
    prisma.property.count({ where: { landlord: where } }),
    prisma.viewingRequest.count({ where: { OR: [{ tenant: where }, { property: { landlord: where } }] } }),
  ]);
  return { accounts, listings, viewings };
}

/** GET /api/admin/demo-data — preview what a cleanup would delete. */
export async function GET() {
  const g = await guard(["ADMIN"]);
  if (g.response) return g.response;
  return ok(await summary(g.session.sub));
}

/** DELETE /api/admin/demo-data — permanently delete demo accounts and everything attached to them. */
export async function DELETE() {
  const g = await guard(["ADMIN"]);
  if (g.response) return g.response;

  const before = await summary(g.session.sub);
  // Listings, viewing requests and saved homes cascade from the user rows.
  const { count } = await prisma.user.deleteMany({ where: demoWhere(g.session.sub) });
  return ok({ deleted: { ...before, accounts: count } });
}
