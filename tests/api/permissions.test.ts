import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, listingPayload, uniqueTag } from "./client";

let kwame: Client;
let akosua: Client;
let ama: Client;
let listingId: string;

beforeAll(async () => {
  [kwame, akosua, ama] = await Promise.all([as("kwame"), as("akosua"), as("ama")]);
  listingId = await createListing(kwame, `Permissions test ${uniqueTag()}`);
});

afterAll(async () => {
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("logged-out visitors", () => {
  it.each([
    ["GET", "/api/viewings"],
    ["GET", "/api/favorites"],
    ["POST", "/api/properties"],
    ["POST", "/api/viewings"],
    ["PATCH", "/api/profile"],
    ["GET", "/api/admin/demo-data"],
  ])("get 401 from %s %s", async (method, path) => {
    const res = await anon().request(method, path, method === "GET" ? undefined : {});
    expect(res.status).toBe(401);
  });

  it("are sent to login (with a return path) from dashboards", async () => {
    const res = await anon().get("/dashboard/landlord");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?next=%2Fdashboard%2Flandlord");
  });
});

describe("tenants", () => {
  it("can't create listings", async () => {
    expect((await ama.post("/api/properties", listingPayload("Tenant should not create this"))).status).toBe(403);
  });

  it("can't edit, rent out or delete listings", async () => {
    expect((await ama.patch(`/api/properties/${listingId}`, { status: "RENTED" })).status).toBe(403);
    expect((await ama.delete(`/api/properties/${listingId}`)).status).toBe(403);
  });

  it("are kept out of landlord and admin areas", async () => {
    expect((await ama.get("/dashboard/landlord")).headers.get("location")).toMatch(/\/dashboard\/tenant$/);
    expect((await ama.get("/dashboard/admin")).headers.get("location")).toMatch(/\/dashboard\/tenant$/);
    expect((await ama.patch(`/api/admin/properties/${listingId}`, { isHidden: true })).status).toBe(403);
  });
});

describe("landlords", () => {
  it("can't edit, rent out or delete another landlord's listing", async () => {
    expect((await akosua.patch(`/api/properties/${listingId}`, listingPayload("Hijacked title for this listing"))).status).toBe(403);
    expect((await akosua.patch(`/api/properties/${listingId}`, { status: "RENTED" })).status).toBe(403);
    expect((await akosua.delete(`/api/properties/${listingId}`)).status).toBe(403);
  });

  it("can't request viewings or use admin tools", async () => {
    expect((await kwame.post("/api/viewings", {})).status).toBe(403);
    expect((await kwame.get("/api/admin/demo-data")).status).toBe(403);
    expect((await kwame.delete("/api/admin/demo-data")).status).toBe(403);
    expect((await kwame.get("/dashboard/admin")).headers.get("location")).toMatch(/\/dashboard\/landlord$/);
  });
});
