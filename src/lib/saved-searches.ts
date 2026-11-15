import { createHmac, timingSafeEqual } from "node:crypto";
import { advanceLabel, amenityLabel, propertyTypeLabel } from "./constants";
import { filtersToQuery, parseFilters, type PropertyFilters } from "./properties";
import { formatCedis, parseJsonArray } from "./utils";

export const MAX_SAVED_SEARCHES = 10;
/** At most one alert email per saved search in this period; the dashboard still shows every new match. */
export const ALERT_THROTTLE_MS = 3 * 60 * 60 * 1000;

/** The criteria a saved search stores: filters only (no page, sort or view). */
export function searchCriteria(f: PropertyFilters): PropertyFilters {
  return { ...f, page: 1, sort: "newest", includeRented: false };
}

/** Canonical query string for a saved search, e.g. "location=Osu&bedrooms=2". Empty means "no filters". */
export function normalizeSearchQuery(f: PropertyFilters): string {
  return filtersToQuery(searchCriteria(f)).replace(/^\?/, "");
}

export function hasCriteria(f: PropertyFilters): boolean {
  return normalizeSearchQuery(f) !== "";
}

/** Human-readable name, e.g. "2 Bedroom Apartment · 2+ beds · East Legon · up to ₵ 4,000". */
export function describeSearch(f: PropertyFilters): string {
  const parts: string[] = [];
  parts.push(f.type ? propertyTypeLabel(f.type) : "Any home");
  if (f.bedrooms) parts.push(`${f.bedrooms}+ beds`);
  if (f.bathrooms) parts.push(`${f.bathrooms}+ baths`);
  if (f.location) parts.push(f.location);
  if (f.region && f.region !== f.location) parts.push(f.region);
  if (f.minPrice && f.maxPrice) parts.push(`${formatCedis(f.minPrice)}–${formatCedis(f.maxPrice)}`);
  else if (f.maxPrice) parts.push(`up to ${formatCedis(f.maxPrice)}`);
  else if (f.minPrice) parts.push(`from ${formatCedis(f.minPrice)}`);
  if (f.advance) parts.push(`≤ ${advanceLabel(f.advance)}`);
  if (f.furnished) parts.push("Furnished");
  if (f.amenities.length) {
    const shown = f.amenities.slice(0, 2).map(amenityLabel);
    parts.push(f.amenities.length > 2 ? `${shown.join(", ")} +${f.amenities.length - 2}` : shown.join(", "));
  }
  const name = parts.join(" · ");
  return name.length > 100 ? `${name.slice(0, 99)}…` : name;
}

export type MatchableListing = {
  title: string;
  address: string;
  region: string;
  neighborhood: string;
  propertyType: string;
  monthlyRent: number;
  advanceMonths: number;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  /** JSON string (database) or already-parsed list */
  amenities: string | string[];
  status: string;
  isHidden: boolean;
};

/**
 * Does a listing match these filters? Mirrors buildWhere() in src/lib/properties.ts exactly
 * (a unit test keeps the two in step), so alerts agree with what the search page shows.
 */
export function listingMatches(f: PropertyFilters, p: MatchableListing): boolean {
  if (p.isHidden) return false;
  if (!f.includeRented && p.status !== "AVAILABLE") return false;
  if (f.location) {
    const needle = f.location.toLowerCase();
    const hay = [p.region, p.neighborhood, p.address, p.title].map((s) => s.toLowerCase());
    if (!hay.some((s) => s.includes(needle))) return false;
  }
  if (f.region && p.region !== f.region) return false;
  if (f.type && p.propertyType !== f.type) return false;
  if (f.minPrice !== undefined && p.monthlyRent < f.minPrice) return false;
  if (f.maxPrice !== undefined && f.maxPrice > 0 && p.monthlyRent > f.maxPrice) return false;
  if (f.advance && p.advanceMonths > f.advance) return false;
  if (f.bedrooms && p.bedrooms < f.bedrooms) return false;
  if (f.bathrooms && p.bathrooms < f.bathrooms) return false;
  if (f.furnished && !p.furnished) return false;
  const amenities = Array.isArray(p.amenities) ? p.amenities : parseJsonArray(p.amenities);
  return f.amenities.every((a) => amenities.includes(a));
}

export function filtersFromQuery(query: string): PropertyFilters {
  return parseFilters(new URLSearchParams(query));
}

/* ---- One-click unsubscribe links (no login needed, but unguessable) ---- */

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET is missing or too short");
  return s;
}

export function unsubscribeToken(savedSearchId: string): string {
  return createHmac("sha256", secret()).update(`unsubscribe:${savedSearchId}`).digest("base64url").slice(0, 32);
}

export function verifyUnsubscribeToken(savedSearchId: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(savedSearchId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** A user's saved searches with how many homes match now and how many are new since they last looked. */
export async function savedSearchesWithCounts(userId: string) {
  const { prisma } = await import("./prisma");
  const { buildWhere } = await import("./properties");
  const searches = await prisma.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return Promise.all(
    searches.map(async (s) => {
      const where = buildWhere(filtersFromQuery(s.query));
      const [total, newSince] = await Promise.all([
        prisma.property.count({ where }),
        prisma.property.count({ where: { AND: [where, { createdAt: { gt: s.lastSeenAt } }] } }),
      ]);
      return { ...s, total, newSince };
    }),
  );
}
