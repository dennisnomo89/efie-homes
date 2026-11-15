import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, Client, createListing, isoDay, uniqueTag } from "./client";
import { outboxEnabled, waitForEmails } from "./outbox";

let kwame: Client; // landlord of the listing
let abena: Client; // tenant who requested the viewing
let listingId: string;
let viewingId: string;
const title = `Messaging test ${uniqueTag()}`;
const thread = () => `/api/viewings/${viewingId}/messages`;

beforeAll(async () => {
  [kwame, abena] = await Promise.all([as("kwame"), as("abena")]);
  listingId = await createListing(kwame, title);
  const res = await abena.post("/api/viewings", {
    propertyId: listingId,
    preferredDate: isoDay(4),
    preferredTime: "11:00",
    phone: "0501234567",
    message: "Hello, I'd like to view this place please.",
  });
  expect(res.status).toBe(201);
  viewingId = res.body.viewing.id;
});

afterAll(async () => {
  // Deleting the listing removes the viewing request and its messages.
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("viewing request messages", () => {
  it("starts empty for both participants", async () => {
    const res = await abena.get(thread());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ canPost: true, messages: [], viewing: { propertyTitle: title } });
  });

  it("delivers a tenant's message to the landlord and marks it read when opened", async () => {
    const sent = await abena.post(thread(), { body: "  Is there parking for two cars?  " });
    expect(sent.status).toBe(201);
    expect(sent.body.message).toMatchObject({ body: "Is there parking for two cars?", mine: true, from: "tenant", readAt: null });

    const landlordView = await kwame.get(thread());
    expect(landlordView.body.messages).toHaveLength(1);
    expect(landlordView.body.messages[0]).toMatchObject({ mine: false, from: "tenant" });

    // The tenant now sees it as read.
    const tenantView = await abena.get(thread());
    expect(tenantView.body.messages[0].readAt).not.toBeNull();
  });

  it("lets the landlord reply, in order", async () => {
    expect((await kwame.post(thread(), { body: "Yes, the compound fits two cars." })).status).toBe(201);
    const view = await abena.get(thread());
    expect(view.body.messages.map((m: { body: string }) => m.body)).toEqual([
      "Is there parking for two cars?",
      "Yes, the compound fits two cars.",
    ]);
    expect(view.body.messages[1]).toMatchObject({ mine: false, from: "landlord" });
  });

  it("keeps other tenants and landlords out", async () => {
    const [kofi, akosua] = await Promise.all([as("kofi"), as("akosua")]);
    expect((await kofi.get(thread())).status).toBe(403);
    expect((await kofi.post(thread(), { body: "Hi" })).status).toBe(403);
    expect((await akosua.get(thread())).status).toBe(403);
  });

  it("lets admins read but not post", async () => {
    const admin = await as("admin");
    const view = await admin.get(thread());
    expect(view.status).toBe(200);
    expect(view.body.canPost).toBe(false);
    expect((await admin.post(thread(), { body: "Admin here" })).status).toBe(403);
  });

  it("validates message length", async () => {
    expect((await abena.post(thread(), { body: "   " })).status).toBe(422);
    expect((await abena.post(thread(), { body: "x".repeat(2001) })).status).toBe(422);
  });

  it("404s for a thread that doesn't exist", async () => {
    expect((await abena.get("/api/viewings/does-not-exist/messages")).status).toBe(404);
  });
});

describe.skipIf(!outboxEnabled)("message emails", () => {
  it("emails the other person once per burst of unread messages", async () => {
    const start = new Date();
    await abena.post(thread(), { body: "One more thing: is water flow regular?" });
    const first = await waitForEmails("kwame@efiehomes.test", start, 1, 10_000, "New message from");
    expect(first).toHaveLength(1);
    expect(first[0].subject).toBe(`New message from Abena Darko: ${title}`);
    expect(first[0].text).toContain("is water flow regular?");
    expect(first[0].text).toContain(`/dashboard/landlord?thread=${viewingId}`);

    // A second message while the first is still unread doesn't send another email…
    await abena.post(thread(), { body: "And is there a borehole?" });
    expect(await waitForEmails("kwame@efiehomes.test", start, 2, 2_500, "New message from")).toHaveLength(1);

    // …but once the landlord has read the thread, the next message does.
    await kwame.get(thread());
    const afterRead = new Date();
    await abena.post(thread(), { body: "Thanks!" });
    expect(await waitForEmails("kwame@efiehomes.test", afterRead, 1, 10_000, "New message from")).toHaveLength(1);
  });

  it("emails the tenant when the landlord replies", async () => {
    const start = new Date();
    await kwame.post(thread(), { body: "Water flows daily, and yes, there's a borehole." });
    const [mail] = await waitForEmails("abena@efiehomes.test", start, 1, 10_000, "New message from");
    expect(mail.subject).toBe(`New message from Kwame Mensah: ${title}`);
    expect(mail.text).toContain(`/dashboard/tenant?thread=${viewingId}`);
  });
});
