export type UpfrontInput = {
  /** Monthly rent in whole cedis */
  monthlyRent: number;
  /** Months of rent paid in advance */
  months: number;
  /** Agent commission as a percentage of the advance (0 when listed by the owner) */
  agentFeePercent: number;
  /** Refundable security deposit in whole cedis */
  securityDeposit: number;
};

export type UpfrontBreakdown = {
  advance: number;
  agentFee: number;
  securityDeposit: number;
  total: number;
};

/** What a tenant pays to move in: rent advance + agent commission + security deposit. */
export function calculateUpfront({ monthlyRent, months, agentFeePercent, securityDeposit }: UpfrontInput): UpfrontBreakdown {
  const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const advance = safe(monthlyRent) * safe(months);
  const agentFee = Math.round((advance * safe(agentFeePercent)) / 100);
  const deposit = safe(securityDeposit);
  return { advance, agentFee, securityDeposit: deposit, total: advance + agentFee + deposit };
}
