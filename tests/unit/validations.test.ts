import { describe, expect, it } from "vitest";
import {
  adminPropertySchema,
  fieldErrors,
  ghanaPhone,
  profileSchema,
  propertySchema,
  registerSchema,
  viewingRequestSchema,
} from "@/lib/validations";

const isoDay = (offsetDays: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

describe("ghanaPhone", () => {
  it.each(["0244123456", "024 412 3456", "024-412-3456", "+233244123456", "0302000000", "0559876543"])("accepts %s", (n) => {
    expect(ghanaPhone.safeParse(n).success).toBe(true);
  });

  it("normalises spaces and dashes", () => {
    expect(ghanaPhone.parse(" 024 412-3456 ")).toBe("0244123456");
  });

  it.each(["123", "0144123456", "02441234567", "+2330244123456", "0644123456", "phone"])("rejects %s", (n) => {
    expect(ghanaPhone.safeParse(n).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = { name: "Ama Mensah", email: "AMA@Example.com ", phone: "", password: "Password123", role: "TENANT" };

  it("accepts a valid tenant and lower-cases the email", () => {
    const r = registerSchema.parse(valid);
    expect(r.email).toBe("ama@example.com");
    expect(r.phone).toBeUndefined();
  });

  it("refuses self-registration as ADMIN", () => {
    expect(registerSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(false);
  });

  it.each([
    ["short", "Pass1"],
    ["no number", "Passwordonly"],
    ["no letter", "12345678"],
  ])("rejects a weak password (%s)", (_label, password) => {
    const r = registerSchema.safeParse({ ...valid, password });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).password).toBeTruthy();
  });
});

describe("propertySchema", () => {
  const base = {
    title: "Neat 2-Bedroom Apartment, Spintex",
    description: "A clean two bedroom apartment in a walled compound close to the main road.",
    propertyType: "APARTMENT_2BR",
    region: "Greater Accra",
    neighborhood: "Spintex",
    address: "Coca-Cola Road",
    monthlyRent: "3800",
    advanceMonths: "12",
    securityDeposit: "0",
    agentFeePercent: "10",
    bedrooms: "2",
    bathrooms: "2",
    sizeSqm: "",
    furnished: false,
    images: ["https://example.com/photo.jpg"],
    amenities: ["ECG_PREPAID", "WALLED_GATED"],
  };

  it("coerces form strings into numbers and defaults status", () => {
    const r = propertySchema.parse(base);
    expect(r.monthlyRent).toBe(3800);
    expect(r.advanceMonths).toBe(12);
    expect(r.sizeSqm).toBeNull();
    expect(r.status).toBe("AVAILABLE");
  });

  it("only allows 6, 12 or 24 months advance", () => {
    expect(propertySchema.safeParse({ ...base, advanceMonths: "6" }).success).toBe(true);
    expect(propertySchema.safeParse({ ...base, advanceMonths: "24" }).success).toBe(true);
    expect(propertySchema.safeParse({ ...base, advanceMonths: "3" }).success).toBe(false);
  });

  it("requires 1–12 valid image URLs", () => {
    expect(fieldErrors(propertySchema.safeParse({ ...base, images: [] }).error!).images).toMatch(/at least one/);
    expect(propertySchema.safeParse({ ...base, images: ["not a url"] }).success).toBe(false);
    expect(propertySchema.safeParse({ ...base, images: Array(13).fill("https://example.com/a.jpg") }).success).toBe(false);
  });

  it("rejects unknown amenities, regions and property types", () => {
    expect(propertySchema.safeParse({ ...base, amenities: ["HELIPAD"] }).success).toBe(false);
    expect(propertySchema.safeParse({ ...base, region: "Lagos" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...base, propertyType: "CASTLE" }).success).toBe(false);
  });

  it("caps the agent fee at 20%", () => {
    expect(propertySchema.safeParse({ ...base, agentFeePercent: "25" }).success).toBe(false);
  });
});

describe("viewingRequestSchema", () => {
  const base = { propertyId: "abc", preferredTime: "10:00", phone: "0244123456", message: "Is it still available?" };

  it("accepts today and future dates within 90 days", () => {
    expect(viewingRequestSchema.safeParse({ ...base, preferredDate: isoDay(0) }).success).toBe(true);
    expect(viewingRequestSchema.safeParse({ ...base, preferredDate: isoDay(30) }).success).toBe(true);
  });

  it("rejects past dates and dates over 90 days away", () => {
    expect(viewingRequestSchema.safeParse({ ...base, preferredDate: isoDay(-1) }).success).toBe(false);
    expect(viewingRequestSchema.safeParse({ ...base, preferredDate: isoDay(120) }).success).toBe(false);
  });

  it("only allows the listed time slots", () => {
    expect(viewingRequestSchema.safeParse({ ...base, preferredDate: isoDay(1), preferredTime: "03:00" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("requires the current password to set a new one", () => {
    const r = profileSchema.safeParse({ name: "Ama", newPassword: "NewPassword1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).currentPassword).toBeTruthy();
  });

  it("allows updating details without touching the password", () => {
    expect(profileSchema.safeParse({ name: "Ama Mensah", phone: "0244123456", currentPassword: "", newPassword: "" }).success).toBe(true);
  });
});

describe("adminPropertySchema", () => {
  it("needs at least one field", () => {
    expect(adminPropertySchema.safeParse({}).success).toBe(false);
    expect(adminPropertySchema.safeParse({ isHidden: true }).success).toBe(true);
  });
});
