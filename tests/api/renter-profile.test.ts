import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, DEMO_PASSWORD, isoDay, uniqueTag } from "./client";

let kwame: Client; // the landlord the tenant asks
let akosua: Client; // a landlord the tenant hasn't asked
let tenant: Client;
let listingId: string;
const tag = uniqueTag();
const occupation = `Pharmacist ${tag}`;

const nextMonth = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 7);
};

beforeAll(async () => {
  [kwame, akosua] = await Promise.all([as("kwame"), as("akosua")]);
  tenant = anon();
  expect((await tenant.post("/api/auth/register", { name: `Renter ${tag}`, email: `${tag}@efiehomes.test`, password: DEMO_PASSWORD, role: "TENANT" })).status).toBe(201);
  listingId = await createListing(kwame, `Renter profile test ${tag}`);
});

afterAll(async () => {
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("renter profile", () => {
  it("is for tenants only", async () => {
    expect((await anon().get("/api/profile/renter")).status).toBe(401);
    expect((await kwame.put("/api/profile/renter", { occupation: "Landlord" })).status).toBe(403);
  });

  it("starts empty, and the dashboard suggests filling it in", async () => {
    expect((await tenant.get("/api/profile/renter")).body).toEqual({ profile: { occupation: null, householdSize: null, moveInFrom: null, about: null } });
    expect((await tenant.get("/dashboard/tenant")).body).toContain("Add renter profile");
  });

  it("validates and saves", async () => {
    const bad = await tenant.put("/api/profile/renter", { householdSize: 0, moveInFrom: "2001-01" });
    expect(bad.status).toBe(422);
    expect(Object.keys(bad.body.errors)).toEqual(expect.arrayContaining(["householdSize", "moveInFrom"]));

    const res = await tenant.put("/api/profile/renter", { occupation: occupation, householdSize: "3", moveInFrom: nextMonth(), about: "Quiet family of three." });
    expect(res.status).toBe(200);
    expect(res.body.profile).toEqual({ occupation, householdSize: 3, moveInFrom: nextMonth(), about: "Quiet family of three." });
    expect((await tenant.get("/dashboard/tenant")).body).not.toContain("Add renter profile");
  });

  it("is shown to the landlord the tenant asks for a viewing, and not to other landlords", async () => {
    expect(
      (
        await tenant.post("/api/viewings", {
          propertyId: listingId,
          preferredDate: isoDay(4),
          preferredTime: "11:00",
          phone: "0241234567",
          message: "Hello, I'd like to view this place please.",
        })
      ).status,
    ).toBe(201);
    const kwameView = ((await kwame.get("/dashboard/landlord")).body as string).replace(/<!-- -->/g, "");
    expect(kwameView).toContain(occupation);
    expect(kwameView).toContain("Household of 3");
    expect(kwameView).toContain("Quiet family of three.");
    expect((await akosua.get("/dashboard/landlord")).body).not.toContain(occupation);
  });

  it("is removed when every field is cleared", async () => {
    const res = await tenant.put("/api/profile/renter", { occupation: "", householdSize: "", moveInFrom: "", about: "" });
    expect(res.body.profile).toEqual({ occupation: null, householdSize: null, moveInFrom: null, about: null });
    expect((await tenant.get("/dashboard/tenant")).body).toContain("Add renter profile");
  });
});
