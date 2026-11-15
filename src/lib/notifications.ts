import { prisma } from "./prisma";
import { appUrl, sendEmail } from "./email";
import { newMessageEmail, reviewReceivedEmail, savedSearchAlertEmail, viewingAnsweredEmail, viewingCancelledEmail, viewingRequestedEmail } from "./email-templates";
import { propertyTypeLabel } from "./constants";
import { ALERT_THROTTLE_MS, filtersFromQuery, listingMatches, unsubscribeToken } from "./saved-searches";
import { parseJsonArray } from "./utils";

/* Each function loads what it needs and sends one email. They never throw (sendEmail swallows errors),
 * so they are safe to run with next/server's after() once the response has been sent. */

const viewingInclude = {
  tenant: { select: { name: true, email: true } },
  property: { select: { id: true, title: true, landlord: { select: { name: true, email: true, phone: true } } } },
} as const;

/** Tells the landlord a tenant wants to view their property. */
export async function notifyViewingRequested(viewingId: string) {
  try {
    const v = await prisma.viewingRequest.findUnique({ where: { id: viewingId }, include: viewingInclude });
    if (!v) return;
    const email = viewingRequestedEmail({
      landlordName: v.property.landlord.name,
      tenantName: v.tenant.name,
      tenantPhone: v.phone,
      propertyTitle: v.property.title,
      date: v.preferredDate,
      time: v.preferredTime,
      message: v.message,
      dashboardUrl: `${appUrl()}/dashboard/landlord`,
    });
    await sendEmail({ to: v.property.landlord.email, replyTo: v.tenant.email, ...email });
  } catch (err) {
    console.error("[notify] viewing requested:", err instanceof Error ? err.message : err);
  }
}

/** Tells the tenant their request was confirmed or declined. */
export async function notifyViewingAnswered(viewingId: string) {
  try {
    const v = await prisma.viewingRequest.findUnique({ where: { id: viewingId }, include: viewingInclude });
    if (!v || (v.status !== "CONFIRMED" && v.status !== "DECLINED")) return;
    const email = viewingAnsweredEmail({
      tenantName: v.tenant.name,
      landlordName: v.property.landlord.name,
      landlordPhone: v.property.landlord.phone,
      propertyTitle: v.property.title,
      status: v.status,
      date: v.preferredDate,
      time: v.preferredTime,
      note: v.landlordNote,
      propertyUrl: `${appUrl()}/properties/${v.property.id}`,
      dashboardUrl: `${appUrl()}/dashboard/tenant`,
    });
    await sendEmail({ to: v.tenant.email, replyTo: v.property.landlord.email, ...email });
  } catch (err) {
    console.error("[notify] viewing answered:", err instanceof Error ? err.message : err);
  }
}

export type CancelledViewing = {
  landlordName: string;
  landlordEmail: string;
  tenantName: string;
  propertyTitle: string;
  preferredDate: Date;
  preferredTime: string;
};

/** Tells the landlord a tenant withdrew a pending request (the row is already deleted, so data is passed in). */
export async function notifyViewingCancelled(v: CancelledViewing) {
  const email = viewingCancelledEmail({
    landlordName: v.landlordName,
    tenantName: v.tenantName,
    propertyTitle: v.propertyTitle,
    date: v.preferredDate,
    time: v.preferredTime,
    dashboardUrl: `${appUrl()}/dashboard/landlord`,
  });
  await sendEmail({ to: v.landlordEmail, ...email });
}

/** Quiet period: no further email for a thread while an earlier message from the same sender is still unread. */
export const MESSAGE_EMAIL_QUIET_MS = 10 * 60 * 1000;

