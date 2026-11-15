import { beforeAll, describe, expect, it } from "vitest";
import { anon, as, BASE_URL, Client, listingPayload, uniqueTag } from "./client";

/* Needs the server started with UPLOADS_DIR (and no BLOB_READ_WRITE_TOKEN); CI does this. */
const enabled = Boolean(process.env.UPLOADS_DIR?.trim());

// A real 1×1 PNG.
const PNG = new Uint8Array(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"),
);

function form(content: Uint8Array<ArrayBuffer> | string, name: string, type: string) {
  const f = new FormData();
  f.append("file", new Blob([content], { type }), name);
  return f;
}

async function upload(c: Client | null, body: FormData) {
  const res = await (c ?? anon()).post("/api/uploads", body);
  return { status: res.status, body: res.body };
}

describe.skipIf(!enabled)("photo uploads", () => {
  let kwame: Client;
  beforeAll(async () => {
    kwame = await as("kwame");
  });

  it("reports that uploads are available", async () => {
    expect((await anon().get("/api/uploads")).body).toEqual({ enabled: true });
  });

  it("stores a real image, serves it back, and accepts it on a listing", async () => {
    const res = await upload(kwame, form(PNG, "room.png", "image/png"));
    expect(res.status).toBe(201);
    const url: string = res.body.url;
    expect(url).toMatch(/\/api\/uploads\/[a-z0-9]{24}\.png$/);

    const served = await fetch(url.replace(/^https?:\/\/[^/]+/, BASE_URL));
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
    expect(served.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await served.arrayBuffer()).equals(Buffer.from(PNG))).toBe(true);

    const listing = await kwame.post("/api/properties", listingPayload(`Upload test ${uniqueTag()}`, { images: [url] }));
    expect(listing.status).toBe(201);
    await kwame.delete(`/api/properties/${listing.body.property.id}`);
  });

  it("judges files by their contents, not their name or declared type", async () => {
    const fake = await upload(kwame, form("<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'/>", "photo.jpg", "image/jpeg"));
    expect(fake.status).toBe(415);
  });

  it("rejects oversized and empty files", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 10);
    big.set([0xff, 0xd8, 0xff]);
    expect((await upload(kwame, form(big, "huge.jpg", "image/jpeg"))).status).toBe(413);
    expect((await upload(kwame, form(new Uint8Array(0), "empty.jpg", "image/jpeg"))).status).toBe(400);
  });

  it("only lets landlords and admins upload", async () => {
    expect((await upload(null, form(PNG, "a.png", "image/png"))).status).toBe(401);
    expect((await upload(await as("ama"), form(PNG, "a.png", "image/png"))).status).toBe(403);
  });

  it("won't serve anything outside the uploads folder", async () => {
    for (const path of ["/api/uploads/..%2F..%2F.env", "/api/uploads/package.json", "/api/uploads/0123456789abcdef01234567.svg"]) {
      expect((await anon().get(path)).status).toBe(404);
    }
  });
});
