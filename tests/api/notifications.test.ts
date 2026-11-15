import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, DEMO_PASSWORD, isoDay, uniqueTag } from "./client";

type Item = { id: string; type: string; title: string; body: string | null; url: string; readAt: string | null };
type Inbox = { items: Item[]; unread: number };

let kwame: Client; // landlord
let tenant: Client; // fresh tenant, so their inbox starts empty
let listingId: string;
let viewingId: string;
const tag = uniqueTag();
const tenantName = `Notif Tester ${tag}`;
const title = `Notification test ${tag}`;

const inbox = async (c: Client) => (await c.get<Inbox>("/api/notifications")).body;

/** Notifications are written just after the response is sent, so poll briefly. */
async function waitFor(c: Client, match: (i: Item) => boolean, count = 1, timeoutMs = 10_000): Promise<Item[]> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = (await inbox(c)).items.filter(match);
    if (found.length >= count || Date.now() > deadline) return found;
    await new Promise((r) => setTimeout(r, 250));
  }
}

beforeAll(async () => {
  kwame = await as("kwame");
  tenant = anon();
  expect((await tenant.post("/api/auth/register", { name: tenantName, email: `${tag}@efiehomes.test`, password: DEMO_PASSWORD, role: "TENANT" })).status).toBe(201);
  listingId = await createListing(kwame, title);
});

afterAll(async () => {
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("in-app notifications", () => {
  it("need a signed-in user", async () => {
    expect((await anon().get("/api/notifications")).status).toBe(401);
    expect((await anon().patch("/api/notifications", { all: true })).status).toBe(401);
  });

  it("start empty for a new account", async () => {
    expect(await inbox(tenant)).toEqual({ items: [], unread: 0 });
  });

  it("tell the landlord about a viewing request", async () => {
    const res = await tenant.post("/api/viewings", {
      propertyId: listingId,
      preferredDate: isoDay(3),
      preferredTime: "10:00",
      phone: "0241234567",
      message: "Hello, I'd like to view this place please.",
    });
    expect(res.status).toBe(201);
    viewingId = res.body.viewing.id;

    const [n] = await waitFor(kwame, (i) => i.type === "VIEWING_REQUESTED" && i.title.includes(tenantName));
    expect(n).toMatchObject({ url: "/dashboard/landlord", readAt: null });
    expect(n.title).toContain(title);
  });

  it("tell the tenant when the landlord answers", async () => {
    expect((await kwame.patch(`/api/viewings/${viewingId}`, { status: "CONFIRMED", landlordNote: "See you at 10." })).status).toBe(200);
    const [n] = await waitFor(tenant, (i) => i.type === "VIEWING_ANSWERED");
    expect(n.title).toBe(`Viewing confirmed: ${title}`);
    expect(n.body).toBe("See you at 10.");
    expect((await inbox(tenant)).unread).toBe(1);
  });

  it("collapse a busy message thread into one unread item, cleared when the thread is opened", async () => {
    const thread = `/api/viewings/${viewingId}/messages`;
    const url = `/dashboard/landlord?thread=${viewingId}`;
    expect((await tenant.post(thread, { body: "First question: is there parking?" })).status).toBe(201);
    await waitFor(kwame, (i) => i.url === url && !i.readAt);
    expect((await tenant.post(thread, { body: "Second question: is water reliable?" })).status).toBe(201);
    await new Promise((r) => setTimeout(r, 1500));

    const unreadForThread = (await inbox(kwame)).items.filter((i) => i.url === url && !i.readAt);
    expect(unreadForThread).toHaveLength(1);
    expect(unreadForThread[0].body).toContain("Second question");

    expect((await kwame.get(thread)).status).toBe(200);
    expect((await inbox(kwame)).items.filter((i) => i.url === url && !i.readAt)).toHaveLength(0);
  });

  it("can be marked read, but only your own", async () => {
    const kwameItem = (await inbox(kwame)).items[0];
    const stolen = await tenant.patch("/api/notifications", { ids: [kwameItem.id] });
    expect(stolen.body).toEqual({ marked: 0 });

    expect((await tenant.patch("/api/notifications", { ids: [] })).status).toBe(422);
    expect((await tenant.patch("/api/notifications", { everything: true })).status).toBe(422);

    const [mine] = (await inbox(tenant)).items;
    expect((await tenant.patch("/api/notifications", { ids: [mine.id] })).body).toEqual({ marked: 1 });
    expect((await tenant.patch("/api/notifications", { all: true })).status).toBe(200);
    expect((await inbox(tenant)).unread).toBe(0);
  });

  it("tell admins about reported listings", async () => {
    const admin = await as("admin");
    expect((await tenant.post("/api/reports", { propertyId: listingId, reason: "WRONG_DETAILS", details: "Rent differs." })).status).toBe(201);
    const [n] = await waitFor(admin, (i) => i.type === "LISTING_REPORTED" && i.title.includes(title));
    expect(n.url).toBe("/dashboard/admin#reports");
    expect(n.body).toBe("Wrong details");
  });
});
