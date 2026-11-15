import { describe, expect, it } from "vitest";
import { jsonLdScript, listingJsonLd, listingSummary, siteJsonLd } from "@/lib/seo";

const listing = {
  id: "abc123",
  title: "Neat 2-Bedroom Apartment, Spintex Road",
  description: "A clean two bedroom apartment in a walled compound.",
  propertyType: "APARTMENT_2BR",
  region: "Greater Accra",
  neighborhood: "Spintex",
  monthlyRent: 3800,
  advanceMonths: 12,
  bedrooms: 2,
  bathrooms: 2,
  sizeSqm: 95,
  furnished: false,
  status: "AVAILABLE",
  images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  latitude: 5.63,
  longitude: -0.118,
  updatedAt: new Date("2026-11-01T10:00:00Z"),
};

describe("listingSummary", () => {
  it("leads with price, size, type, area and advance", () => {
    expect(listingSummary(listing)).toBe(
      "₵ 3,800/month · 2-bed 2 bedroom apartment in Spintex, Greater Accra · 1 year advance. Book a viewing on Efie Homes.",
    );
  });

  it("stays within ~160 characters", () => {
    const long = { ...listing, neighborhood: "A".repeat(200) };
    expect(listingSummary(long).length).toBeLessThanOrEqual(160);
  });
});

describe("listingJsonLd", () => {
  it("describes the rent as a monthly Offer in GHS, with rooms and an approximate location", () => {
    const ld = listingJsonLd(listing);
    expect(ld["@type"]).toBe("RealEstateListing");
    expect(ld.url).toMatch(/\/properties\/abc123$/);
    expect(ld.offers).toMatchObject({ price: 3800, priceCurrency: "GHS", priceSpecification: { unitCode: "MON" } });
    expect(ld.mainEntity).toMatchObject({
      numberOfBedrooms: 2,
      numberOfBathroomsTotal: 2,
      floorSize: { value: 95 },
      address: { addressLocality: "Spintex", addressCountry: "GH" },
      geo: { latitude: 5.63, longitude: -0.118 },
    });
  });

  it("marks rented homes as unavailable", () => {
    expect(listingJsonLd({ ...listing, status: "RENTED" }).offers.availability).toBe("https://schema.org/SoldOut");
  });

  it("leaves out location when there is no pin", () => {
    expect(listingJsonLd({ ...listing, latitude: null, longitude: null }).mainEntity).not.toHaveProperty("geo");
  });
});

describe("jsonLdScript", () => {
  it("can't be broken out of by text in a listing", () => {
    const out = jsonLdScript(listingJsonLd({ ...listing, title: '</script><script>alert("x")</script>' }));
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    expect(JSON.parse(out).name).toBe('</script><script>alert("x")</script>');
  });
});

describe("siteJsonLd", () => {
  it("offers a site search box pointing at the listings page", () => {
    const site = siteJsonLd()["@graph"][1] as { potentialAction: { target: { urlTemplate: string } } };
    expect(site.potentialAction.target.urlTemplate).toMatch(/\/properties\?location=\{search_term_string\}$/);
  });
});
