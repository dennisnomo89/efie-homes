import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW_MS, threadAccess } from "@/lib/messages";
import { notifyNewMessage } from "@/lib/notifications";
import { messageSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

const ERRORS = { 404: "Viewing request not found.", 403: "You can only see messages for your own viewing requests." } as const;

/** GET /api/viewings/:id/messages — the thread, oldest first. Marks the other person's messages as read. */
export async function GET(_req: Request, { params }: Ctx) {
  const g = await guard();
  if (g.response) return g.response;
  const { id } = await params;

  const access = await threadAccess(id, g.session);
  if (!access.ok) return fail(ERRORS[access.status], access.status);

  // Admins read for moderation without marking anything as read.
  if (access.role !== "admin") {
    await prisma.message.updateMany({
      where: { viewingRequestId: id, senderId: { not: g.session.sub }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  const messages = await prisma.message.findMany({
    where: { viewingRequestId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, readAt: true, senderId: true },
  });

  const { viewing } = access;
  return ok({
    canPost: access.role !== "admin",
    viewing: {
      id: viewing.id,
      propertyId: viewing.propertyId,
      propertyTitle: viewing.propertyTitle,
      tenantName: viewing.tenantName,
      landlordName: viewing.landlordName,
    },
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      readAt: m.readAt,
      mine: m.senderId === g.session.sub,
      from: m.senderId === viewing.tenantId ? "tenant" : "landlord",
    })),
  });
}

/** POST /api/viewings/:id/messages — the tenant or landlord adds a message. */
export async function POST(req: Request, { params }: Ctx) {
  const g = await guard();
  if (g.response) return g.response;
  const { id } = await params;

  const access = await threadAccess(id, g.session);
  if (!access.ok) return fail(ERRORS[access.status], access.status);
  if (access.role === "admin") return fail("Admins can read threads but not post in them.", 403);

  const parsed = messageSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);

  const recent = await prisma.message.count({
    where: { viewingRequestId: id, senderId: g.session.sub, createdAt: { gt: new Date(Date.now() - MESSAGE_RATE_WINDOW_MS) } },
  });
  if (recent >= MESSAGE_RATE_LIMIT) {
    return fail("You're sending messages too quickly. Please wait a few minutes.", 429);
  }

  const message = await prisma.message.create({
    data: { viewingRequestId: id, senderId: g.session.sub, body: parsed.data.body },
    select: { id: true, body: true, createdAt: true, readAt: true },
  });
  after(() => notifyNewMessage(message.id));

  return ok({ message: { ...message, mine: true, from: access.role } }, 201);
}
