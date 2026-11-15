import { destroySession, revokeAllSessions } from "@/lib/auth";
import { guard, ok } from "@/lib/api";

/** POST /api/auth/logout-all — signs the user out on every device, including this one. */
export async function POST() {
  const g = await guard();
  if (g.response) return g.response;
  await revokeAllSessions(g.session.sub);
  await destroySession();
  return ok({ success: true });
}
