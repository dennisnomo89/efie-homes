import { appIcon } from "@/lib/app-icon";

type Ctx = { params: Promise<{ variant: string }> };

const VARIANTS: Record<string, () => Response> = {
  "192": () => appIcon(192),
  "512": () => appIcon(512),
  // Full-bleed background with the mark in the safe zone, for Android adaptive icons.
  "512-maskable": () => appIcon(512, { padding: 0.18, rounded: false }),
};

/** GET /app-icon/192 | /app-icon/512 | /app-icon/512-maskable — PNG home-screen icons for the web app manifest. */
export async function GET(_req: Request, { params }: Ctx) {
  const { variant } = await params;
  const make = VARIANTS[variant];
  if (!make) return new Response("Not found", { status: 404 });
  const res = make();
  res.headers.set("Cache-Control", "public, max-age=604800, immutable");
  return res;
}
