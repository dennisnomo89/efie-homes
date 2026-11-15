import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, DEMO_PASSWORD, listingPayload, uniqueTag } from "./client";
import { outboxEnabled, waitForEmails } from "./outbox";

/*
 * A fresh tenant per run (so the once-a-day email limit per saved home never carries over between runs)
 * saves two of Kwame's test listings; Kwame then cuts the rent on one and re-lists the other.
 */
let kwame: Client;
let tenant: Client;
let tenantEmail: string;
let dropId: string;
let relistId: string;
const tag = uniqueTag();
const dropTitle = `Price drop test ${tag}`;
const relistTitle = `Relist test ${tag}`;

/** Listing page HTML with React's text-joining comments removed. */
const listingHtml = async (id: string) => ((await anon().get(`/properties/${id}`)).body as string).replace(/<!-- -->/g, "");

const update = (id: string, title: string, overrides: Record<string, unknown>) => kwame.patch(`/api/properties/${id}`, listingPayload(title, overrides));

beforeAll(async () => {
  kwame = await as("kwame");
  tenant = anon();
  tenantEmail = `${tag}@efiehomes.test`;
  expect((await tenant.post("/api/auth/register", { name: "Wishlist Tester", email: tenantEmail, password: DEMO_PASSWORD, role: "TENANT" })).status).toBe(201);
  dropId = await createListing(kwame, dropTitle, { monthlyRent: 5000 });
  relistId = await createListing(kwame, relistTitle);
  for (const id of [dropId, relistId]) expect((await tenant.post("/api/favorites", { propertyId: id })).status).toBeLessThan(300);
});

afterAll(async () => {
  for (const id of [dropId, relistId]) if (id) await kwame.delete(`/api/properties/${id}`);
});

describe("price drops", () => {
  it("emails the tenant who saved the home and shows the old price", async () => {
    const since = new Date();
    expect((await update(dropId, dropTitle, { monthlyRent: 4250 })).status).toBe(200);

    const page = await listingHtml(dropId);
    expect(page).toContain("Price dropped 15%");
    expect(page).toMatch(/<s>₵\s?5,000<\/s>/);

    if (outboxEnabled) {
      const [email] = await waitForEmails(tenantEmail, since, 1, 10_000, "Price drop");
      expect(email.subject).toContain(dropTitle);
      expect(email.text).toContain("5,000");
      expect(email.text).toContain("4,250");
      expect(email.headers?.["List-Unsubscribe"]).toContain("/api/wishlist-alerts/unsubscribe");
    }
  });

  it("sends at most one email a day per saved home, and keeps the original 'was' price", async () => {
    const since = new Date();
    expect((await update(dropId, dropTitle, { monthlyRent: 4000 })).status).toBe(200);
    expect(await listingHtml(dropId)).toContain("Price dropped 20%");
    if (outboxEnabled) expect(await waitForEmails(tenantEmail, since, 1, 3000, "Price drop")).toHaveLength(0);
  });

  it("removes the badge when the rent goes back up", async () => {
    expect((await update(dropId, dropTitle, { monthlyRent: 5200 })).status).toBe(200);
    expect(await listingHtml(dropId)).not.toContain("Price dropped");
  });
});

describe("back on the market", () => {
  it("emails savers when a rented home becomes available again", async () => {
    expect((await kwame.patch(`/api/properties/${relistId}`, { status: "RENTED" })).status).toBe(200);
    const since = new Date();
    expect((await kwame.patch(`/api/properties/${relistId}`, { status: "AVAILABLE" })).status).toBe(200);
    if (outboxEnabled) {
      const [email] = await waitForEmails(tenantEmail, since, 1, 10_000, "Available again");
      expect(email.subject).toContain(relistTitle);
    }
  });
});

describe("turning wishlist emails off", () => {
  it("is for tenants and needs a real boolean", async () => {
    expect((await kwame.patch("/api/wishlist-alerts", { wishlistAlerts: false })).status).toBe(403);
    expect((await anon().patch("/api/wishlist-alerts", { wishlistAlerts: false })).status).toBe(401);
    expect((await tenant.patch("/api/wishlist-alerts", { wishlistAlerts: "no" })).status).toBe(422);
  });

  it("works from the dashboard toggle", async () => {
    const off = await tenant.patch("/api/wishlist-alerts", { wishlistAlerts: false });
    expect(off.status).toBe(200);
    expect(off.body).toEqual({ wishlistAlerts: false });
    expect((await tenant.get("/dashboard/tenant")).body).toContain("Price-drop emails off");
    expect((await tenant.patch("/api/wishlist-alerts", { wishlistAlerts: true })).body).toEqual({ wishlistAlerts: true });
  });

  it.runIf(outboxEnabled)("works from the link in the email, and rejects tampered links", async () => {
    const [email] = await waitForEmails(tenantEmail, new Date(0), 1, 1000, "Price drop");
    const link = email.headers!["List-Unsubscribe"].slice(1, -1);
    const url = new URL(link);
    const path = url.pathname + url.search;

    const bad = await anon().get(path.replace(/token=[^&]+/, "token=forged"));
    expect(bad.headers.get("location")).toContain("status=invalid");

    const good = await anon().get(path);
    expect(good.status).toBe(307);
    expect(good.headers.get("location")).toMatch(/\/unsubscribed\?kind=wishlist&status=ok/);
    expect((await tenant.get("/dashboard/tenant")).body).toContain("Price-drop emails off");

    // Mail providers' one-click POST works too.
    expect((await anon().post(path)).status).toBe(200);
  });
});
