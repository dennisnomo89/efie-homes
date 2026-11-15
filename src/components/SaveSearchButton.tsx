"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BellPlus, BellRing, Loader2 } from "lucide-react";
import { useToast } from "./ui/Toast";

type Props = {
  /** "tenant" can save; "unauth" is sent to log in; landlords/admins don't see the button */
  mode: "tenant" | "unauth" | "landlord";
  /** Whether the current search has at least one filter */
  hasFilters: boolean;
};

export function SaveSearchButton({ mode, hasFilters }: Props) {
  const { toast } = useToast();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [savedQuery, setSavedQuery] = useState<string | null>(null);
  const query = sp.toString();

  if (mode === "landlord") return null;

  if (mode === "unauth") {
    const next = `${pathname}${query ? `?${query}` : ""}`;
    return (
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn btn-outline" title="Log in to get email alerts for this search">
        <BellPlus className="h-4 w-4" /> Save search
      </Link>
    );
  }

  const saved = savedQuery === query;

  async function save() {
    if (!hasFilters) {
      toast({ title: "Add a filter first", description: "Choose a location, type or budget, then save the search.", variant: "info" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Couldn't save this search", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    setSavedQuery(query);
    toast(
      data.alreadySaved
        ? { title: "Already saved", description: "You'll get an email when a new home matches.", variant: "info" }
        : { title: "Search saved", description: `"${data.search.name}". We'll email you when a new home matches.` },
    );
  }

  return (
    <button type="button" onClick={save} disabled={saving} className="btn btn-outline" aria-pressed={saved}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <BellRing className="h-4 w-4 text-forest-700" /> : <BellPlus className="h-4 w-4" />}
      {saved ? "Saved" : "Save search"}
    </button>
  );
}
