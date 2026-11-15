import { describe, expect, it } from "vitest";
import { anon, BASE_URL } from "./client";

const html = async (path: string) => String((await anon().get(path)).body);

describe("site pages", () => {
  it.each([
    ["/about", "Finding a home in Ghana shouldn"],
    ["/contact", "We&#x27;re here to help"],
    ["/terms", "Terms of use"],
    ["/privacy", "Data Protection Act, 2012 (Act 843)"],
  ])("%s loads with its content", async (path, text) => {
    const res = await anon().get(path);
    expect(res.status).toBe(200);
    expect(String(res.body)).toContain(text);
  });

  it("shows the contact phone number, with call and WhatsApp links", async () => {
    const page = await html("/contact");
    expect(page).toContain("+233 542 651 276");
    expect(page).toContain('href="tel:+233542651276"');
    expect(page).toContain("https://wa.me/233542651276");
  });

  it("links the new pages from the footer and lists them in the sitemap", async () => {
    const home = await html("/");
    for (const path of ["/about", "/contact", "/terms", "/privacy"]) expect(home).toContain(`href="${path}"`);
    const sitemap = await html("/sitemap.xml");
    for (const path of ["/about", "/contact", "/terms", "/privacy"]) expect(sitemap).toContain(`${path}</loc>`);
  });
});

describe("home screen app", () => {
  it("serves a valid web app manifest", async () => {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    expect(res.status).toBe(200);
    const m = await res.json();
    expect(m).toMatchObject({ name: "Efie Homes", display: "standalone", start_url: "/", theme_color: "#174e3c" });
    expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  });

  it.each([
    ["/app-icon/192", 192],
    ["/app-icon/512", 512],
    ["/app-icon/512-maskable", 512],
    ["/apple-icon", 180],
  ])("%s is a %ipx PNG", async (path, size) => {
    const res = await fetch(`${BASE_URL}${path}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    const buf = Buffer.from(await res.arrayBuffer());
    // PNG header width/height live at bytes 16–23.
    expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([size, size]);
  });

  it("404s unknown icon sizes", async () => {
    expect((await fetch(`${BASE_URL}/app-icon/9999`)).status).toBe(404);
  });

  it("links the manifest and icons from every page", async () => {
    const page = await html("/properties");
    expect(page).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(page).toMatch(/rel="apple-touch-icon" href="\/apple-icon/);
  });
});
