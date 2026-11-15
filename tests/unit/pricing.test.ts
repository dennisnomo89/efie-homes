import { describe, expect, it } from "vitest";
import { calculateUpfront } from "@/lib/pricing";

describe("calculateUpfront", () => {
  it("adds advance, agent commission and deposit", () => {
    // Home page example: 2-bedroom in Spintex, 1 year advance, 10% agent fee
    expect(calculateUpfront({ monthlyRent: 3800, months: 12, agentFeePercent: 10, securityDeposit: 0 })).toEqual({
      advance: 45_600,
      agentFee: 4_560,
      securityDeposit: 0,
      total: 50_160,
    });
  });

  it("matches the Osu listing: 6 months + one month deposit, no agent", () => {
    const r = calculateUpfront({ monthlyRent: 9500, months: 6, agentFeePercent: 0, securityDeposit: 9500 });
    expect(r.advance).toBe(57_000);
    expect(r.agentFee).toBe(0);
    expect(r.total).toBe(66_500);
  });

  it("handles a 2-year advance on an executive home", () => {
    const r = calculateUpfront({ monthlyRent: 95_000, months: 24, agentFeePercent: 10, securityDeposit: 95_000 });
    expect(r.advance).toBe(2_280_000);
    expect(r.agentFee).toBe(228_000);
    expect(r.total).toBe(2_603_000);
  });

  it("rounds the agent fee to whole cedis", () => {
    expect(calculateUpfront({ monthlyRent: 333, months: 6, agentFeePercent: 7, securityDeposit: 0 }).agentFee).toBe(140); // 139.86
  });

  it("treats missing, negative or non-numeric inputs as zero", () => {
    expect(calculateUpfront({ monthlyRent: NaN, months: 12, agentFeePercent: 10, securityDeposit: -5 }).total).toBe(0);
    expect(calculateUpfront({ monthlyRent: 1000, months: 0, agentFeePercent: 10, securityDeposit: 500 }).total).toBe(500);
  });
});
