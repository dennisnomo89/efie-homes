import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard, ok, readJson, validationFailed } from "@/lib/api";

const schema = z.object({ wishlistAlerts: z.boolean({ error: "Choose on or off" }) });

/** PATCH /api/wishlist-alerts — a tenant turns price-drop / available-again emails on or off. */
export async function PATCH(req: Request) {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const user = await prisma.user.update({
    where: { id: g.session.sub },
    data: { wishlistAlerts: parsed.data.wishlistAlerts },
    select: { wishlistAlerts: true },
  });
  return ok(user);
}
