import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, isoDay, uniqueTag } from "./client";
import { outboxEnabled, waitForEmails } from "./outbox";

let kwame: Client; // landlord of the test listing
let abena: Client; // tenant who viewed it
let kofi: Client; // tenant with a viewing that hasn't happened yet
let listingId: string;
let pastViewingId: string; // confirmed, today → reviewable
let futureViewingId: string; // confirmed, in 3 days → not yet
let reviewId: string;
let kwameId: string;
const title = `Review test ${uniqueTag()}`;

async function requestViewing(tenant: Client, date: string) {
  const res = await tenant.post("/api/viewings", {
    propertyId: listingId,
    preferredDate: date,
    preferredTime: "11:00",
    phone: "0501234567",
    message: "Hello, I'd like to view this place please.",
  });
  expect(res.status).toBe(201);
  return res.body.viewing.id as string;
}

const confirm = (id: string) => kwame.patch(`/api/viewings/${id}`, { status: "CONFIRMED" });

const profile = async () => {
  const res = await anon().get(`/landlords/${kwameId}`);
  expect(res.status).toBe(200);
  return res.body as string;
};

beforeAll(async () => {
  [kwame, abena, kofi] = await Promise.all([as("kwame"), as("abena"), as("kofi")]);
  listingId = await createListing(kwame, title);
  kwameId = (await kwame.get("/api/auth/me")).body.user.id;
  pastViewingId = await requestViewing(abena, isoDay(0));
  futureViewingId = await requestViewing(kofi, isoDay(3));
});

afterAll(async () => {
  // Reviews keep their snapshot when a listing is deleted, so remove the review explicitly.
  if (reviewId) await abena.delete(`/api/reviews/${reviewId}`);
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

const review = (viewingRequestId: string, extra: Record<string, unknown> = {}) => ({
  viewingRequestId,
  landlordRating: 4,
  accuracyRating: 5,
  comment: "Punctual and helpful; the flat matched the photos.",
  ...extra,
});

describe("who can leave a review", () => {
  it("needs a confirmed viewing", async () => {
    const res = await abena.post("/api/reviews", review(pastViewingId));
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/confirmed viewing/i);
  });

  it("needs the viewing to have taken place", async () => {
    expect((await confirm(futureViewingId)).status).toBe(200);
    const res = await kofi.post("/api/reviews", review(futureViewingId));
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/taken place/i);
  });

  it("is limited to the tenant who made the viewing", async () => {
    expect((await confirm(pastViewingId)).status).toBe(200);
    expect((await kofi.post("/api/reviews", review(pastViewingId))).status).toBe(403);
    expect((await kwame.post("/api/reviews", review(pastViewingId))).status).toBe(403);
    expect((await anon().post("/api/reviews", review(pastViewingId))).status).toBe(401);
  });

  it("validates ratings and comment length", async () => {
    const bad = await abena.post("/api/reviews", review(pastViewingId, { landlordRating: 6, accuracyRating: 0, comment: "x".repeat(1001) }));
    expect(bad.status).toBe(422);
    expect(Object.keys(bad.body.errors ?? {})).toEqual(expect.arrayContaining(["landlordRating", "accuracyRating", "comment"]));
    expect((await abena.post("/api/reviews", review("does-not-exist"))).status).toBe(404);
  });
});

