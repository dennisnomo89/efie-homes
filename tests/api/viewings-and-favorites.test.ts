import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, Client, createListing, isoDay, uniqueTag } from "./client";

let kwame: Client;
let akosua: Client;
let abena: Client;
let listingId: string;

const request = () => ({
  propertyId: listingId,
  preferredDate: isoDay(2),
  preferredTime: "10:00",
  phone: "050 123 4567",
  message: "Hello, I would like to view this place on the date above.",
});

beforeAll(async () => {
  [kwame, akosua, abena] = await Promise.all([as("kwame"), as("akosua"), as("abena")]);
  listingId = await createListing(kwame, `Viewing flow ${uniqueTag()}`);
});

afterAll(async () => {
  // Deleting the listing also removes its viewing requests and saves.
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("viewing requests", () => {
  it("rejects bad input with field errors", async () => {
    const res = await abena.post("/api/viewings", { ...request(), preferredDate: isoDay(-1), phone: "123" });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(["preferredDate", "phone"]));
  });

  it("lets a tenant request, then cancel, a viewing", async () => {
    const created = await abena.post("/api/viewings", request());
    expect(created.status).toBe(201);
    expect(created.body.viewing).toMatchObject({ status: "PENDING", phone: "0501234567" });

    expect((await abena.post("/api/viewings", request())).status).toBe(409); // duplicate pending
    expect((await abena.delete(`/api/viewings/${created.body.viewing.id}`)).status).toBe(200);
  });

  it("runs the full request → confirm flow", async () => {
    const { body } = await abena.post("/api/viewings", request());
    const viewingId = body.viewing.id;

    // The listing's landlord sees it; another landlord can't answer it.
    const inbox = await kwame.get("/api/viewings");
    expect(inbox.body.viewings.map((v: { id: string }) => v.id)).toContain(viewingId);
    expect((await akosua.get("/api/viewings")).body.viewings.map((v: { id: string }) => v.id)).not.toContain(viewingId);
    expect((await akosua.patch(`/api/viewings/${viewingId}`, { status: "CONFIRMED" })).status).toBe(403);

    const confirmed = await kwame.patch(`/api/viewings/${viewingId}`, { status: "CONFIRMED", landlordNote: "See you at 10." });
    expect(confirmed.status).toBe(200);

    const mine = (await abena.get("/api/viewings")).body.viewings.find((v: { id: string }) => v.id === viewingId);
    expect(mine).toMatchObject({ status: "CONFIRMED", landlordNote: "See you at 10." });

    // Only pending requests can be cancelled.
    expect((await abena.delete(`/api/viewings/${viewingId}`)).status).toBe(409);
  });

  it("refuses viewings on rented homes", async () => {
    await kwame.patch(`/api/properties/${listingId}`, { status: "RENTED" });
    try {
      const kofi = await as("kofi");
      expect((await kofi.post("/api/viewings", request())).status).toBe(409);
    } finally {
      await kwame.patch(`/api/properties/${listingId}`, { status: "AVAILABLE" });
    }
  });
});

describe("wishlist", () => {
  it("saves (idempotently), lists and removes a home", async () => {
    expect((await abena.post("/api/favorites", { propertyId: listingId })).status).toBe(201);
    expect((await abena.post("/api/favorites", { propertyId: listingId })).status).toBe(201);

    const list = await abena.get("/api/favorites");
    expect(list.body.favorites.filter((f: { propertyId: string }) => f.propertyId === listingId)).toHaveLength(1);

    expect((await abena.delete(`/api/favorites/${listingId}`)).status).toBe(200);
    const after = await abena.get("/api/favorites");
    expect(after.body.favorites.some((f: { propertyId: string }) => f.propertyId === listingId)).toBe(false);
  });

  it("404s for a listing that doesn't exist", async () => {
    expect((await abena.post("/api/favorites", { propertyId: "does-not-exist" })).status).toBe(404);
  });
});
