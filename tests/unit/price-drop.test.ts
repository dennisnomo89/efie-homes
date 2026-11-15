import { describe, expect, it } from "vitest";
import { PRICE_DROP_DAYS, priceDrop, rentChangeFields } from "@/lib/price-drop";

const now = new Date("2026-11-15T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const fresh = { monthlyRent: 5000, previousRent: null, rentReducedAt: null };

describe("rentChangeFields", () => {
  it("does nothing when the rent is unchanged", () => {
    expect(rentChangeFields(fresh, 5000, now)).toBeNull();
  });

  it("records a reduction", () => {
    expect(rentChangeFields(fresh, 4500, now)).toEqual({ previousRent: 5000, rentReducedAt: now });
  });

  it("keeps the original 'was' price over several recent cuts", () => {
    const afterFirstCut = { monthlyRent: 4500, previousRent: 5000, rentReducedAt: daysAgo(3) };
    expect(rentChangeFields(afterFirstCut, 4000, now)).toEqual({ previousRent: 5000, rentReducedAt: now });
  });

  it("starts afresh once the last cut is old", () => {
    const old = { monthlyRent: 4500, previousRent: 5000, rentReducedAt: daysAgo(PRICE_DROP_DAYS + 1) };
    expect(rentChangeFields(old, 4000, now)).toEqual({ previousRent: 4500, rentReducedAt: now });
  });

  it("clears the drop when rent goes back up to (or above) the old price", () => {
    const cut = { monthlyRent: 4500, previousRent: 5000, rentReducedAt: daysAgo(3) };
    expect(rentChangeFields(cut, 5000, now)).toEqual({ previousRent: null, rentReducedAt: null });
    expect(rentChangeFields(fresh, 5500, now)).toEqual({ previousRent: null, rentReducedAt: null });
  });

  it("keeps showing the drop after a partial rise that's still below the old price", () => {
    const cut = { monthlyRent: 4000, previousRent: 5000, rentReducedAt: daysAgo(3) };
    expect(rentChangeFields(cut, 4500, now)).toBeNull();
  });
});

describe("priceDrop", () => {
  it("is nothing for a listing that was never reduced", () => {
    expect(priceDrop(fresh, now)).toBeNull();
  });

  it("describes a recent drop with a rounded percentage", () => {
    expect(priceDrop({ monthlyRent: 4250, previousRent: 5000, rentReducedAt: daysAgo(2) }, now)).toEqual({
      from: 5000,
      to: 4250,
      percent: 15,
      since: daysAgo(2),
    });
  });

  it("stops showing after the display period", () => {
    expect(priceDrop({ monthlyRent: 4500, previousRent: 5000, rentReducedAt: daysAgo(PRICE_DROP_DAYS) }, now)).toBeNull();
  });

  it("ignores inconsistent data", () => {
    expect(priceDrop({ monthlyRent: 5000, previousRent: 4000, rentReducedAt: daysAgo(1) }, now)).toBeNull();
  });
});
