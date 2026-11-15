import { prisma } from "./prisma";
import { appUrl, sendEmail } from "./email";
import { pushNotification } from "./inbox";
import { listingReportedEmail, newMessageEmail, wishlistUpdateEmail, reviewReceivedEmail, savedSearchAlertEmail, viewingAnsweredEmail, viewingCancelledEmail, viewingRequestedEmail } from "./email-templates";
import { propertyTypeLabel, reportReasonLabel } from "./constants";
import { ALERT_THROTTLE_MS, filtersFromQuery, listingMatches, unsubscribeToken } from "./saved-searches";
import { formatCedis, formatDate, parseJsonArray } from "./utils";
import { WISHLIST_ALERT_THROTTLE_MS, wishlistUnsubscribeToken } from "./wishlist-alerts";

/* Each function loads what it needs, adds an in-app notification (the navbar bell) and sends one email. They never throw (sendEmail swallows errors),
 * so they are safe to run with next/server's after() once the response has been sent. */

const viewingInclude = {
  tenant: { select: { name: true, email: true } },
  property: { select: { id: true, title: true, landlordId: true, landlord: { select: { name: true, email: true, phone: true } } } },
} as const;

/** Tells the landlord a tenant wants to view their property. */
export async function notifyViewingRequested(viewingId: string) {
  try {
    const v = await prisma.viewingRequest.findUnique({ where: { id: viewingId }, include: viewingInclude });
    if (!v) return;
    await pushNotification(v.property.landlordId, {
      type: "VIEWING_REQUESTED",
      title: `${v.tenant.name} wants to view ${v.property.title}`,
      body: `${formatDate(v.preferredDate, { weekday: "short", day: "numeric", month: "short" })} at ${v.preferredTime}`,
      url: "/dashboard/landlord",
    });
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
    await pushNotification(v.tenantId, {
      type: "VIEWING_ANSWERED",
      title: `Viewing ${v.status === "CONFIRMED" ? "confirmed" : "declined"}: ${v.property.title}`,
      body: v.landlordNote ?? `${formatDate(v.preferredDate, { weekday: "short", day: "numeric", month: "short" })} at ${v.preferredTime}`,
      url: "/dashboard/tenant#viewings",
    });
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
  landlordId: string;
  landlordName: string;
  landlordEmail: string;
  tenantName: string;
  propertyTitle: string;
  preferredDate: Date;
  preferredTime: string;
};

/** Tells the landlord a tenant withdrew a pending request (the row is already deleted, so data is passed in). */
export async function notifyViewingCancelled(v: CancelledViewing) {
  await pushNotification(v.landlordId, {
    type: "VIEWING_CANCELLED",
    title: `${v.tenantName} cancelled their viewing request`,
    body: v.propertyTitle,
    url: "/dashboard/landlord",
  });
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

    const thread = m.viewingRequest;
    const toTenantInApp = m.senderId !== thread.tenantId;
    await pushNotification(
      toTenantInApp ? thread.tenantId : thread.property.landlordId,
      {
        type: "NEW_MESSAGE",
        title: `${m.sender.name} sent you a message`,
        body: `${thread.property.title}: ${m.body}`,
        url: `/dashboard/${toTenantInApp ? "tenant" : "landlord"}?thread=${thread.id}`,
      },
      { collapse: true },
    );

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

      await pushNotification(s.userId, {
        type: "SEARCH_MATCH",
        title: `New home for "${s.name}"`,
        body: `${p.title} · ${formatCedis(p.monthlyRent)}/month`,
        url: `/properties/${p.id}`,
      });
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
    await pushNotification(r.landlordId, {
      type: "REVIEW_RECEIVED",
      title: `${r.tenant.name} reviewed you: ${r.landlordRating}/5`,
      body: r.comment ?? r.propertyTitle,
      url: "/dashboard/landlord#reviews",
    });
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

/** Tells every admin that a listing was reported. */
export async function notifyListingReported(reportId: string) {
  try {
    const r = await prisma.listingReport.findUnique({
      where: { id: reportId },
      include: { property: { select: { id: true, title: true, landlord: { select: { name: true } } } } },
    });
    if (!r) return;
    const [admins, openReports] = await Promise.all([
      prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, name: true, email: true } }),
      prisma.listingReport.count({ where: { propertyId: r.propertyId, status: "OPEN" } }),
    ]);
    await pushNotification(
      admins.map((a) => a.id),
      {
        type: "LISTING_REPORTED",
        title: openReports > 1 ? `${r.property.title} has ${openReports} open reports` : `Listing reported: ${r.property.title}`,
        body: reportReasonLabel(r.reason),
        url: "/dashboard/admin#reports",
      },
      { collapse: true },
    );
    for (const admin of admins) {
      const email = listingReportedEmail({
        adminName: admin.name,
        propertyTitle: r.property.title,
        landlordName: r.property.landlord.name,
        reasonLabel: reportReasonLabel(r.reason),
        details: r.details,
        openReports,
        adminUrl: `${appUrl()}/dashboard/admin#reports`,
      });
      await sendEmail({ to: admin.email, ...email });
    }
  } catch (err) {
    console.error("[notify] listing reported:", err instanceof Error ? err.message : err);
  }
}

export type WishlistChange = { kind: "price"; from: number; to: number } | { kind: "available" };

/**
 * Emails tenants who saved a home when its rent drops or it's available again
 * (wishlist alerts on, at most one email per saved home per WISHLIST_ALERT_THROTTLE_MS). Returns how many were sent.
 */
export async function notifyWishlistChange(propertyId: string, change: WishlistChange): Promise<number> {
  try {
    const p = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!p || p.isHidden || p.status !== "AVAILABLE") return 0;

    const saves = await prisma.savedProperty.findMany({
      where: { propertyId, user: { wishlistAlerts: true, id: { not: p.landlordId } } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    let sent = 0;
    for (const s of saves) {
      // Claim the slot atomically so quick successive edits can't send several emails.
      const cutoff = new Date(Date.now() - WISHLIST_ALERT_THROTTLE_MS);
      const { count } = await prisma.savedProperty.updateMany({
        where: { id: s.id, OR: [{ lastAlertAt: null }, { lastAlertAt: { lt: cutoff } }] },
        data: { lastAlertAt: new Date() },
      });
      if (count === 0) continue;

      await pushNotification(s.user.id, {
        type: change.kind === "price" ? "PRICE_DROP" : "BACK_ON_MARKET",
        title: change.kind === "price" ? `Price drop: ${p.title}` : `Available again: ${p.title}`,
        body: change.kind === "price" ? `Now ${formatCedis(change.to)}/month (was ${formatCedis(change.from)})` : `${formatCedis(p.monthlyRent)}/month`,
        url: `/properties/${p.id}`,
      });
      const unsubscribeUrl = `${appUrl()}/api/wishlist-alerts/unsubscribe?u=${s.user.id}&token=${wishlistUnsubscribeToken(s.user.id)}`;
      const email = wishlistUpdateEmail({
        name: s.user.name,
        change,
        listing: {
          title: p.title,
          monthlyRent: p.monthlyRent,
          neighborhood: p.neighborhood,
          region: p.region,
          image: parseJsonArray(p.images)[0] ?? null,
          url: `${appUrl()}/properties/${p.id}`,
        },
        wishlistUrl: `${appUrl()}/dashboard/tenant#saved`,
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
    console.error("[notify] wishlist change:", err instanceof Error ? err.message : err);
    return 0;
  }
}
