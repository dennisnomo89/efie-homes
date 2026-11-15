import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { notifyReviewReceived } from "@/lib/notifications";
import { reviewEligibility } from "@/lib/reviews";
import { reviewCreateSchema } from "@/lib/validations";

/** POST /api/reviews — a tenant reviews a confirmed viewing that has taken place (once per viewing). */
export async function POST(req: Request) {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;

  const parsed = reviewCreateSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const { viewingRequestId, landlordRating, accuracyRating, comment } = parsed.data;

  const eligible = await reviewEligibility(viewingRequestId, g.session.sub);
  if (!eligible.ok) return fail(eligible.reason, eligible.status);

  try {
    const review = await prisma.review.create({
      data: {
        viewingRequestId,
        propertyId: eligible.viewing.propertyId,
        propertyTitle: eligible.viewing.propertyTitle,
        landlordId: eligible.viewing.landlordId,
        tenantId: g.session.sub,
        landlordRating,
        accuracyRating,
        comment,
      },
    });
    after(() => notifyReviewReceived(review.id));
    return ok({ review }, 201);
  } catch (err) {
    // Two simultaneous submissions: the unique viewingRequestId stops the second one.
    if ((err as { code?: string }).code === "P2002") return fail("You've already reviewed this viewing.", 409);
    throw err;
  }
}
