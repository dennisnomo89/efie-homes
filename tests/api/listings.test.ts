import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, listingPayload, search, uniqueTag } from "./client";

let kwame: Client;
const tag = uniqueTag();
let id: string | undefined;

beforeAll(async () => {
  kwame = await as("kwame");
});

afterAll(async () => {
  if (id) await kwame.delete(`/api/properties/${id}`);
});

describe("listing lifecycle", () => {
  it("rejects an invalid listing with field errors", async () => {
    const res = await kwame.post("/api/properties", listingPayload("Too short", { images: [], monthlyRent: "abc" }));
    expect(res.status).toBe(422);
    expect(res.body.errors).toMatchObject({ images: expect.any(String), monthlyRent: expect.any(String), title: expect.any(String) });
  });

  it("creates a listing", async () => {
    const res = await kwame.post("/api/properties", listingPayload(`Listing lifecycle ${tag}`));
    expect(res.status).toBe(201);
    id = res.body.property.id;
    expect(res.body.property).toMatchObject({ monthlyRent: 2500, status: "AVAILABLE", isHidden: false, amenities: ["ECG_PREPAID", "WALLED_GATED"] });
  });

  it("shows it publicly and in search", async () => {
    expect((await anon().get(`/api/properties/${id}`)).status).toBe(200);
    expect((await search(`location=${tag}`)).properties.map((p) => p.id)).toEqual([id]);
    // case-insensitive
    expect((await search(`location=${tag.toUpperCase()}`)).total).toBe(1);
  });

  it("finds it with matching filters and not with conflicting ones", async () => {
    expect((await search(`location=${tag}&maxPrice=3000&bedrooms=2&amenities=WALLED_GATED&advance=12`)).total).toBe(1);
    expect((await search(`location=${tag}&maxPrice=2000`)).total).toBe(0);
    expect((await search(`location=${tag}&advance=6`)).total).toBe(0);
    expect((await search(`location=${tag}&amenities=GENERATOR_SOLAR`)).total).toBe(0);
  });

  it("updates it", async () => {
    const res = await kwame.patch(`/api/properties/${id}`, listingPayload(`Listing lifecycle ${tag}`, { monthlyRent: 2700, advanceMonths: 6 }));
    expect(res.status).toBe(200);
    expect(res.body.property).toMatchObject({ monthlyRent: 2700, advanceMonths: 6 });
  });

  it("drops out of default search when marked rented, and comes back", async () => {
    expect((await kwame.patch(`/api/properties/${id}`, { status: "RENTED" })).body.property.status).toBe("RENTED");
    expect((await search(`location=${tag}`)).total).toBe(0);
    expect((await search(`location=${tag}&includeRented=true`)).total).toBe(1);
    await kwame.patch(`/api/properties/${id}`, { status: "AVAILABLE" });
    expect((await search(`location=${tag}`)).total).toBe(1);
  });

  it("deletes it", async () => {
    expect((await kwame.delete(`/api/properties/${id}`)).status).toBe(200);
    expect((await anon().get(`/api/properties/${id}`)).status).toBe(404);
    id = undefined;
  });
});
