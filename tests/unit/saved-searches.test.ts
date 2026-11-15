import { describe, expect, it } from "vitest";
import { buildWhere, parseFilters } from "@/lib/properties";
import {
  describeSearch,
  hasCriteria,
  listingMatches,
  normalizeSearchQuery,
  unsubscribeToken,
  verifyUnsubscribeToken,
  type MatchableListing,
} from "@/lib/saved-searches";

const f = (q: string) => parseFilters(new URLSearchParams(q));

const spintex: MatchableListing = {
  title: "Neat 2-Bedroom Apartment, Spintex Road",
  address: "Coca-Cola Road",
  region: "Greater Accra",
  neighborhood: "Spintex",
  propertyType: "APARTMENT_2BR",
  monthlyRent: 3800,
  advanceMonths: 12,
  bedrooms: 2,
  bathrooms: 2,
  furnished: false,
  amenities: '["ECG_PREPAID","WALLED_GATED","PARKING"]',
  status: "AVAILABLE",
  isHidden: false,
};

describe("listingMatches", () => {
  it.each([
    ["location=spintex", true],
    ["location=coca-cola", true],
    ["location=Osu", false],
    ["region=Greater+Accra&type=APARTMENT_2BR", true],
    ["region=Ashanti", false],
    ["maxPrice=4000", true],
    ["maxPrice=3000", false],
    ["minPrice=4000", false],
    ["advance=12", true],
    ["advance=6", false],
    ["bedrooms=2&bathrooms=2", true],
    ["bedrooms=3", false],
    ["amenities=PARKING,WALLED_GATED", true],
    ["amenities=PARKING,GENERATOR_SOLAR", false],
    ["furnished=true", false],
  ])("%s → %s", (query, expected) => {
    expect(listingMatches(f(query), spintex)).toBe(expected);
  });

  it("never matches hidden or rented homes", () => {
    expect(listingMatches(f("location=Spintex"), { ...spintex, isHidden: true })).toBe(false);
    expect(listingMatches(f("location=Spintex"), { ...spintex, status: "RENTED" })).toBe(false);
  });

  it("covers every filter buildWhere knows about", () => {
    // If someone adds a filter to the search page, this reminds them to teach listingMatches too.
    const all = f("location=x&region=Ashanti&type=DETACHED&minPrice=1&maxPrice=2&advance=6&bedrooms=1&bathrooms=1&amenities=PARKING&furnished=true");
    const conditions = (buildWhere(all).AND ?? []) as object[];
    // isHidden + status + location + region + type + min + max + advance + beds + baths + furnished + 1 amenity
    expect(conditions).toHaveLength(12);
  });
});

describe("saved search naming and normalising", () => {
  it("describes a search in plain words", () => {
    expect(describeSearch(f("type=APARTMENT_2BR&bedrooms=2&location=East+Legon&maxPrice=4000"))).toBe(
      "2 Bedroom Apartment · 2+ beds · East Legon · up to ₵ 4,000",
    );
    expect(describeSearch(f("region=Ashanti&minPrice=1000&maxPrice=3000&furnished=true"))).toBe("Any home · Ashanti · ₵ 1,000–₵ 3,000 · Furnished");
  });

  it("ignores page, sort and view, so the same search is only saved once", () => {
    expect(normalizeSearchQuery(f("location=Osu&page=3&sort=price_asc&view=map"))).toBe("location=Osu");
    expect(normalizeSearchQuery(f("bedrooms=2&location=Osu"))).toBe(normalizeSearchQuery(f("location=Osu&bedrooms=2")));
  });

  it("requires at least one filter", () => {
    expect(hasCriteria(f(""))).toBe(false);
    expect(hasCriteria(f("sort=price_asc&page=2"))).toBe(false);
    expect(hasCriteria(f("bedrooms=1"))).toBe(true);
  });
});

describe("unsubscribe tokens", () => {
  it("only accepts the token for the right saved search", () => {
    const token = unsubscribeToken("search_1");
    expect(verifyUnsubscribeToken("search_1", token)).toBe(true);
    expect(verifyUnsubscribeToken("search_2", token)).toBe(false);
    expect(verifyUnsubscribeToken("search_1", token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"))).toBe(false);
    expect(verifyUnsubscribeToken("search_1", "")).toBe(false);
  });
});
