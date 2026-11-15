import { prisma } from "./prisma";
import type { SessionPayload } from "./jwt";

/** Max messages one person can send in a thread per window, to stop spam. */
export const MESSAGE_RATE_LIMIT = 30;
export const MESSAGE_RATE_WINDOW_MS = 10 * 60 * 1000;

export type ThreadAccess =
  | { ok: false; status: 404 | 403 }
  | {
      ok: true;
      /** "tenant" or "landlord" can read and write; "admin" can only read (moderation). */
      role: "tenant" | "landlord" | "admin";
      viewing: {
        id: string;
        tenantId: string;
        landlordId: string;
        tenantName: string;
        landlordName: string;
        propertyId: string;
        propertyTitle: string;
      };
    };

/** Works out whether the session may see the thread for a viewing request, and in what role. */
export async function threadAccess(viewingId: string, session: SessionPayload): Promise<ThreadAccess> {
  const v = await prisma.viewingRequest.findUnique({
    where: { id: viewingId },
    select: {
      id: true,
      tenantId: true,
      tenant: { select: { name: true } },
      property: { select: { id: true, title: true, landlordId: true, landlord: { select: { name: true } } } },
    },
  });
  if (!v) return { ok: false, status: 404 };

  const role =
    session.sub === v.tenantId ? "tenant" : session.sub === v.property.landlordId ? "landlord" : session.role === "ADMIN" ? "admin" : null;
  if (!role) return { ok: false, status: 403 };

  return {
    ok: true,
    role,
    viewing: {
      id: v.id,
      tenantId: v.tenantId,
      landlordId: v.property.landlordId,
      tenantName: v.tenant.name,
      landlordName: v.property.landlord.name,
      propertyId: v.property.id,
      propertyTitle: v.property.title,
    },
  };
}

/** Unread message counts per viewing request for this user (messages sent by others, not yet read). */
export async function unreadCounts(userId: string, viewingIds: string[]): Promise<Record<string, number>> {
  if (viewingIds.length === 0) return {};
  const rows = await prisma.message.groupBy({
    by: ["viewingRequestId"],
    where: { viewingRequestId: { in: viewingIds }, senderId: { not: userId }, readAt: null },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.viewingRequestId, r._count._all]));
}

/** Total messages per viewing request (so the button can say "Messages (3)"). */
export async function messageTotals(viewingIds: string[]): Promise<Record<string, number>> {
  if (viewingIds.length === 0) return {};
  const rows = await prisma.message.groupBy({
    by: ["viewingRequestId"],
    where: { viewingRequestId: { in: viewingIds } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.viewingRequestId, r._count._all]));
}
