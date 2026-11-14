"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, MapPin, Search, Wallet } from "lucide-react";
import { BUDGET_OPTIONS, NEIGHBORHOODS, PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import { formatCedis } from "@/lib/utils";

export function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (location.startsWith("region:")) q.set("region", location.slice(7));
    else if (location) q.set("location", location);
    if (type) q.set("type", type);
    if (maxPrice) q.set("maxPrice", maxPrice);
    router.push(`/properties${q.toString() ? `?${q}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-3xl bg-white p-2 shadow-lift ring-1 ring-black/5 md:grid-cols-[1.3fr_1fr_1fr_auto] md:gap-0 md:rounded-full"
      role="search"
      aria-label="Search rentals"
    >
      <Field icon={MapPin} label="Location">
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-ink focus:outline-none" aria-label="Region or neighbourhood">
          <option value="">Anywhere in Ghana</option>
          {REGIONS.map((region) => {
            const hoods = NEIGHBORHOODS[region];
            return (
              <optgroup key={region} label={region}>
                <option value={`region:${region}`}>All of {region}</option>
                {hoods?.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </Field>

      <Field icon={Building2} label="Property type" divider>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-ink focus:outline-none" aria-label="Property type">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field icon={Wallet} label="Max budget / month" divider>
        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-ink focus:outline-none" aria-label="Maximum monthly budget">
          <option value="">No limit</option>
          {BUDGET_OPTIONS.map((b) => (
            <option key={b} value={b}>
              Up to {formatCedis(b)}
            </option>
          ))}
        </select>
      </Field>

      <button type="submit" className="btn btn-accent h-14 rounded-2xl px-7 text-base md:rounded-full">
        <Search className="h-5 w-5" />
        Search
      </button>
    </form>
  );
}

function Field({
  icon: Icon,
  label,
  children,
  divider,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <label className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl px-4 py-2 transition hover:bg-stone-50 md:rounded-full ${divider ? "md:border-l md:border-stone-200" : ""}`}>
      <Icon className="h-5 w-5 shrink-0 text-terracotta-500" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</span>
        {children}
      </span>
    </label>
  );
}
