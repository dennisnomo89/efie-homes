"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { ADVANCE_OPTIONS, AMENITIES, NEIGHBORHOODS, PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Portal } from "./ui/Portal";
import { useDialogFocus } from "./ui/useDialogFocus";

type State = {
  location: string;
  region: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  advance: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string[];
  furnished: boolean;
};

function fromParams(sp: URLSearchParams): State {
  return {
    location: sp.get("location") ?? "",
    region: sp.get("region") ?? "",
    type: sp.get("type") ?? "",
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
    advance: sp.get("advance") ?? "",
    bedrooms: sp.get("bedrooms") ?? "",
    bathrooms: sp.get("bathrooms") ?? "",
    amenities: (sp.get("amenities") ?? "").split(",").filter(Boolean),
    furnished: sp.get("furnished") === "true",
  };
}

export function countActiveFilters(sp: URLSearchParams): number {
  const keys = ["location", "region", "type", "minPrice", "maxPrice", "advance", "bedrooms", "bathrooms", "furnished"];
  return keys.filter((k) => sp.get(k)).length + (sp.get("amenities") ?? "").split(",").filter(Boolean).length;
}

export function FilterSidebar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [state, setState] = useState<State>(() => fromParams(sp));
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, drawerRef);
  const [pending, startTransition] = useTransition();
  const active = countActiveFilters(sp);

  // Keep local state in sync when the URL changes (e.g. back button, hero search).
  useEffect(() => setState(fromParams(sp)), [sp]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = <K extends keyof State>(key: K, value: State[K]) => setState((s) => ({ ...s, [key]: value }));

  function apply(next: State = state) {
    const q = new URLSearchParams();
    const sort = sp.get("sort");
    if (next.location) q.set("location", next.location);
    if (next.region) q.set("region", next.region);
    if (next.type) q.set("type", next.type);
    if (next.minPrice) q.set("minPrice", next.minPrice);
    if (next.maxPrice) q.set("maxPrice", next.maxPrice);
    if (next.advance) q.set("advance", next.advance);
    if (next.bedrooms) q.set("bedrooms", next.bedrooms);
    if (next.bathrooms) q.set("bathrooms", next.bathrooms);
    if (next.amenities.length) q.set("amenities", next.amenities.join(","));
    if (next.furnished) q.set("furnished", "true");
    if (sort) q.set("sort", sort);
    if (sp.get("view") === "map") q.set("view", "map"); // stay on the map when filtering
    setOpen(false);
    startTransition(() => router.push(`/properties${q.toString() ? `?${q}` : ""}`, { scroll: false }));
  }

  function reset() {
    const empty = fromParams(new URLSearchParams());
    setState(empty);
    apply(empty);
  }

  const toggleAmenity = (a: string) =>
    set("amenities", state.amenities.includes(a) ? state.amenities.filter((x) => x !== a) : [...state.amenities, a]);

  const hoods = state.region ? NEIGHBORHOODS[state.region as keyof typeof NEIGHBORHOODS] ?? [] : Object.values(NEIGHBORHOODS).flat();

  const panel = (
    <div className="space-y-6">
      <Section title="Location">
        <select value={state.region} onChange={(e) => set("region", e.target.value)} className="input" aria-label="Region">
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          list="hood-options"
          value={state.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Neighbourhood, e.g. East Legon"
          className="input mt-2"
          aria-label="Neighbourhood"
        />
        <datalist id="hood-options">
          {hoods.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
      </Section>

      <Section title="Property type">
        <select value={state.type} onChange={(e) => set("type", e.target.value)} className="input" aria-label="Property type">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Monthly rent (GHS)">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">₵</span>
            <input type="number" inputMode="numeric" min={0} value={state.minPrice} onChange={(e) => set("minPrice", e.target.value)} placeholder="Min" className="input pl-7" aria-label="Minimum rent" />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">₵</span>
            <input type="number" inputMode="numeric" min={0} value={state.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} placeholder="Max" className="input pl-7" aria-label="Maximum rent" />
          </div>
        </div>
      </Section>

      <Section title="Advance I can pay" hint="Shows homes asking this much advance or less">
        <div className="grid grid-cols-2 gap-2">
          <Chip active={state.advance === ""} onClick={() => set("advance", "")}>
            Any
          </Chip>
          {ADVANCE_OPTIONS.map((a) => (
            <Chip key={a.months} active={state.advance === String(a.months)} onClick={() => set("advance", String(a.months))}>
              {a.months === 6 ? "6 months" : a.months === 12 ? "1 year" : "2 years"}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Bedrooms">
        <ChipRow value={state.bedrooms} onChange={(v) => set("bedrooms", v)} />
      </Section>

      <Section title="Bathrooms">
        <ChipRow value={state.bathrooms} onChange={(v) => set("bathrooms", v)} max={3} />
      </Section>

      <Section title="Utilities & amenities">
        <div className="space-y-1">
          {AMENITIES.map((a) => (
            <label key={a.value} className="flex min-h-[40px] cursor-pointer items-center gap-3 rounded-lg px-1 text-sm hover:bg-stone-50">
              <input
                type="checkbox"
                checked={state.amenities.includes(a.value)}
                onChange={() => toggleAmenity(a.value)}
                className="h-5 w-5 rounded border-stone-300 accent-forest-700"
              />
              <span className="flex-1">{a.label}</span>
              {a.essential && <span className="text-[10px] font-bold uppercase tracking-wide text-terracotta-600">Essential</span>}
            </label>
          ))}
        </div>
      </Section>

      <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-stone-200 bg-white px-4">
        <span className="text-sm font-medium">Furnished only</span>
        <input type="checkbox" checked={state.furnished} onChange={(e) => set("furnished", e.target.checked)} className="h-5 w-5 accent-forest-700" />
      </label>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button onClick={() => setOpen(true)} className="btn btn-outline lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Filters
        {active > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-forest-800 px-1.5 text-xs text-white">{active}</span>}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h2>
            {active > 0 && (
              <button onClick={reset} className="flex items-center gap-1 text-xs font-semibold text-terracotta-600 hover:underline">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>
          {panel}
          <button onClick={() => apply()} disabled={pending} className="btn btn-primary mt-6 w-full">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Apply filters
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <Portal>
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div ref={drawerRef} className="absolute inset-x-0 bottom-0 flex max-h-[90vh] animate-slide-up flex-col rounded-t-3xl bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-stone-100" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{panel}</div>
            <div className="grid grid-cols-2 gap-3 border-t border-stone-200 bg-white p-4">
              <button onClick={reset} className="btn btn-outline">
                Reset
              </button>
              <button onClick={() => apply()} className="btn btn-primary">
                Show homes
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {hint && <p className="mb-2 mt-0.5 text-xs text-stone-500">{hint}</p>}
      <div className={hint ? "" : "mt-2"}>{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("chip", active && "chip-active")} aria-pressed={active}>
      {children}
    </button>
  );
}

function ChipRow({ value, onChange, max = 4 }: { value: string; onChange: (v: string) => void; max?: number }) {
  const options = Array.from({ length: max }, (_, i) => String(i + 1));
  return (
    <div className="flex gap-2">
      <Chip active={value === ""} onClick={() => onChange("")}>
        Any
      </Chip>
      {options.map((o, i) => (
        <Chip key={o} active={value === o} onClick={() => onChange(o)}>
          {i === options.length - 1 ? `${o}+` : o}
        </Chip>
      ))}
    </div>
  );
}
