import { afterEach, describe, expect, it, vi } from "vitest";
import { detectImageType, LOCAL_NAME, uploadsMode } from "@/lib/uploads";

afterEach(() => vi.unstubAllEnvs());

const bytes = (...b: number[]) => new Uint8Array(b);
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

describe("detectImageType", () => {
  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(detectImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))?.ext).toBe("webp");
  });

  it("rejects anything else, whatever its name", () => {
    expect(detectImageType(bytes(...ascii("<svg onload=alert(1)>")))).toBeNull();
    expect(detectImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(detectImageType(bytes(...ascii("%PDF-1.7")))).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
  });
});

describe("uploadsMode", () => {
  it("prefers Vercel Blob, then a local folder, else off", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_x");
    vi.stubEnv("UPLOADS_DIR", ".uploads");
    expect(uploadsMode()).toBe("blob");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    expect(uploadsMode()).toBe("local");
    vi.stubEnv("UPLOADS_DIR", "");
    expect(uploadsMode()).toBe("off");
  });
});

describe("local file names", () => {
  it("only matches the random names the app creates", () => {
    expect(LOCAL_NAME.test("0123456789abcdef01234567.jpg")).toBe(true);
    expect(LOCAL_NAME.test("../../.env")).toBe(false);
    expect(LOCAL_NAME.test("0123456789abcdef01234567.svg")).toBe(false);
    expect(LOCAL_NAME.test("0123456789abcdef01234567.jpg/../x")).toBe(false);
  });
});
