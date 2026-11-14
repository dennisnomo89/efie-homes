"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/constants";

export function SortSelect() {
  const router = useRouter();
  const sp = useSearchParams();

  function onChange(value: string) {
    const q = new URLSearchParams(sp.toString());
    if (value === "newest") q.delete("sort");
    else q.set("sort", value);
    q.delete("page");
    router.push(`/properties${q.toString() ? `?${q}` : ""}`, { scroll: false });
  }

  return (
    <label className="relative flex items-center">
      <ArrowUpDown className="pointer-events-none absolute left-3 h-4 w-4 text-stone-500" />
      <select
        value={sp.get("sort") ?? "newest"}
        onChange={(e) => onChange(e.target.value)}
        className="input cursor-pointer appearance-none pl-9 pr-8"
        aria-label="Sort listings"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
