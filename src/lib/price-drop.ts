/** Rent reductions: what to store when rent changes, and what "Price dropped" badge to show. Safe to use in the browser. */

/** A reduced rent shows as "Price dropped" (old rent struck through) for this long. */
export const PRICE_DROP_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type RentState = { monthlyRent: number; previousRent: number | null; rentReducedAt: Date | null };

/** Is a reduction still recent enough to show? */
function recentDrop(p: RentState, now: Date): boolean {
  return p.previousRent !== null && p.rentReducedAt !== null && now.getTime() - p.rentReducedAt.getTime() < PRICE_DROP_DAYS * DAY_MS;
}

/**
 * The previousRent / rentReducedAt to store when a landlord changes the rent.
 * Lowering it records the drop; several cuts in a row keep the original, higher rent as "was";
 * raising it (or a drop that undoes itself) clears the badge.
 */
export function rentChangeFields(current: RentState, newRent: number, now = new Date()): { previousRent: number | null; rentReducedAt: Date | null } | null {
  if (newRent === current.monthlyRent) return null;
  if (newRent > current.monthlyRent) {
    // Still below the earlier "was" price after a partial rise? Keep showing that drop.
    if (recentDrop(current, now) && newRent < current.previousRent!) return null;
    return { previousRent: null, rentReducedAt: null };
  }
  const was = recentDrop(current, now) ? Math.max(current.previousRent!, current.monthlyRent) : current.monthlyRent;
  return { previousRent: was, rentReducedAt: now };
}

export type PriceDrop = { from: number; to: number; percent: number; since: Date };

/** The drop to show on a listing, if any. */
export function priceDrop(p: RentState, now = new Date()): PriceDrop | null {
  if (!recentDrop(p, now) || p.previousRent! <= p.monthlyRent) return null;
  return {
    from: p.previousRent!,
    to: p.monthlyRent,
    percent: Math.round(((p.previousRent! - p.monthlyRent) / p.previousRent!) * 100),
    since: p.rentReducedAt!,
  };
}