/** Emails the other participant about a new message, unless they already have an unread one from this sender. */
export async function notifyNewMessage(messageId: string) {
  try {
    const m = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { name: true } },
        viewingRequest: {
          select: {
            id: true,
            tenantId: true,
            tenant: { select: { name: true, email: true } },
            property: { select: { title: true, landlordId: true, landlord: { select: { name: true, email: true } } } },
          },
        },
      },
    });
    if (!m) return;

    const earlierUnread = await prisma.message.count({
      where: {
        viewingRequestId: m.viewingRequestId,
        senderId: m.senderId,
        readAt: null,
        id: { not: m.id },
        createdAt: { gt: new Date(m.createdAt.getTime() - MESSAGE_EMAIL_QUIET_MS), lte: m.createdAt },
      },
    });
    if (earlierUnread > 0) return;

    const v = m.viewingRequest;
    const toTenant = m.senderId !== v.tenantId;
    const recipient = toTenant ? v.tenant : v.property.landlord;
    const email = newMessageEmail({
      recipientName: recipient.name,
      senderName: m.sender.name,
      propertyTitle: v.property.title,
      body: m.body,
      threadUrl: `${appUrl()}/dashboard/${toTenant ? "tenant" : "landlord"}?thread=${v.id}`,
    });
    await sendEmail({ to: recipient.email, ...email });
  } catch (err) {
    console.error("[notify] new message:", err instanceof Error ? err.message : err);
  }
}

/**
 * After a listing is published: email tenants whose saved searches it matches
 * (alerts on, not the listing's own landlord, at most one email per search per ALERT_THROTTLE_MS).
 * Returns how many alerts were sent (useful for logs/tests).
 */
export async function notifySavedSearchMatches(propertyId: string): Promise<number> {
  try {
    const p = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!p || p.isHidden || p.status !== "AVAILABLE") return 0;

    const searches = await prisma.savedSearch.findMany({
      where: { emailAlerts: true, userId: { not: p.landlordId } },
      include: { user: { select: { name: true, email: true } } },
    });
    const matching = searches.filter((s) => listingMatches(filtersFromQuery(s.query), p));
    let sent = 0;

    for (const s of matching) {
      // Claim the alert slot atomically so simultaneous listings can't both email within the throttle window.
      const cutoff = new Date(Date.now() - ALERT_THROTTLE_MS);
      const { count } = await prisma.savedSearch.updateMany({
        where: { id: s.id, emailAlerts: true, OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: cutoff } }] },
        data: { lastNotifiedAt: new Date() },
      });
      if (count === 0) continue;

      const unsubscribeUrl = `${appUrl()}/api/saved-searches/${s.id}/unsubscribe?token=${unsubscribeToken(s.id)}`;
      const email = savedSearchAlertEmail({
        name: s.user.name,
        searchName: s.name,
        listing: {
          title: p.title,
          monthlyRent: p.monthlyRent,
          neighborhood: p.neighborhood,
          region: p.region,
          bedrooms: p.bedrooms,
          propertyType: propertyTypeLabel(p.propertyType),
          image: parseJsonArray(p.images)[0] ?? null,
          url: `${appUrl()}/properties/${p.id}`,
        },
        searchUrl: `${appUrl()}/api/saved-searches/${s.id}/open`,
        unsubscribeUrl,
      });
      const result = await sendEmail({
        to: s.user.email,
        ...email,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      if (result.ok) sent++;
    }
    return sent;
  } catch (err) {
    console.error("[notify] saved search matches:", err instanceof Error ? err.message : err);
    return 0;
  }
}

/** Tells the landlord they were reviewed. */
export async function notifyReviewReceived(reviewId: string) {
  try {
    const r = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { tenant: { select: { name: true } }, landlord: { select: { name: true, email: true } } },
    });
    if (!r) return;
    const email = reviewReceivedEmail({
      landlordName: r.landlord.name,
      tenantName: r.tenant.name,
      propertyTitle: r.propertyTitle,
      landlordRating: r.landlordRating,
      accuracyRating: r.accuracyRating,
      comment: r.comment,
      dashboardUrl: `${appUrl()}/dashboard/landlord#reviews`,
    });
    await sendEmail({ to: r.landlord.email, ...email });
  } catch (err) {
    console.error("[notify] review received:", err instanceof Error ? err.message : err);
  }
}
