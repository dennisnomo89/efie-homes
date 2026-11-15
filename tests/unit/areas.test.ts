import { describe, expect, it } from "vitest";
import { areaSlug, areaStats, groupAreas, median, type AreaListing } from "@/lib/areas";

const home = (o: Partial<AreaListing>): AreaListing => ({
  neighborhood: "Osu",
  region: "Greater Accra",
  monthlyRent: 3000,
  propertyType: "APARTMENT_2BR",
  advanceMonths: 12,
  furnished: false,
  amenities: [],
  ...o,
});

describe("areaSlug", () => {
  it.each([
    ["East Legon", "east-legon"],
    ["Kumasi - Ahodwo", "kumasi-ahodwo"],
    ["  Airport Residential  ", "airport-residential"],
    ["Côte d'Ivoire St.", "cote-d-ivoire-st"],
    ["---", ""],
  ])("%s → %s", (name, slug) => {
    expect(areaSlug(name)).toBe(slug);
  });
});

describe("median", () => {
  it("handles empty, odd and even lists", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1000, 2000, 4000, 9000])).toBe(3000);
  });
});

describe("areaStats", () => {
  const stats = areaStats([
    home({ monthlyRent: 2000, propertyType: "CHAMBER_HALL", advanceMonths: 12, amenities: ["ECG_PREPAID"] }),
    home({ monthlyRent: 2400, propertyType: "CHAMBER_HALL", advanceMonths: 24, amenities: ["ECG_PREPAID", "BOREHOLE_POLYTANK"] }),
    home({ monthlyRent: 6000, propertyType: "APARTMENT_2BR", advanceMonths: 12, furnished: true, amenities: ["ECG_PREPAID"] }),
    home({ monthlyRent: 15000, propertyType: "TOWNHOUSE", advanceMonths: 24, furnished: true }),
  ]);

  it("summarises rent", () => {
    expect(stats).toMatchObject({ count: 4, medianRent: 4200, minRent: 2000, maxRent: 15000 });
  });

  it("gives the typical rent per home type, cheapest first", () => {
    expect(stats.byType).toEqual([
      { type: "CHAMBER_HALL", label: "Chamber and Hall", count: 2, medianRent: 2200 },
      { type: "APARTMENT_2BR", label: "2 Bedroom Apartment", count: 1, medianRent: 6000 },
      { type: "TOWNHOUSE", label: "Townhouse", count: 1, medianRent: 15000 },
    ]);
  });

  it("finds the usual advance, preferring the shorter one on a tie", () => {
    expect(stats.advanceShare).toEqual([
      { months: 12, count: 2 },
      { months: 24, count: 2 },
    ]);
    expect(stats.usualAdvance).toBe(12);
  });

  it("works out furnishing and essential amenity shares", () => {
    expect(stats.furnishedPercent).toBe(50);
    const share = Object.fromEntries(stats.amenities.map((a) => [a.value, a.percent]));
    expect(share).toMatchObject({ ECG_PREPAID: 75, BOREHOLE_POLYTANK: 25, GENERATOR_SOLAR: 0 });
    expect(share).not.toHaveProperty("POP_CEILING"); // not an essential
  });

  it("copes with an empty area", () => {
    expect(areaStats([])).toMatchObject({ count: 0, medianRent: null, usualAdvance: null, furnishedPercent: 0, byType: [] });
  });
});

describe("groupAreas", () => {
  it("merges spellings of the same area, names it after the most common one, busiest first", () => {
    const areas = groupAreas([
      home({ neighborhood: "East Legon", monthlyRent: 5000 }),
      home({ neighborhood: "east legon", monthlyRent: 7000 }),
      home({ neighborhood: "East Legon", monthlyRent: 9000 }),
      home({ neighborhood: "Takoradi", region: "Western", monthlyRent: 2500 }),
    ]);
    expect(areas).toEqual([
      { slug: "east-legon", name: "East Legon", region: "Greater Accra", count: 3, medianRent: 7000 },
      { slug: "takoradi", name: "Takoradi", region: "Western", count: 1, medianRent: 2500 },
    ]);
  });
});
