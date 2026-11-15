import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, isoDay, search, uniqueTag } from "./client";

let admin: Client;
let kwame: Client;
let ama: Client;
let listingId: string;
const tag = uniqueTag();

beforeAll(async () => {
  [admin, kwame, ama] = await Promise.all([as("admin"), as("kwame"), as("ama")]);
  listingId = await createListing(kwame, `Moderation test ${tag}`);
});

afterAll(async () => {
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("hiding listings", () => {
  it("removes a hidden listing from everything public", async () => {
    const res = await admin.patch(`/api/admin/properties/${listingId}`, { isHidden: true });
    expect(res.status).toBe(200);
    expect(res.body.property).toMatchObject({ isHidden: true, isFeatured: false });

    expect((await search(`location=${tag}`)).total).toBe(0);
    expect((await anon().get(`/api/properties/${listingId}`)).status).toBe(404);
    expect((await ama.get(`/api/properties/${listingId}`)).status).toBe(404);
    expect((await ama.post("/api/favorites", { propertyId: listingId })).status).toBe(404);
    expect(
      (
        await ama.post("/api/viewings", {
          propertyId: listingId,
          preferredDate: isoDay(1),
          preferredTime: "11:00",
          phone: "0559876543",
          message: "Is this listing still available?",
        })
      ).status,
    ).toBe(404);
  });

  it("still shows it to the owner and admins", async () => {
    expect((await kwame.get(`/api/properties/${listingId}`)).status).toBe(200);
    expect((await admin.get(`/api/properties/${listingId}`)).status).toBe(200);
    const page = await kwame.get(`/properties/${listingId}`);
    expect(String(page.body)).toContain("hidden by an Efie Homes admin");
  });

  it("brings it back when unhidden", async () => {
    expect((await admin.patch(`/api/admin/properties/${listingId}`, { isHidden: false })).body.property.isHidden).toBe(false);
    expect((await search(`location=${tag}`)).total).toBe(1);
  });

  it("unfeatures a listing when it is hidden", async () => {
    await admin.patch(`/api/admin/properties/${listingId}`, { isFeatured: true });
    const hidden = await admin.patch(`/api/admin/properties/${listingId}`, { isHidden: true });
    expect(hidden.body.property).toMatchObject({ isHidden: true, isFeatured: false });
    await admin.patch(`/api/admin/properties/${listingId}`, { isHidden: false });
  });

  it("validates input", async () => {
    expect((await admin.patch(`/api/admin/properties/${listingId}`, {})).status).toBe(422);
    expect((await admin.patch(`/api/admin/properties/does-not-exist`, { isHidden: true })).status).toBe(404);
  });
});

describe("verifying landlords", () => {
  let efuaId: string;
  let originallyVerified: boolean;

  beforeAll(async () => {
    const efua = await as("efua");
    const me = (await efua.get("/api/auth/me")).body.user;
    efuaId = me.id;
    originallyVerified = me.isVerified;
  });

  afterAll(async () => {
    if (efuaId) await admin.patch(`/api/admin/users/${efuaId}`, { isVerified: originallyVerified });
  });

  it("toggles the verified badge", async () => {
    expect((await admin.patch(`/api/admin/users/${efuaId}`, { isVerified: true })).body.user.isVerified).toBe(true);
    expect((await admin.patch(`/api/admin/users/${efuaId}`, { isVerified: false })).body.user.isVerified).toBe(false);
  });

  it("only verifies landlord accounts", async () => {
    const amaId = (await ama.get("/api/auth/me")).body.user.id;
    expect((await admin.patch(`/api/admin/users/${amaId}`, { isVerified: true })).status).toBe(422);
  });
});

describe("demo data", () => {
  it("previews what a cleanup would remove (without deleting anything)", async () => {
    const res = await admin.get("/api/admin/demo-data");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ accounts: expect.any(Number), listings: expect.any(Number), viewings: expect.any(Number) });
    expect(res.body.accounts).toBeGreaterThan(0);
  });
});
