"use client";

import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { ADVANCE_OPTIONS } from "@/lib/constants";
import { calculateUpfront } from "@/lib/pricing";
import { cn, formatCedis } from "@/lib/utils";

type Props = {
  monthlyRent: number;
  minAdvanceMonths: number;
  securityDeposit: number;
  agentFeePercent: number;
};

/** Transparent upfront-cost breakdown for Ghanaian rent advance terms. */
export function AdvanceCalculator({ monthlyRent, minAdvanceMonths, securityDeposit, agentFeePercent }: Props) {
  const options = ADVANCE_OPTIONS.filter((o) => o.months >= minAdvanceMonths);
  const [months, setMonths] = useState<number>(options[0]?.months ?? minAdvanceMonths);

  const breakdown = useMemo(
    () => calculateUpfront({ monthlyRent, months, agentFeePercent, securityDeposit }),
    [monthlyRent, months, agentFeePercent, securityDeposit],
  );

  return (
    <div className="rounded-2xl border border-gold-300 bg-gold-100/50 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Calculator className="h-4 w-4 text-gold-600" /> Upfront cost calculator
      </h3>

      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Advance period">
        {options.map((o) => (
          <button
            key={o.months}
            type="button"
            role="radio"
            aria-checked={months === o.months}
            onClick={() => setMonths(o.months)}
            className={cn(
              "flex-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition sm:text-sm",
              months === o.months ? "border-forest-800 bg-forest-800 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-forest-600",
            )}
          >
            {o.months === 6 ? "6 months" : o.months === 12 ? "1 year" : "2 years"}
          </button>
        ))}
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">
            Rent advance ({months} × {formatCedis(monthlyRent)})
          </dt>
          <dd className="font-medium">{formatCedis(breakdown.advance)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Agent commission {agentFeePercent > 0 ? `(${agentFeePercent}%)` : ""}</dt>
          <dd className="font-medium">{agentFeePercent > 0 ? formatCedis(breakdown.agentFee) : "None"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Refundable security deposit</dt>
          <dd className="font-medium">{securityDeposit > 0 ? formatCedis(securityDeposit) : "None"}</dd>
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-dashed border-gold-500/60 pt-3">
          <dt className="font-semibold">Total to move in</dt>
          <dd className="font-display text-2xl font-semibold text-forest-800">{formatCedis(breakdown.total)}</dd>
        </div>
      </dl>

      <p className="mt-3 flex gap-1.5 text-xs text-stone-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Landlord requires at least {minAdvanceMonths >= 12 ? `${minAdvanceMonths / 12} year${minAdvanceMonths > 12 ? "s" : ""}` : `${minAdvanceMonths} months`} advance.
        Never pay before inspecting the property in person.
      </p>
    </div>
  );
}
