import { fail, guard, ok } from "@/lib/api";
import { detectImageType, MAX_UPLOAD_BYTES, storeImage, uploadsMode } from "@/lib/uploads";

/** GET /api/uploads — whether photo uploads are available (so the form can show the button). */
export function GET() {
  return ok({ enabled: uploadsMode() !== "off" });
}

/** POST /api/uploads — landlords/admins upload one listing photo as multipart field "file". */
export async function POST(req: Request) {
  const g = await guard(["LANDLORD", "ADMIN"]);
  if (g.response) return g.response;
  if (uploadsMode() === "off") {
    return fail("Photo uploads aren't set up on this site yet. Paste an image link instead.", 503);
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return fail("That photo is too large (max 4 MB).", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Send the photo as a file upload.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Choose a photo to upload.", 400);
  if (file.size === 0) return fail("That file is empty.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail("That photo is too large (max 4 MB).", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return fail("Only JPEG, PNG or WebP photos can be uploaded.", 415);

  try {
    const url = await storeImage(bytes, type, g.session.sub);
    return ok({ url }, 201);
  } catch (err) {
    console.error("[uploads]", err instanceof Error ? err.message : err);
    return fail("The photo couldn't be saved. Please try again.", 502);
  }
}
