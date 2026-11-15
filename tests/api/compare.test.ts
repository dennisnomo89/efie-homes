import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, uniqueTag } from "./client";

let kwame: Client;
let admin: Client;
const tag = uniqueTag();
const cheap = `Compare cheap ${tag}`;
const pricey = `Compare pricey ${tag}`;
const hidden = `Compare hidden ${tag}`;
let cheapId: string;
let priceyId: string;
let hiddenId: string;

const page = async (query: string) => {
  const res = await anon().get(`/compare${query}`);
  expect(res.status).toBe(200);
  return res.body as string;
};

beforeAll(async () => {
  [kwame, admin] = await Promise.all([as("kwame"), as("admin")]);
  // Cheap: 2,000 × 6 months, no agent fee, no deposit = 12,000. Pricey: 3,000 × 12 + 10% + 1,500 deposit = 41,100.
  cheapId = await createListing(kwame, cheap, { monthlyRent: 2000, advanceMonths: 6, agentFeePercent: 0, securityDeposit: 0, amenities: ["ECG_PREPAID"] });
  priceyId = await createListing(kwame, pricey, { monthlyRent: 3000, advanceMonths: 12, agentFeePercent: 10, securityDeposit: 1500, amenities: ["PARKING"] });
  hiddenId = await createListing(kwame, hidden);
  expect((await admin.patch(`/api/admin/properties/${hiddenId}`, { isHidden: true })).status).toBe(200);
});

afterAll(async () => {
  for (const id of [cheapId, priceyId, hiddenId]) if (id) await kwame.delete(`/api/properties/${id}`);
});

describe("compare page", () => {
  it("shows an empty state without homes, and isn't indexed", async () => {
    const html = await page("");
    expect(html).toContain("Pick homes to compare");
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });

  it("puts the homes side by side with move-in costs, in the order picked", async () => {
    const html = await page(`?ids=${priceyId},${cheapId}`);
    expect(html.indexOf(pricey)).toBeLessThan(html.indexOf(cheap));
    expect(html).toContain("41,100");
    expect(html).toContain("12,000");
    expect(html).toContain("Lowest");
    // Amenities either home has become rows.
    expect(html).toContain("ECG Prepaid Meter");
    expect(html).toContain("Parking Space");
    expect(html).not.toContain("POP Ceiling");
  });

  it("leaves out hidden listings and says so", async () => {
    const html = await page(`?ids=${cheapId},${hiddenId}`);
    expect(html).toContain(cheap);
    expect(html).not.toContain(hidden);
    expect(html).toContain("no longer listed");
  });

  it("ignores junk in the link", async () => {
    const html = await page(`?ids=${encodeURIComponent(`<script>alert(1)</script>,${cheapId}`)}`);
    expect(html).toContain(cheap);
    expect(html).not.toContain("<script>alert(1)");
  });
});

it("listing pages offer a Compare button", async () => {
  const res = await anon().get(`/properties/${cheapId}`);
  expect(res.body).toContain("Compare");
  expect(res.body).toContain('aria-pressed="false"');
});
