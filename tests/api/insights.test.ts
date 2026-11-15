import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, uniqueTag } from "./client";

let kwame: Client;
let listingId: string;
const title = `Insights test ${uniqueTag()}`;
const insights = () => `/dashboard/landlord/properties/${listingId}/insights`;
const BROWSER = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

/** The 30-day views tile's number, read from the page. */
async function periodViews(): Promise<number> {
  const html = ((await kwame.get(insights())).body as string).replace(/<!-- -->/g, "");
  const m = html.match(/Views · last 30 days<\/p><p[^>]*>([\d,]+)</);
  if (!m) throw new Error("views tile not found");
  return Number(m[1].replace(/,/g, ""));
}

beforeAll(async () => {
  kwame = await as("kwame");
  listingId = await createListing(kwame, title);
});

afterAll(async () => {
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("listing insights", () => {
  it("starts at zero for a new listing", async () => {
    const res = await kwame.get(insights());
    expect(res.status).toBe(200);
    expect(res.body).toContain(title);
    expect(await periodViews()).toBe(0);
  });

  it("counts public views by people, but not the owner's or robots'", async () => {
    const visit = (ua: string, c: Client = anon()) => c.request("GET", `/properties/${listingId}`, undefined, { headers: { "User-Agent": ua } });
    await visit(BROWSER);
    await visit(BROWSER);
    await visit("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
    await visit("WhatsApp/2.23.20.0");
    await visit(BROWSER, kwame); // the owner
    expect(await periodViews()).toBe(2);
  });

  it("shows saves and viewing requests from tenants", async () => {
    const abena = await as("abena");
    expect((await abena.post("/api/favorites", { propertyId: listingId })).status).toBeLessThan(300);
    const html = ((await kwame.get(insights())).body as string).replace(/<!-- -->/g, "");
    expect(html).toContain("50% of viewers saved it");
  });

  it("is only for the listing's landlord and admins", async () => {
    // Another landlord gets the not-found page. (Its status is 200: the dashboard layout has already
    // started streaming by the time the page checks ownership, so only the content can change.)
    const other = await (await as("akosua")).get(insights());
    expect(other.body).not.toContain("Daily views");
    expect(other.body).not.toContain(title);
    expect((await (await as("admin")).get(insights())).status).toBe(200);
    const tenant = await (await as("ama")).get(insights());
    expect([307, 308]).toContain(tenant.status);
    const visitor = await anon().get(insights());
    expect([307, 308]).toContain(visitor.status);
  });

  it("is linked from the landlord dashboard", async () => {
    expect((await kwame.get("/dashboard/landlord")).body).toContain(`/dashboard/landlord/properties/${listingId}/insights`);
  });
});
