"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "../ui/Toast";
import { addMonths, currentMonth, fieldErrors, RENTER_ABOUT_MAX, renterProfileSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

type Values = { occupation: string; householdSize: string; moveInFrom: string; about: string };

/** Tenants: what landlords see about you when you request a viewing. */
export function RenterProfileForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const id = useId();
  const thisMonth = currentMonth();

  const set = (k: keyof Values, value: string) => {
    setV((s) => ({ ...s, [k]: value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = renterProfileSchema.safeParse(v);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    const res = await fetch("/api/profile/renter", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      toast({ title: "Couldn't save your renter profile", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    toast({ title: "Renter profile saved", description: "Landlords will see it on your viewing requests." });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 sm:p-6" noValidate>
      <div>
        <h3 className="text-lg font-semibold">Your renter profile</h3>
        <p className="mt-1 flex gap-1.5 text-sm text-stone-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
          Shown only to landlords you send a viewing request to, so they know who&rsquo;s asking. Everything here is optional.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor={`${id}-occ`} className="label">
            What you do
          </label>
          <input id={`${id}-occ`} value={v.occupation} onChange={(e) => set("occupation", e.target.value)} maxLength={80} placeholder="e.g. Nurse at Korle Bu" className={cn("input", errors.occupation && "input-error")} />
          {errors.occupation && <p className="field-error">{errors.occupation}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-hh`} className="label">
            People moving in
          </label>
          <input
            id={`${id}-hh`}
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={v.householdSize}
            onChange={(e) => set("householdSize", e.target.value)}
            placeholder="Including you"
            className={cn("input", errors.householdSize && "input-error")}
          />
          {errors.householdSize && <p className="field-error">{errors.householdSize}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-move`} className="label">
            Moving in from
          </label>
          <input
            id={`${id}-move`}
            type="month"
            min={thisMonth}
            max={addMonths(thisMonth, 24)}
            value={v.moveInFrom}
            onChange={(e) => set("moveInFrom", e.target.value)}
            className={cn("input", errors.moveInFrom && "input-error")}
          />
          {errors.moveInFrom && <p className="field-error">{errors.moveInFrom}</p>}
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-about`} className="label">
          A few words about you
        </label>
        <textarea
          id={`${id}-about`}
          rows={3}
          maxLength={RENTER_ABOUT_MAX}
          value={v.about}
          onChange={(e) => set("about", e.target.value)}
          placeholder="e.g. Quiet couple relocating from Kumasi for work. Non-smokers, no pets."
          className={cn("input resize-none", errors.about && "input-error")}
        />
        {errors.about ? (
          <p className="field-error">{errors.about}</p>
        ) : (
          <p className="mt-1.5 text-xs text-stone-500">
            {v.about.length}/{RENTER_ABOUT_MAX}. Don&rsquo;t include ID numbers or bank details.
          </p>
        )}
      </div>

      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save renter profile
      </button>
    </form>
  );
}
