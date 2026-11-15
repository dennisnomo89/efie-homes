import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, uniqueTag } from "./client";

let kwame: Client;
let admin: Client;
const tag = uniqueTag();
// A made-up neighbourhood so the test controls every home in it.
const area = `Testville ${tag}`;
const slug = area.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const ids: string[] = [];

const text = async (path: string) => {
  const res = await anon().get(path);
  return { status: res.status, html: (res.body as string).replace(/<!-- -->/g, "") };
};

beforeAll(async () => {
  [kwame, admin] = await Promise.all([as("kwame"), as("admin")]);
  ids.push(await createListing(kwame, `Area test A ${tag}`, { neighborhood: area, monthlyRent: 2000, propertyType: "CHAMBER_HALL", advanceMonths: 12, amenities: ["ECG_PREPAID"] }));
  ids.push(await createListing(kwame, `Area test B ${tag}`, { neighborhood: area.toLowerCase(), monthlyRent: 4000, propertyType: "APARTMENT_2BR", advanceMonths: 12, amenities: ["ECG_PREPAID", "BOREHOLE_POLYTANK"] }));
  ids.push(await createListing(kwame, `Area test C ${tag}`, { neighborhood: area, monthlyRent: 9000, propertyType: "APARTMENT_2BR", advanceMonths: 24, amenities: [] }));
  // A hidden home in the same area must not count.
  ids.push(await createListing(kwame, `Area test hidden ${tag}`, { neighborhood: area, monthlyRent: 99000 }));
  expect((await admin.patch(`/api/admin/properties/${ids[3]}`, { isHidden: true })).status).toBe(200);
});

afterAll(async () => {
  for (const id of ids) await kwame.delete(`/api/properties/${id}`);
});

describe("neighbourhood guides", () => {
  it("lists the area on the index, merging spellings", async () => {
    const { status, html } = await text("/areas");
    expect(status).toBe(200);
    expect(html).toContain(`/areas/${slug}`);
    expect(html).toContain("3 homes");
  });

  it("shows typical rent, rent by type, usual advance and essentials, ignoring hidden homes", async () => {
    const { status, html } = await text(`/areas/${slug}`);
    expect(status).toBe(200);
    expect(html).toContain(`Renting in ${area}`);
    expect(html).toMatch(/₵\s?4,000\/mo/); // median of 2,000 / 4,000 / 9,000
    expect(html).toMatch(/₵\s?2,000 to ₵\s?9,000/);
    expect(html).toContain("1 Year Advance");
    expect(html).toMatch(/2 Bedroom Apartment[\s\S]*?₵\s?6,500/); // median of 4,000 and 9,000
    expect(html).toContain("67%"); // prepaid meter in 2 of 3
    expect(html).toContain("Only a few homes are listed here"); // 3 homes: a small sample
    expect(html).not.toContain(`Area test hidden ${tag}`);
    expect(html).not.toContain("99,000");
  });

  it("404s for areas with nothing to rent", async () => {
    const res = await anon().get(`/areas/nowhere-${tag}`);
    expect(res.status).toBe(404);
  });

  it("is linked from listings and the sitemap", async () => {
    expect((await text(`/properties/${ids[0]}`)).html).toContain(`/areas/${slug}`);
    expect((await text("/sitemap.xml")).html).toContain(`/areas/${slug}`);
  });
});
