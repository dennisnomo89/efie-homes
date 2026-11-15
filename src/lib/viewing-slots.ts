import { prisma } from "./prisma";
import { parseHours, slotsForDate, type SlotState } from "./viewing-hours";

const dayStart = (dateIso: string) => new Date(`${dateIso}T00:00:00.000Z`);

/** Times already taken by a confirmed viewing of this home on this date (optionally ignoring one request). */
export async function bookedTimes(propertyId: string, dateIso: string, exceptViewingId?: string): Promise<string[]> {
  const rows = await prisma.viewingRequest.findMany({
    where: { propertyId, preferredDate: dayStart(dateIso), status: "CONFIRMED", ...(exceptViewingId ? { id: { not: exceptViewingId } } : {}) },
    select: { preferredTime: true },
  });
  return rows.map((r) => r.preferredTime);
}

/** The slot picture for one home on one date, from its landlord's hours and confirmed bookings. */
export async function propertySlots(propertyId: string, dateIso: string): Promise<{ slots: SlotState[]; anyTime: boolean } | null> {
  const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { landlord: { select: { viewingHours: true } } } });
  if (!p) return null;
  const hours = parseHours(p.landlord.viewingHours);
  return { slots: slotsForDate(hours, dateIso, await bookedTimes(propertyId, dateIso)), anyTime: hours === null };
}

/** Why a requested slot can't be booked, or null if it can. */
export async function slotProblem(propertyId: string, dateIso: string, time: string): Promise<string | null> {
  const picture = await propertySlots(propertyId, dateIso);
  const slot = picture?.slots.find((s) => s.time === time);
  if (!slot) return "Pick one of the listed times.";
  if (slot.reason === "off") return "The landlord doesn't show homes at that time. Pick one of the available times.";
  if (slot.reason === "booked") return "That time has just been booked by someone else. Pick another time.";
  return null;
}
