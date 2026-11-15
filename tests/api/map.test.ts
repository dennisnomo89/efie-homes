import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, listingPayload, uniqueTag } from "./client";

let kwame: Client;
let admin: Client;
let id: string;
const tag = uniqueTag();
const EXACT = { latitude: 5.637891, longitude: -0.161449 };

beforeAll(async () => {
  [kwame, admin] = await Promise.all([as("kwame"), as("admin")]);
  const res = await kwame.post("/api/properties", listingPayload(`Map test ${tag}`, { neighborhood: "East Legon", ...EXACT }));
  expect(res.status).toBe(201);
  id = res.body.property.id;
});

afterAll(async () => {
  if (id) await kwame.delete(`/api/properties/${id}`);
});

describe("map pins", () => {
  it("never exposes the exact pin publicly", async () => {
    const res = await anon().get(`/api/properties/${id}`);
    expect(res.body.property.latitude).toBe(5.638);
    expect(res.body.property.longitude).toBe(-0.161);
    expect(JSON.stringify(res.body)).not.toContain("5.637891");
  });

  it("shows the listing on the map, with filters applied", async () => {
    const res = await anon().get(`/api/properties/map?location=${tag}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.unpinned).toBe(0);
    expect(res.body.pins).toEqual([
      expect.objectContaining({ id, lat: 5.638, lng: -0.161, monthlyRent: 2500, neighborhood: "East Legon" }),
    ]);
    expect((await anon().get(`/api/properties/map?location=${tag}&maxPrice=1000`)).body.pins).toHaveLength(0);
  });

  it("counts listings without a pin separately", async () => {
    await kwame.patch(`/api/properties/${id}`, listingPayload(`Map test ${tag}`, { neighborhood: "East Legon", latitude: null, longitude: null }));
    const res = await anon().get(`/api/properties/map?location=${tag}`);
    expect(res.body).toMatchObject({ total: 1, unpinned: 1, pins: [] });
    await kwame.patch(`/api/properties/${id}`, listingPayload(`Map test ${tag}`, { neighborhood: "East Legon", ...EXACT }));
  });

  it("keeps hidden listings off the map", async () => {
    await admin.patch(`/api/admin/properties/${id}`, { isHidden: true });
    try {
      expect((await anon().get(`/api/properties/map?location=${tag}`)).body.pins).toHaveLength(0);
    } finally {
      await admin.patch(`/api/admin/properties/${id}`, { isHidden: false });
    }
  });

  it("rejects pins outside Ghana or with one coordinate", async () => {
    const lagos = await kwame.post("/api/properties", listingPayload(`Map test bad ${tag}`, { latitude: 6.52, longitude: 3.38 }));
    expect(lagos.status).toBe(422);
    expect(lagos.body.errors.latitude).toMatch(/inside Ghana/);
    expect((await kwame.post("/api/properties", listingPayload(`Map test bad ${tag}`, { latitude: 5.6 }))).status).toBe(422);
  });

  it("puts the seeded demo listings on the map", async () => {
    const res = await anon().get("/api/properties/map?region=Ashanti");
    expect(res.body.pins.length).toBeGreaterThan(0);
    for (const p of res.body.pins) expect(p.lat).toBeGreaterThan(6.5);
  });
});
