import { prisma } from "./prisma";

export type RatingSummary = { count: number; landlord: number; accuracy: number };

/** End of today (UTC). A viewing counts as "happened" once its date is today or earlier. */
function endOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export type ReviewEligibility =
  | { ok: true; viewing: { id: string; propertyId: string; propertyTitle: string; landlordId: string } }
  | { ok: false; status: 404 | 403 | 409 | 422; reason: string };

/** A tenant may review a viewing of theirs that was confirmed and has taken place, once. */
export async function reviewEligibility(viewingRequestId: string, tenantId: string): Promise<ReviewEligibility> {
  const v = await prisma.viewingRequest.findUnique({
    where: { id: viewingRequestId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      preferredDate: true,
      review: { select: { id: true } },
      property: { select: { id: true, title: true, landlordId: true } },
    },
  });
  if (!v) return { ok: false, status: 404, reason: "Viewing request not found." };
  if (v.tenantId !== tenantId) return { ok: false, status: 403, reason: "You can only review your own viewings." };
  if (v.status !== "CONFIRMED") return { ok: false, status: 422, reason: "You can review a landlord after a confirmed viewing." };
  if (v.preferredDate > endOfTodayUtc()) return { ok: false, status: 422, reason: "You can leave a review once the viewing has taken place." };
  if (v.review) return { ok: false, status: 409, reason: "You've already reviewed this viewing. You can edit your review instead." };
  return { ok: true, viewing: { id: v.id, propertyId: v.property.id, propertyTitle: v.property.title, landlordId: v.property.landlordId } };
}

const round1 = (n: number | null) => (n === null ? 0 : Math.round(n * 10) / 10);

/** Average ratings (visible reviews only) for several landlords at once. */
export async function landlordRatingSummaries(landlordIds: string[]): Promise<Map<string, RatingSummary>> {
  const out = new Map<string, RatingSummary>();
  if (landlordIds.length === 0) return out;
  const rows = await prisma.review.groupBy({
    by: ["landlordId"],
    where: { landlordId: { in: [...new Set(landlordIds)] }, isHidden: false },
    _count: { _all: true },
    _avg: { landlordRating: true, accuracyRating: true },
  });
  for (const r of rows) {
    out.set(r.landlordId, { count: r._count._all, landlord: round1(r._avg.landlordRating), accuracy: round1(r._avg.accuracyRating) });
  }
  return out;
}

export async function landlordRatingSummary(landlordId: string): Promise<RatingSummary> {
  return (await landlordRatingSummaries([landlordId])).get(landlordId) ?? { count: 0, landlord: 0, accuracy: 0 };
}

/** How accurate one listing was rated, from visible reviews of viewings of that listing. */
export async function listingAccuracy(propertyId: string): Promise<{ count: number; accuracy: number }> {
  const r = await prisma.review.aggregate({
    where: { propertyId, isHidden: false },
    _count: { _all: true },
    _avg: { accuracyRating: true },
  });
  return { count: r._count._all, accuracy: round1(r._avg.accuracyRating) };
}
