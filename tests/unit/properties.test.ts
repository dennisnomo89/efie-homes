import { describe, expect, it } from "vitest";
import { buildOrderBy, buildWhere, filtersToQuery, parseFilters } from "@/lib/properties";

describe("parseFilters", () => {
  it("parses a full query string", () => {
    const f = parseFilters(
      new URLSearchParams(
        "location=Osu&region=Greater+Accra&type=APARTMENT_2BR&minPrice=1000&maxPrice=5000&advance=12&bedrooms=2&bathrooms=1&amenities=ECG_PREPAID,WALLED_GATED&furnished=true&sort=price_asc&page=2",
      ),
    );
    expect(f).toMatchObject({
      location: "Osu",
      region: "Greater Accra",
      type: "APARTMENT_2BR",
      minPrice: 1000,
      maxPrice: 5000,
      advance: 12,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ["ECG_PREPAID", "WALLED_GATED"],
      furnished: true,
      sort: "price_asc",
      page: 2,
    });
  });

  it("ignores unknown regions, types, amenities and sorts", () => {
    const f = parseFilters({ region: "Lagos", type: "CASTLE", amenities: "HELIPAD,PARKING", sort: "random" });
    expect(f.region).toBeUndefined();
    expect(f.type).toBeUndefined();
    expect(f.amenities).toEqual(["PARKING"]);
    expect(f.sort).toBe("newest");
  });

  it("never goes below page 1 and drops junk numbers", () => {
    expect(parseFilters({ page: "-3" }).page).toBe(1);
    expect(parseFilters({ page: "abc" }).page).toBe(1);
    expect(parseFilters({ maxPrice: "lots" }).maxPrice).toBeUndefined();
  });
});

describe("buildWhere", () => {
  const conditions = (q: Record<string, string>) => (buildWhere(parseFilters(q)).AND ?? []) as Record<string, unknown>[];

  it("always excludes hidden listings and, by default, rented ones", () => {
    const and = conditions({});
    expect(and).toContainEqual({ isHidden: false });
    expect(and).toContainEqual({ status: "AVAILABLE" });
  });

  it("still excludes hidden listings when rented ones are included", () => {
    const and = conditions({ includeRented: "true" });
    expect(and).toContainEqual({ isHidden: false });
    expect(and).not.toContainEqual({ status: "AVAILABLE" });
  });

  it("matches location case-insensitively across several fields", () => {
    const or = (conditions({ location: "osu" }).find((c) => "OR" in c) as { OR: Record<string, { mode: string }>[] }).OR;
    expect(or).toHaveLength(4);
    for (const clause of or) expect(Object.values(clause)[0].mode).toBe("insensitive");
  });

  it("treats 'advance' as the most months a tenant can pay", () => {
    expect(conditions({ advance: "6" })).toContainEqual({ advanceMonths: { lte: 6 } });
  });

  it("requires every selected amenity", () => {
    const and = conditions({ amenities: "ECG_PREPAID,PARKING" });
    expect(and).toContainEqual({ amenities: { contains: '"ECG_PREPAID"' } });
    expect(and).toContainEqual({ amenities: { contains: '"PARKING"' } });
  });
});

describe("buildOrderBy", () => {
  it("puts featured listings first by default", () => {
    expect(buildOrderBy("newest")[0]).toEqual({ isFeatured: "desc" });
    expect(buildOrderBy("price_asc")).toEqual([{ monthlyRent: "asc" }]);
  });
});

describe("filtersToQuery", () => {
  it("round-trips through parseFilters and drops defaults", () => {
    const f = parseFilters({ location: "East Legon", amenities: "PARKING", sort: "newest", page: "1" });
    const q = filtersToQuery(f);
    expect(q).toBe("?location=East+Legon&amenities=PARKING");
    expect(parseFilters(new URLSearchParams(q.slice(1)))).toEqual(f);
  });

  it("applies overrides such as the page number", () => {
    expect(filtersToQuery(parseFilters({ region: "Ashanti" }), { page: 3 })).toBe("?region=Ashanti&page=3");
  });
});
