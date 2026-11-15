import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { reviewEditSchema, reviewModerationSchema, reviewReplySchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/reviews/:id
 *  - the author edits ratings/comment: { landlordRating?, accuracyRating?, comment? }
 *  - the reviewed landlord posts or edits their public reply: { landlordReply }
 *  - an admin hides or shows it: { isHidden }
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await guard();
  if (g.response) return g.response;
  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id }, select: { tenantId: true, landlordId: true } });
  if (!review) return fail("Review not found.", 404);
  const body = (await readJson(req)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return fail("Nothing to update.", 422);

  if ("isHidden" in body) {
    if (g.session.role !== "ADMIN") return fail("Only admins can hide reviews.", 403);
    const parsed = reviewModerationSchema.safeParse(body);
    if (!parsed.success) return validationFailed(parsed.error);
    return ok({ review: await prisma.review.update({ where: { id }, data: { isHidden: parsed.data.isHidden } }) });
  }

  if ("landlordReply" in body) {
    if (g.session.sub !== review.landlordId) return fail("Only the reviewed landlord can reply.", 403);
    const parsed = reviewReplySchema.safeParse(body);
    if (!parsed.success) return validationFailed(parsed.error);
    return ok({ review: await prisma.review.update({ where: { id }, data: { landlordReply: parsed.data.landlordReply, repliedAt: new Date() } }) });
  }

  if (g.session.sub !== review.tenantId) return fail("You can only edit your own review.", 403);
  const parsed = reviewEditSchema.safeParse(body);
  if (!parsed.success) return validationFailed(parsed.error);
  const { comment, ...ratings } = parsed.data;
  const data = {
    ...Object.fromEntries(Object.entries(ratings).filter(([, v]) => v !== undefined)),
    ...(comment !== undefined ? { comment: comment || null } : {}),
  };
  return ok({ review: await prisma.review.update({ where: { id }, data }) });
}

/** DELETE /api/reviews/:id — the author or an admin removes a review. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const g = await guard();
  if (g.response) return g.response;
  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id }, select: { tenantId: true } });
  if (!review) return fail("Review not found.", 404);
  if (review.tenantId !== g.session.sub && g.session.role !== "ADMIN") return fail("You can only delete your own review.", 403);

  await prisma.review.delete({ where: { id } });
  return ok({ success: true });
}
