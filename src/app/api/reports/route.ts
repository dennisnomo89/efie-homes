import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, tooManyAttempts, validationFailed } from "@/lib/api";
import { notifyListingReported } from "@/lib/notifications";
import { checkLimit, LIMITS, recordHits } from "@/lib/rate-limit";
import { listingReportSchema } from "@/lib/validations";

/**
 * POST /api/reports — any signed-in user (except the listing's own landlord) reports a listing.
 * One report per person per listing: a second report while the first is open is refused;
 * reporting again after admins closed it reopens it with the new reason.
 */
export async function POST(req: Request) {
  const g = await guard();
  if (g.response) return g.response;
  const userId = g.session.sub;

  const parsed = listingReportSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const { propertyId, reason, details } = parsed.data;

  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { landlordId: true, isHidden: true } });
  if (!property || property.isHidden) return fail("Listing not found.", 404);
  if (property.landlordId === userId) return fail("You can't report your own listing.", 403);

  const existing = await prisma.listingReport.findUnique({
    where: { propertyId_reporterId: { propertyId, reporterId: userId } },
    select: { status: true },
  });
  if (existing?.status === "OPEN") return fail("You've already reported this listing. Our team is looking into it.", 409);

  const limit = LIMITS.reportUser(userId);
  const check = await checkLimit(limit);
  if (!check.ok) return tooManyAttempts(check.retryAfterSeconds, "reports");

  const data = { reason, details, status: "OPEN", adminNote: null, resolvedAt: null };
  try {
    const report = await prisma.listingReport.upsert({
      where: { propertyId_reporterId: { propertyId, reporterId: userId } },
      create: { propertyId, reporterId: userId, ...data },
      update: data,
      select: { id: true, reason: true, details: true, status: true, createdAt: true },
    });
    await recordHits([limit.key]);
    after(() => notifyListingReported(report.id));
    return ok({ report }, 201);
  } catch (err) {
    // Two simultaneous first reports from the same person: the unique key stops the second.
    if ((err as { code?: string }).code === "P2002") return fail("You've already reported this listing. Our team is looking into it.", 409);
    throw err;
  }
}
