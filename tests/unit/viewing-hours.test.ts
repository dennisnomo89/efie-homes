import { describe, expect, it } from "vitest";
import { describeHours, HOUR_PRESETS, parseHours, slotsForDate } from "@/lib/viewing-hours";
import { viewingHoursSchema } from "@/lib/validations";

// 16 Nov 2026 is a Monday; 22 Nov 2026 a Sunday.
const MONDAY = "2026-11-16";
const SUNDAY = "2026-11-22";

describe("parseHours", () => {
  it("is null for 'any time' or junk", () => {
    expect(parseHours(null)).toBeNull();
    expect(parseHours("weekdays")).toBeNull();
    expect(parseHours([1, 2])).toBeNull();
  });

  it("keeps known days and slots, in order, dropping empty days", () => {
    expect(parseHours({ "1": ["11:00", "09:00", "03:00"], "0": [], "9": ["09:00"] })).toEqual({ "1": ["09:00", "11:00"] });
  });
});

describe("slotsForDate", () => {
  const hours = { "1": ["09:00", "10:00"] };

  it("offers every slot when the landlord accepts any time", () => {
    expect(slotsForDate(null, SUNDAY).every((s) => s.available)).toBe(true);
  });

  it("marks times outside the landlord's hours as off", () => {
    const monday = slotsForDate(hours, MONDAY);
    expect(monday.filter((s) => s.available).map((s) => s.time)).toEqual(["09:00", "10:00"]);
    expect(monday.find((s) => s.time === "15:00")).toEqual({ time: "15:00", available: false, reason: "off" });
    expect(slotsForDate(hours, SUNDAY).some((s) => s.available)).toBe(false);
  });

  it("marks confirmed times as booked", () => {
    expect(slotsForDate(hours, MONDAY, ["10:00"]).find((s) => s.time === "10:00")).toEqual({ time: "10:00", available: false, reason: "booked" });
    expect(slotsForDate(null, SUNDAY, ["12:00"]).find((s) => s.time === "12:00")?.reason).toBe("booked");
  });
});

describe("describeHours", () => {
  it("lists the days, Monday first", () => {
    expect(describeHours(null)).toBe("Any day");
    expect(describeHours({ "0": ["09:00"], "1": ["09:00"], "6": ["09:00"] })).toBe("Mon, Sat, Sun");
    expect(describeHours({})).toBe("No days set");
  });

  it("presets are valid", () => {
    for (const p of HOUR_PRESETS) expect(viewingHoursSchema.safeParse({ hours: p.hours }).success).toBe(true);
  });
});

describe("viewingHoursSchema", () => {
  it("accepts hours or null", () => {
    expect(viewingHoursSchema.safeParse({ hours: null }).success).toBe(true);
    expect(viewingHoursSchema.safeParse({ hours: { "6": ["10:00"] } }).success).toBe(true);
  });

  it.each<[unknown, string]>([
    [{ hours: {} }, "no times at all"],
    [{ hours: { "1": [] } }, "only empty days"],
    [{ hours: { "7": ["10:00"] } }, "unknown day"],
    [{ hours: { "1": ["10:30"] } }, "unlisted time"],
    [{ hours: { "1": ["10:00", "10:00"] } }, "duplicate time"],
  ])("rejects %j (%s)", (input) => {
    expect(viewingHoursSchema.safeParse(input).success).toBe(false);
  });
});
