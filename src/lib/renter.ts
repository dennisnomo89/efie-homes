/* Renter profiles: what a tenant tells landlords about themselves. */

export type RenterProfileData = {
  occupation: string | null;
  householdSize: number | null;
  moveInFrom: Date | null;
  about: string | null;
};

/** "2026-12" → 1 Dec 2026 (UTC). */
export function monthToDate(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

/** 1 Dec 2026 → "2026-12". */
export function dateToMonth(d: Date | null): string {
  return d ? d.toISOString().slice(0, 7) : "";
}

export function isProfileEmpty(p: RenterProfileData | null | undefined): boolean {
  return !p || (!p.occupation && !p.householdSize && !p.moveInFrom && !p.about);
}

/** Short facts for a landlord, e.g. ["Nurse", "Household of 4", "Moving in from Dec 2026"]. */
export function renterFacts(p: RenterProfileData | null | undefined, now = new Date()): string[] {
  if (isProfileEmpty(p)) return [];
  const facts: string[] = [];
  if (p!.occupation) facts.push(p!.occupation);
  if (p!.householdSize) facts.push(p!.householdSize === 1 ? "Living alone" : `Household of ${p!.householdSize}`);
  if (p!.moveInFrom) {
    const thisMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    facts.push(
      p!.moveInFrom.getTime() <= thisMonth
        ? "Ready to move in now"
        : `Moving in from ${p!.moveInFrom.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}`,
    );
  }
  return facts;
}
