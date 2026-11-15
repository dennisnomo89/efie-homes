import { describe, expect, it } from "vitest";
import { dateToMonth, isProfileEmpty, monthToDate, renterFacts } from "@/lib/renter";
import { addMonths, currentMonth, renterProfileSchema } from "@/lib/validations";

describe("month helpers", () => {
  it("convert between YYYY-MM and the first of the month", () => {
    expect(monthToDate("2026-12").toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(dateToMonth(new Date("2027-03-01T00:00:00Z"))).toBe("2027-03");
    expect(dateToMonth(null)).toBe("");
  });

  it("add months across years", () => {
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2026-11", 24)).toBe("2028-11");
    expect(currentMonth(new Date("2026-11-15T23:00:00Z"))).toBe("2026-11");
  });
});

describe("renterProfileSchema", () => {
  const now = currentMonth();

  it("accepts a full profile, trimming text and reading numbers from form strings", () => {
    expect(renterProfileSchema.parse({ occupation: "  Nurse ", householdSize: "3", moveInFrom: addMonths(now, 1), about: " Quiet. " })).toEqual({
      occupation: "Nurse",
      householdSize: 3,
      moveInFrom: addMonths(now, 1),
      about: "Quiet.",
    });
  });

  it("turns blank or missing fields into null", () => {
    expect(renterProfileSchema.parse({ occupation: " ", householdSize: "", moveInFrom: "", about: "" })).toEqual({
      occupation: null,
      householdSize: null,
      moveInFrom: null,
      about: null,
    });
    expect(renterProfileSchema.parse({})).toEqual({ occupation: null, householdSize: null, moveInFrom: null, about: null });
  });

  it.each([
    [{ householdSize: 0 }, "householdSize"],
    [{ householdSize: "2.5" }, "householdSize"],
    [{ householdSize: "lots" }, "householdSize"],
    [{ moveInFrom: addMonths(now, -1) }, "moveInFrom"],
    [{ moveInFrom: addMonths(now, 25) }, "moveInFrom"],
    [{ moveInFrom: "2026-13" }, "moveInFrom"],
    [{ about: "x".repeat(301) }, "about"],
    [{ occupation: "x".repeat(81) }, "occupation"],
  ])("rejects %j", (input, field) => {
    const res = renterProfileSchema.safeParse(input);
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path[0]).toBe(field);
  });
});

describe("renterFacts", () => {
  const now = new Date("2026-11-15T12:00:00Z");

  it("is empty for no profile", () => {
    expect(renterFacts(null, now)).toEqual([]);
    expect(isProfileEmpty({ occupation: null, householdSize: null, moveInFrom: null, about: null })).toBe(true);
  });

  it("summarises the profile for a landlord", () => {
    expect(renterFacts({ occupation: "Nurse", householdSize: 4, moveInFrom: monthToDate("2027-01"), about: "Hi" }, now)).toEqual([
      "Nurse",
      "Household of 4",
      "Moving in from Jan 2027",
    ]);
  });

  it("says 'ready now' for this month or earlier and 'living alone' for one person", () => {
    expect(renterFacts({ occupation: null, householdSize: 1, moveInFrom: monthToDate("2026-11"), about: null }, now)).toEqual([
      "Living alone",
      "Ready to move in now",
    ]);
  });
});
