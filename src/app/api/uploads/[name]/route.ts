import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_NAME, localUploadsDir, uploadsMode } from "@/lib/uploads";

type Ctx = { params: Promise<{ name: string }> };

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

/** GET /api/uploads/:name — serves locally stored photos (development/tests only; Vercel Blob serves its own). */
export async function GET(_req: Request, { params }: Ctx) {
  const { name } = await params;
  if (uploadsMode() !== "local" || !LOCAL_NAME.test(name)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(localUploadsDir(), name));
    const ext = name.split(".").pop() as keyof typeof TYPES;
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
