"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, GitCompareArrows, Plus, X } from "lucide-react";
import { useToast } from "../ui/Toast";
import { compareStore, useCompareIds } from "./compare-store";
import { compareHref, MAX_COMPARE } from "@/lib/compare";
import { cn } from "@/lib/utils";

/** Adds a home to (or removes it from) the comparison. "overlay" sits on a listing card's photo; "full" is a normal button. */
export function CompareButton({ propertyId, variant = "overlay", className }: { propertyId: string; variant?: "overlay" | "full"; className?: string }) {
  const ids = useCompareIds();
  const { toast } = useToast();
  const selected = ids.includes(propertyId);

  function toggle(e: React.MouseEvent) {
    // On cards the button sits inside the listing link.
    e.preventDefault();
    e.stopPropagation();
    const { outcome } = compareStore.toggle(propertyId);
    if (outcome === "full") {
      toast({ title: `You can compare up to ${MAX_COMPARE} homes`, description: "Remove one from the comparison tray first.", variant: "info" });
    }
  }

  const label = selected ? "Added to compare" : "Compare";
  if (variant === "full") {
    return (
      <button type="button" onClick={toggle} aria-pressed={selected} className={cn("btn btn-outline", selected && "border-forest-600 text-forest-800", className)}>
        {selected ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />} {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={selected}
      aria-label={selected ? "Remove from comparison" : "Add to comparison"}
      className={cn(
        "badge min-h-[32px] gap-1 shadow-sm backdrop-blur transition",
        selected ? "bg-forest-700 text-white" : "bg-white/95 text-ink hover:bg-white",
        className,
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} Compare
    </button>
  );
}

/** Bar pinned to the bottom of the screen while homes are picked for comparison. */
export function CompareTray() {
  const ids = useCompareIds();
  const pathname = usePathname();
  if (ids.length === 0 || pathname === "/compare" || pathname.startsWith("/dashboard")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-4" role="region" aria-label="Homes to compare">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl">
        <GitCompareArrows className="h-5 w-5 shrink-0 text-gold-400" />
        <p className="min-w-0 flex-1 text-sm">
          <strong>{ids.length}</strong> of {MAX_COMPARE} homes picked
          {ids.length === 1 && <span className="hidden text-stone-300 sm:inline"> · add one more</span>}
        </p>
        <button type="button" onClick={() => compareStore.clear()} className="rounded-lg p-2 text-stone-300 hover:bg-white/10 hover:text-white" aria-label="Clear comparison">
          <X className="h-4 w-4" />
        </button>
        <Link
          href={compareHref(ids)}
          aria-disabled={ids.length < 2}
          className={cn("btn btn-sm bg-gold-400 text-ink hover:bg-gold-500", ids.length < 2 && "pointer-events-none opacity-50")}
        >
          Compare
        </Link>
      </div>
    </div>
  );
}
