import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, listingPayload, uniqueTag } from "./client";
import { outboxEnabled, waitForEmails } from "./outbox";

/** A fresh tenant per run, so saved searches and the per-search alert throttle start clean. */
async function freshTenant() {
  const email = `${uniqueTag()}@efiehomes.test`;
  const c = anon();
  expect((await c.post("/api/auth/register", { name: "Search Tester", email, password: "Password123", role: "TENANT" })).status).toBe(201);
  return { c, email };
}

let kwame: Client;
const created: string[] = [];
const tag = uniqueTag(); // unique neighbourhood text so only our listings match

beforeAll(async () => {
  kwame = await as("kwame");
});

afterAll(async () => {
  for (const id of created) await kwame.delete(`/api/properties/${id}`);
});

async function listHome(overrides: Record<string, unknown> = {}) {
  const res = await kwame.post("/api/properties", listingPayload(`Alert test ${tag} ${uniqueTag()}`, { address: `Street ${tag}`, ...overrides }));
  expect(res.status).toBe(201);
  created.push(res.body.property.id);
  return res.body.property.id as string;
}

describe("saving searches", () => {
  it("saves a search once, with a readable name, ignoring page and sort", async () => {
    const { c } = await freshTenant();
    const first = await c.post("/api/saved-searches", { query: `?location=${tag}&bedrooms=2&maxPrice=3000&page=2&sort=price_asc` });
    expect(first.status).toBe(201);
    expect(first.body.search).toMatchObject({ name: `Any home · 2+ beds · ${tag} · up to ₵ 3,000`, query: `location=${tag}&maxPrice=3000&bedrooms=2`, emailAlerts: true });

    const again = await c.post("/api/saved-searches", { query: `bedrooms=2&location=${tag}&maxPrice=3000` });
    expect(again.status).toBe(200);
    expect(again.body.alreadySaved).toBe(true);
    expect((await c.get("/api/saved-searches")).body.searches).toHaveLength(1);
  });

  it("needs at least one filter, and allows up to 10 searches", async () => {
    const { c } = await freshTenant();
    expect((await c.post("/api/saved-searches", { query: "sort=price_asc" })).status).toBe(422);
    for (let i = 1; i <= 10; i++) expect((await c.post("/api/saved-searches", { query: `maxPrice=${i * 1000}` })).status).toBe(201);
    expect((await c.post("/api/saved-searches", { query: "maxPrice=99999" })).status).toBe(409);
  });

  it("is for tenants only, and each tenant only sees their own", async () => {
    expect((await kwame.post("/api/saved-searches", { query: "location=Osu" })).status).toBe(403);
    expect((await anon().get("/api/saved-searches")).status).toBe(401);

    const { c: a } = await freshTenant();
    const { c: b } = await freshTenant();
    const saved = await a.post("/api/saved-searches", { query: "location=Osu" });
    expect((await b.get("/api/saved-searches")).body.searches).toHaveLength(0);
    expect((await b.patch(`/api/saved-searches/${saved.body.search.id}`, { emailAlerts: false })).status).toBe(404);
    expect((await b.delete(`/api/saved-searches/${saved.body.search.id}`)).status).toBe(404);
  });

  it("counts new matches until the results are opened", async () => {
    const { c } = await freshTenant();
    const { body } = await c.post("/api/saved-searches", { query: `location=${tag}&type=TOWNHOUSE` });
    await listHome({ propertyType: "TOWNHOUSE" });
    const listed = (await c.get("/api/saved-searches")).body.searches[0];
    expect(listed).toMatchObject({ total: 1, newSince: 1 });

    const open = await c.get(`/api/saved-searches/${body.search.id}/open`);
    expect(open.headers.get("location")).toMatch(new RegExp(`/properties\\?location=${tag}&type=TOWNHOUSE$`));
    expect((await c.get("/api/saved-searches")).body.searches[0].newSince).toBe(0);
  });

  it("can turn alerts off and be deleted", async () => {
    const { c } = await freshTenant();
    const { body } = await c.post("/api/saved-searches", { query: "location=Osu&bedrooms=3" });
    expect((await c.patch(`/api/saved-searches/${body.search.id}`, { emailAlerts: false })).body.search.emailAlerts).toBe(false);
    expect((await c.delete(`/api/saved-searches/${body.search.id}`)).status).toBe(200);
    expect((await c.get("/api/saved-searches")).body.searches).toHaveLength(0);
  });
});

describe.skipIf(!outboxEnabled)("alert emails", () => {
  it("emails a matching tenant once, then throttles, and never emails non-matching ones", async () => {
    const { c: matching, email: matchingEmail } = await freshTenant();
    const { c: other, email: otherEmail } = await freshTenant();
    await matching.post("/api/saved-searches", { query: `location=${tag}&maxPrice=3000&bedrooms=2` });
    await other.post("/api/saved-searches", { query: `location=${tag}&bedrooms=4` });

    const start = new Date();
    const id = await listHome({ monthlyRent: 2800, bedrooms: 2 });
    const [mail] = await waitForEmails(matchingEmail, start, 1, 10_000, "New match");
    expect(mail.subject).toMatch(/^New match: Alert test .*\(₵ 2,800\/month\)$/);
    expect(mail.text).toContain(`/properties/${id}`);
    expect(mail.text).toMatch(/\/api\/saved-searches\/[^/]+\/unsubscribe\?token=/);
    expect(mail.headers?.["List-Unsubscribe"]).toMatch(/^<https?:\/\/.+\/unsubscribe\?token=.+>$/);
    expect(await waitForEmails(otherEmail, start, 1, 2_000, "New match")).toHaveLength(0);

    // A second match within 3 hours doesn't send another email for the same search.
    const second = new Date();
    await listHome({ monthlyRent: 2900, bedrooms: 3 });
    expect(await waitForEmails(matchingEmail, second, 1, 2_500, "New match")).toHaveLength(0);
  });

  it("doesn't email the landlord about their own listing", async () => {
    const before = new Date();
    await listHome({ monthlyRent: 2000 });
    expect(await waitForEmails("kwame@efiehomes.test", before, 1, 2_000, "New match")).toHaveLength(0);
  });

  it("stops alerts from the email's unsubscribe link without logging in", async () => {
    const { c, email } = await freshTenant();
    const { body } = await c.post("/api/saved-searches", { query: `location=${tag}&type=DETACHED` });
    const start = new Date();
    await listHome({ propertyType: "DETACHED" });
    const [mail] = await waitForEmails(email, start, 1, 10_000, "New match");
    const link = mail.text.match(/(https?:\/\/\S+\/unsubscribe\?token=\S+)/)![1];
    const path = link.replace(/^https?:\/\/[^/]+/, "");

    expect((await anon().get(path.replace(/token=[^&]+/, "token=forged"))).headers.get("location")).toMatch(/\/unsubscribed\?status=invalid$/);
    expect((await anon().get(path)).headers.get("location")).toMatch(/\/unsubscribed\?status=ok$/);
    const after = (await c.get("/api/saved-searches")).body.searches.find((s: { id: string }) => s.id === body.search.id);
    expect(after.emailAlerts).toBe(false);
  });
});
