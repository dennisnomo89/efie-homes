import { prisma } from "./prisma";
import { appUrl, sendEmail } from "./email";
import { viewingAnsweredEmail, viewingCancelledEmail, viewingRequestedEmail } from "./email-templates";

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
