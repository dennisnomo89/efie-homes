import { cache } from "react";
import { areaSlug, areaStats, groupAreas } from "./areas";
import { prisma } from "./prisma";
import { landlordSelect, toView } from "./properties";
import { parseJsonArray } from "./utils";

/** Homes that count towards area guides: public and available to rent. */
const LIVE = { isHidden: false, status: "AVAILABLE" } as const;

/** Every area with at least one home to rent, busiest first. */
export const listAreas = cache(async () => {
  const rows = await prisma.property.findMany({ where: LIVE, select: { neighborhood: true, region: true, monthlyRent: true } });
  return groupAreas(rows);
});

/** One area's guide: its stats and homes, or null when nothing is listed there now. */
export const loadArea = cache(async (slug: string) => {
  const area = (await listAreas()).find((a) => a.slug === slug);
  if (!area) return null;

  // Every spelling landlords used for this area ("East Legon", "east legon"…).
  const spellings = await prisma.property.findMany({ where: LIVE, select: { neighborhood: true }, distinct: ["neighborhood"] });
  const names = spellings.map((s) => s.neighborhood).filter((n) => areaSlug(n) === slug);

  const raw = await prisma.property.findMany({
    where: { ...LIVE, neighborhood: { in: names } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: { landlord: { select: landlordSelect } },
  });
  const homes = raw.map(toView);
  const stats = areaStats(raw.map((p) => ({ ...p, amenities: parseJsonArray(p.amenities) })));
  return { ...area, homes, stats };
});
