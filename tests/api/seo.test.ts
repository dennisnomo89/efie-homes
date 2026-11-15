import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, BASE_URL, Client, listingPayload, uniqueTag } from "./client";

let kwame: Client;
let admin: Client;
let id: string;
const title = `SEO test ${uniqueTag()}`;
const PHOTO = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200";

const html = async (path: string, c: Client = anon()) => String((await c.get(path)).body);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const meta = (page: string, attr: "name" | "property", key: string) =>
  page.match(new RegExp(`<meta ${attr}="${escapeRe(key)}" content="([^"]*)"`))?.[1];

beforeAll(async () => {
  [kwame, admin] = await Promise.all([as("kwame"), as("admin")]);
  const res = await kwame.post(
    "/api/properties",
    listingPayload(title, { images: [PHOTO], neighborhood: "East Legon", latitude: 5.637891, longitude: -0.161449 }),
  );
  expect(res.status).toBe(201);
  id = res.body.property.id;
});

afterAll(async () => {
  if (id) await kwame.delete(`/api/properties/${id}`);
});

describe("robots.txt and sitemap", () => {
  it("keeps private areas out of search engines and points to the sitemap", async () => {
    const robots = String((await anon().get("/robots.txt")).body);
    for (const path of ["/dashboard", "/api/", "/login", "/reset-password"]) expect(robots).toContain(`Disallow: ${path}`);
    expect(robots).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  it("lists public listings and search landing pages, but not hidden ones", async () => {
    const before = String((await anon().get("/sitemap.xml")).body);
    expect(before).toContain(`/properties/${id}</loc>`);
    expect(before).toContain("/properties?region=Greater%20Accra</loc>");

    await admin.patch(`/api/admin/properties/${id}`, { isHidden: true });
    try {
      expect(String((await anon().get("/sitemap.xml")).body)).not.toContain(`/properties/${id}<`);
    } finally {
      await admin.patch(`/api/admin/properties/${id}`, { isHidden: false });
    }
  });
});

describe("listing page", () => {
  it("has a share preview with the listing's photo, price and area", async () => {
    const page = await html(`/properties/${id}`);
    expect(meta(page, "property", "og:title")).toBe(`${title} — ₵ 2,500/month`);
    expect(meta(page, "property", "og:description")).toMatch(/^₵ 2,500\/month · 2-bed .* in East Legon, Greater Accra/);
    expect(meta(page, "property", "og:image")?.replace(/&amp;/g, "&")).toBe(PHOTO);
    expect(meta(page, "property", "og:url")).toMatch(new RegExp(`/properties/${id}$`));
    expect(meta(page, "name", "twitter:card")).toBe("summary_large_image");
    expect(page).toMatch(new RegExp(`<link rel="canonical" href="[^"]*/properties/${id}"`));
  });

  it("includes structured data with the rent in GHS and only a rounded location", async () => {
    const page = await html(`/properties/${id}`);
    const raw = page.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
    expect(raw).toBeDefined();
    const ld = JSON.parse(raw!);
    expect(ld.offers).toMatchObject({ price: 2500, priceCurrency: "GHS" });
    expect(ld.mainEntity.geo).toEqual({ "@type": "GeoCoordinates", latitude: 5.638, longitude: -0.161 });
    expect(page).not.toContain("5.637891");
  });

  it("is dropped from search results once rented", async () => {
    await kwame.patch(`/api/properties/${id}`, { status: "RENTED" });
    try {
      expect(meta(await html(`/properties/${id}`), "name", "robots")).toBe("noindex, follow");
    } finally {
      await kwame.patch(`/api/properties/${id}`, { status: "AVAILABLE" });
    }
  });
});

describe("other pages", () => {
  it("serves a branded share image", async () => {
    const res = await fetch(`${BASE_URL}/opengraph-image`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(5_000);
  });

  it("gives searches descriptive titles and only indexes simple ones", async () => {
    const simple = await html("/properties?location=Osu&type=APARTMENT_2BR");
    expect(simple).toContain("<title>2 Bedroom Apartment rentals in Osu · Efie Homes</title>");
    expect(meta(simple, "name", "robots")).toBeUndefined();

    const narrowed = await html("/properties?location=Osu&maxPrice=5000&amenities=PARKING");
    expect(meta(narrowed, "name", "robots")).toBe("noindex, follow");
    expect(narrowed).toMatch(/<link rel="canonical" href="[^"]*\/properties\?location=Osu"/);
  });

  it("keeps the home page's site search data", async () => {
    expect(await html("/")).toContain('"@type":"SearchAction"');
  });

  it("marks private pages noindex", async () => {
    expect(meta(await html("/login"), "name", "robots")).toBe("noindex, nofollow");
    expect(meta(await html("/dashboard/landlord", kwame), "name", "robots")).toBe("noindex, nofollow");
  });
});
