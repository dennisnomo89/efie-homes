import { describe, expect, it } from "vitest";
import { NEIGHBORHOOD_CENTERS, NEIGHBORHOODS, GHANA_BOUNDS } from "@/lib/constants";
import { roundCoord } from "@/lib/properties";
import { fieldErrors, propertySchema } from "@/lib/validations";

const base = {
  title: "Neat 2-Bedroom Apartment, Spintex",
  description: "A clean two bedroom apartment in a walled compound close to the main road.",
  propertyType: "APARTMENT_2BR",
  region: "Greater Accra",
  neighborhood: "Spintex",
  address: "Coca-Cola Road",
  monthlyRent: 3800,
  advanceMonths: 12,
  securityDeposit: 0,
  agentFeePercent: 10,
  bedrooms: 2,
  bathrooms: 2,
  images: ["https://example.com/photo.jpg"],
  amenities: [],
};

describe("map pin validation", () => {
  it("allows no pin", () => {
    const r = propertySchema.parse(base);
    expect(r.latitude).toBeNull();
    expect(r.longitude).toBeNull();
  });

  it("accepts a pin in Accra", () => {
    expect(propertySchema.safeParse({ ...base, latitude: 5.63, longitude: -0.118 }).success).toBe(true);
  });

  it("needs both coordinates", () => {
    const r = propertySchema.safeParse({ ...base, latitude: 5.63 });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).latitude).toMatch(/both/);
  });

  it("rejects pins outside Ghana", () => {
    for (const [lat, lng] of [[6.52, 3.38] /* Lagos */, [51.5, -0.12] /* London */, [0, 0]]) {
      const r = propertySchema.safeParse({ ...base, latitude: lat, longitude: lng });
      expect(r.success).toBe(false);
      expect(fieldErrors(r.error!).latitude).toMatch(/inside Ghana/);
    }
  });

  it("rejects non-numbers", () => {
    expect(propertySchema.safeParse({ ...base, latitude: "5.6", longitude: "-0.1" }).success).toBe(false);
  });
});

describe("roundCoord", () => {
  it("rounds to 3 decimals (~110 m) and keeps null", () => {
    expect(roundCoord(5.637891)).toBe(5.638);
    expect(roundCoord(-0.161449)).toBe(-0.161);
    expect(roundCoord(null)).toBeNull();
  });
});

describe("neighbourhood centres", () => {
  it("cover every suggested neighbourhood in Greater Accra and Ashanti, all inside Ghana", () => {
    for (const hood of [...NEIGHBORHOODS["Greater Accra"]!, ...NEIGHBORHOODS.Ashanti!]) {
      expect(NEIGHBORHOOD_CENTERS[hood], hood).toBeDefined();
    }
    for (const [lat, lng] of Object.values(NEIGHBORHOOD_CENTERS)) {
      expect(lat).toBeGreaterThanOrEqual(GHANA_BOUNDS.minLat);
      expect(lat).toBeLessThanOrEqual(GHANA_BOUNDS.maxLat);
      expect(lng).toBeGreaterThanOrEqual(GHANA_BOUNDS.minLng);
      expect(lng).toBeLessThanOrEqual(GHANA_BOUNDS.maxLng);
    }
  });
});
