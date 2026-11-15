import { z } from "zod";
import { guard, ok, readJson, validationFailed } from "@/lib/api";
import { inboxFor, markNotificationsRead } from "@/lib/inbox";

/** GET /api/notifications — the signed-in user's latest notifications and unread count (for the navbar bell). */
export async function GET() {
  const g = await guard();
  if (g.response) return g.response;
  const res = ok(await inboxFor(g.session.sub));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

const readSchema = z.union([z.object({ all: z.literal(true) }), z.object({ ids: z.array(z.string().min(1)).min(1).max(100) })], {
  error: "Send { all: true } or { ids: [...] }",
});

/** PATCH /api/notifications — mark read: { all: true } or { ids: [...] } (only your own are touched). */
export async function PATCH(req: Request) {
  const g = await guard();
  if (g.response) return g.response;
  const parsed = readSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const marked = await markNotificationsRead(g.session.sub, "all" in parsed.data ? "all" : parsed.data.ids);
  return ok({ marked });
}
