import { AMENITIES, PROPERTY_TYPES } from "./constants";

/* Neighbourhood guides: what renting in an area looks like, worked out from the homes listed there now. */

/** "Kumasi - Ahodwo" → "kumasi-ahodwo", "East Legon" → "east-legon". */
export function areaSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** Fewer homes than this and the guide says the figures are only a rough guide. */
export const SMALL_SAMPLE = 5;

export type AreaListing = {
  neighborhood: string;
  region: string;
  monthlyRent: number;
  propertyType: string;
  advanceMonths: number;
  furnished: boolean;
  amenities: string[];
};

export type AreaStats = {
  count: number;
  medianRent: number | null;
  minRent: number | null;
  maxRent: number | null;
  /** Each home type present, cheapest typical rent first. */
  byType: { type: string; label: string; count: number; medianRent: number }[];
  /** The advance most landlords here ask for (ties go to the shorter one). */
  usualAdvance: number | null;
  advanceShare: { months: number; count: number }[];
  furnishedPercent: number;
  /** Essential amenities and the share of homes that have each (0-100). */
  amenities: { value: string; label: string; percent: number }[];
};

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export function areaStats(listings: AreaListing[]): AreaStats {
  const rents = listings.map((l) => l.monthlyRent);

  const byType = PROPERTY_TYPES.flatMap((t) => {
    const rows = listings.filter((l) => l.propertyType === t.value);
    return rows.length ? [{ type: t.value, label: t.label, count: rows.length, medianRent: median(rows.map((r) => r.monthlyRent))! }] : [];
  }).sort((a, b) => a.medianRent - b.medianRent);

  const advanceCounts = new Map<number, number>();
  for (const l of listings) advanceCounts.set(l.advanceMonths, (advanceCounts.get(l.advanceMonths) ?? 0) + 1);
  const advanceShare = [...advanceCounts.entries()].map(([months, count]) => ({ months, count })).sort((a, b) => a.months - b.months);
  const usualAdvance = advanceShare.length ? advanceShare.reduce((best, a) => (a.count > best.count ? a : best)).months : null;

  return {
    count: listings.length,
    medianRent: median(rents),
    minRent: rents.length ? Math.min(...rents) : null,
    maxRent: rents.length ? Math.max(...rents) : null,
    byType,
    usualAdvance,
    advanceShare,
    furnishedPercent: pct(listings.filter((l) => l.furnished).length, listings.length),
    amenities: AMENITIES.filter((a) => a.essential).map((a) => ({
      value: a.value,
      label: a.label,
      percent: pct(listings.filter((l) => l.amenities.includes(a.value)).length, listings.length),
    })),
  };
}

export type AreaSummary = { slug: string; name: string; region: string; count: number; medianRent: number | null };

/**
 * Groups listings into areas by slug (so "east legon" and "East Legon" are one area),
 * naming each after its most common spelling. Busiest areas first.
 */
export function groupAreas(listings: Pick<AreaListing, "neighborhood" | "region" | "monthlyRent">[]): AreaSummary[] {
  type Group = { names: Map<string, number>; regions: Map<string, number>; rents: number[] };
  const groups = new Map<string, Group>();
  for (const l of listings) {
    const slug = areaSlug(l.neighborhood);
    if (!slug) continue;
    const g: Group = groups.get(slug) ?? { names: new Map(), regions: new Map(), rents: [] };
    g.names.set(l.neighborhood.trim(), (g.names.get(l.neighborhood.trim()) ?? 0) + 1);
    g.regions.set(l.region, (g.regions.get(l.region) ?? 0) + 1);
    g.rents.push(l.monthlyRent);
    groups.set(slug, g);
  }
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  return [...groups.entries()]
    .map(([slug, g]) => ({ slug, name: top(g.names), region: top(g.regions), count: g.rents.length, medianRent: median(g.rents) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