describe("posting, editing and replying", () => {
  it("creates the review, emails the landlord and allows only one per viewing", async () => {
    const since = new Date();
    const res = await abena.post("/api/reviews", review(pastViewingId));
    expect(res.status).toBe(201);
    expect(res.body.review).toMatchObject({ landlordRating: 4, accuracyRating: 5, propertyTitle: title, isHidden: false });
    reviewId = res.body.review.id;

    const again = await abena.post("/api/reviews", review(pastViewingId));
    expect(again.status).toBe(409);

    if (outboxEnabled) {
      const [email] = await waitForEmails("kwame@efiehomes.test", since, 1, 10_000, "review");
      expect(email.text).toContain(title);
      expect(email.text).toContain("Punctual and helpful");
    }
  });

  it("shows on the landlord's public profile with a short reviewer name", async () => {
    const html = await profile();
    expect(html).toContain("Punctual and helpful");
    expect(html).toContain("Abena D.");
    expect(html).not.toContain("Abena Darko");
  });

  it("lets the author edit ratings without losing the comment, and clear the comment", async () => {
    const res = await abena.patch(`/api/reviews/${reviewId}`, { landlordRating: 5 });
    expect(res.status).toBe(200);
    expect(res.body.review).toMatchObject({ landlordRating: 5, accuracyRating: 5, comment: "Punctual and helpful; the flat matched the photos." });

    const cleared = await abena.patch(`/api/reviews/${reviewId}`, { comment: "" });
    expect(cleared.body.review.comment).toBeNull();
    await abena.patch(`/api/reviews/${reviewId}`, { comment: "Punctual and helpful." });

    expect((await abena.patch(`/api/reviews/${reviewId}`, {})).status).toBe(422);
    expect((await kofi.patch(`/api/reviews/${reviewId}`, { landlordRating: 1 })).status).toBe(403);
  });

  it("lets only the reviewed landlord reply", async () => {
    const akosua = await as("akosua");
    expect((await akosua.patch(`/api/reviews/${reviewId}`, { landlordReply: "Thanks!" })).status).toBe(403);
    expect((await abena.patch(`/api/reviews/${reviewId}`, { landlordReply: "Thanks!" })).status).toBe(403);
    expect((await kwame.patch(`/api/reviews/${reviewId}`, { landlordReply: "  " })).status).toBe(422);

    const res = await kwame.patch(`/api/reviews/${reviewId}`, { landlordReply: "Thank you, Abena!" });
    expect(res.status).toBe(200);
    expect(res.body.review.repliedAt).not.toBeNull();
    expect(await profile()).toContain("Thank you, Abena!");
  });

  it("can't be used by the landlord to change ratings", async () => {
    const res = await kwame.patch(`/api/reviews/${reviewId}`, { landlordRating: 5 });
    expect(res.status).toBe(403);
  });
});

describe("moderation", () => {
  it("lets only admins hide a review, which removes it from the profile", async () => {
    expect((await kwame.patch(`/api/reviews/${reviewId}`, { isHidden: true })).status).toBe(403);
    expect((await abena.patch(`/api/reviews/${reviewId}`, { isHidden: true })).status).toBe(403);

    const admin = await as("admin");
    expect((await admin.patch(`/api/reviews/${reviewId}`, { isHidden: true })).status).toBe(200);
    expect(await profile()).not.toContain("Punctual and helpful");

    expect((await admin.patch(`/api/reviews/${reviewId}`, { isHidden: false })).status).toBe(200);
    expect(await profile()).toContain("Punctual and helpful");
  });

  it("lets the author delete their review, and then review again", async () => {
    expect((await kwame.delete(`/api/reviews/${reviewId}`)).status).toBe(403);
    expect((await abena.delete(`/api/reviews/${reviewId}`)).status).toBe(200);
    expect((await abena.delete(`/api/reviews/${reviewId}`)).status).toBe(404);
    reviewId = "";

    const res = await abena.post("/api/reviews", review(pastViewingId, { comment: "" }));
    expect(res.status).toBe(201);
    expect(res.body.review.comment).toBeNull();
    reviewId = res.body.review.id;
  });
});

describe("profile pages", () => {
  it("404s for unknown users and for tenants", async () => {
    expect((await anon().get("/landlords/does-not-exist")).status).toBe(404);
    const abenaId = (await abena.get("/api/auth/me")).body.user.id;
    expect((await anon().get(`/landlords/${abenaId}`)).status).toBe(404);
  });

  it("are linked from listing pages", async () => {
    const res = await anon().get(`/properties/${listingId}`);
    expect(res.body).toContain(`/landlords/${kwameId}`);
  });
});
