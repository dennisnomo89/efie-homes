import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { appUrl } from "./email";

/** Largest accepted upload. Vercel functions accept ~4.5 MB bodies; the browser shrinks photos well below this. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type ImageType = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };

/**
 * Where uploaded photos go:
 *  - "blob"  → Vercel Blob (BLOB_READ_WRITE_TOKEN is set; Vercel adds it when you connect a Blob store)
 *  - "local" → a folder on this machine (UPLOADS_DIR is set; for development and tests)
 *  - "off"   → uploads disabled; landlords paste image links instead
 */
export function uploadsMode(): "blob" | "local" | "off" {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return "blob";
  if (process.env.UPLOADS_DIR?.trim()) return "local";
  return "off";
}

/** Identifies JPEG, PNG and WebP by their first bytes, ignoring whatever the browser claims. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return { mime: "image/png", ext: "png" };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

/** Names of locally stored files: random, so they can't be guessed or collide. */
export const LOCAL_NAME = /^[a-z0-9]{24}\.(jpg|png|webp)$/;

export function localUploadsDir(): string {
  return path.resolve(process.env.UPLOADS_DIR?.trim() || ".uploads");
}

/** Stores an image and returns its public URL. */
export async function storeImage(bytes: Uint8Array, type: ImageType, ownerId: string): Promise<string> {
  const name = `${randomBytes(12).toString("hex")}.${type.ext}`;
  const mode = uploadsMode();

  if (mode === "blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(`listings/${ownerId}/${name}`, Buffer.from(bytes), {
      access: "public",
      contentType: type.mime,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (mode === "local") {
    const dir = localUploadsDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return `${appUrl()}/api/uploads/${name}`;
  }

  throw new Error("Uploads are not configured");
}
