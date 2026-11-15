import { VIEWING_TIME_SLOTS } from "./constants";

/*
 * Landlord viewing hours: which of the standard viewing slots they can do on each day of the week.
 * Stored as { "0".."6": ["09:00", ...] } (0 = Sunday, Ghana time = UTC). null means "any listed time".
 */

export type WeekHours = Partial<Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", string[]>>;

export const WEEKDAYS = [
  { key: "1", short: "Mon", long: "Monday" },
  { key: "2", short: "Tue", long: "Tuesday" },
  { key: "3", short: "Wed", long: "Wednesday" },
  { key: "4", short: "Thu", long: "Thursday" },
  { key: "5", short: "Fri", long: "Friday" },
  { key: "6", short: "Sat", long: "Saturday" },
  { key: "0", short: "Sun", long: "Sunday" },
] as const;

/** Reads the stored JSON defensively: unknown keys and slots are dropped, slots kept in the usual order. */
export function parseHours(raw: unknown): WeekHours | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: WeekHours = {};
  for (const { key } of WEEKDAYS) {
    const v = (raw as Record<string, unknown>)[key];
    if (Array.isArray(v)) {
      const slots = VIEWING_TIME_SLOTS.filter((s) => v.includes(s));
      if (slots.length) out[key] = slots;
    }
  }
  return out;
}

const weekdayOf = (dateIso: string) => String(new Date(`${dateIso}T00:00:00Z`).getUTCDay()) as keyof WeekHours;

export type SlotState = { time: string; available: boolean; reason: "off" | "booked" | null };

/**
 * Each standard slot on a date: available, outside the landlord's hours ("off"),
 * or already taken by a confirmed viewing of this home ("booked").
 */
export function slotsForDate(hours: WeekHours | null, dateIso: string, booked: string[] = []): SlotState[] {
  const day = hours ? (hours[weekdayOf(dateIso)] ?? []) : VIEWING_TIME_SLOTS;
  return VIEWING_TIME_SLOTS.map((time) => {
    if (!day.includes(time)) return { time, available: false, reason: "off" as const };
    if (booked.includes(time)) return { time, available: false, reason: "booked" as const };
    return { time, available: true, reason: null };
  });
}

/** Days of the week the landlord shows homes, e.g. "Mon–Fri, Sat". */
export function describeHours(hours: WeekHours | null): string {
  if (!hours) return "Any day";
  const days = WEEKDAYS.filter((d) => hours[d.key]?.length).map((d) => d.short);
  return days.length ? days.join(", ") : "No days set";
}

/** Common presets for the landlord's editor. */
export const HOUR_PRESETS: { label: string; hours: WeekHours }[] = [
  {
    label: "Weekdays 9–5",
    hours: Object.fromEntries(["1", "2", "3", "4", "5"].map((d) => [d, [...VIEWING_TIME_SLOTS]])) as WeekHours,
  },
  {
    label: "Weekdays after 3pm + Saturday",
    hours: {
      ...(Object.fromEntries(["1", "2", "3", "4", "5"].map((d) => [d, VIEWING_TIME_SLOTS.filter((s) => s >= "15:00")])) as WeekHours),
      "6": [...VIEWING_TIME_SLOTS],
    },
  },
  { label: "Weekends only", hours: { "6": [...VIEWING_TIME_SLOTS], "0": VIEWING_TIME_SLOTS.filter((s) => s >= "13:00") } },
];
