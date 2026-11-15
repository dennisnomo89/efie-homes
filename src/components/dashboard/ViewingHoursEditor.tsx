"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { useToast } from "../ui/Toast";
import { VIEWING_TIME_SLOTS } from "@/lib/constants";
import { HOUR_PRESETS, WEEKDAYS, type WeekHours } from "@/lib/viewing-hours";
import { cn, formatTime } from "@/lib/utils";

/** Landlords: the days and times they can show homes. Tenants can only request these. */
export function ViewingHoursEditor({ initial }: { initial: WeekHours | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [anyTime, setAnyTime] = useState(initial === null);
  const [hours, setHours] = useState<WeekHours>(initial ?? HOUR_PRESETS[0].hours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const has = (day: keyof WeekHours, slot: string) => Boolean(hours[day]?.includes(slot));
  function toggle(day: keyof WeekHours, slot: string) {
    setError("");
    setHours((h) => {
      const cur = h[day] ?? [];
      const next = cur.includes(slot) ? cur.filter((s) => s !== slot) : VIEWING_TIME_SLOTS.filter((s) => s === slot || cur.includes(s));
      return { ...h, [day]: next };
    });
  }
  const toggleDay = (day: keyof WeekHours) =>
    setHours((h) => ({ ...h, [day]: (h[day]?.length ?? 0) === VIEWING_TIME_SLOTS.length ? [] : [...VIEWING_TIME_SLOTS] }));

  async function save() {
    const body = { hours: anyTime ? null : hours };
    if (!anyTime && !Object.values(hours).some((v) => v && v.length)) return setError("Tick at least one time, or choose “Any listed time”.");
    setSaving(true);
    const res = await fetch("/api/profile/viewing-hours", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Couldn't save. Please try again.");
    toast({ title: "Viewing hours saved", description: "Tenants will only be offered these times." });
    router.refresh();
  }

  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarClock className="h-5 w-5 text-forest-700" /> Viewing hours
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          When you can show your homes. Tenants can only request these times, and once you confirm a viewing nobody else can book that slot for
          the same home.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Viewing hours">
        <button type="button" role="radio" aria-checked={anyTime} onClick={() => setAnyTime(true)} className={cn("chip", anyTime && "chip-active")}>
          Any listed time
        </button>
        <button type="button" role="radio" aria-checked={!anyTime} onClick={() => setAnyTime(false)} className={cn("chip", !anyTime && "chip-active")}>
          Only certain days and times
        </button>
      </div>

      {!anyTime && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-stone-600">Quick fill:</span>
            {HOUR_PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => setHours(p.hours)} className="btn btn-sm btn-ghost">
                {p.label}
              </button>
            ))}
            <button type="button" onClick={() => setHours({})} className="btn btn-sm btn-ghost text-stone-600">
              Clear
            </button>
          </div>

          <div className="overflow-x-auto pb-1">
            <table className="w-full min-w-[34rem] border-separate border-spacing-1 text-center text-xs">
              <thead>
                <tr>
                  <th className="sr-only">Day</th>
                  {VIEWING_TIME_SLOTS.map((s) => (
                    <th key={s} scope="col" className="font-medium text-stone-500">
                      {formatTime(s).replace(":00", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS.map((d) => (
                  <tr key={d.key}>
                    <th scope="row" className="pr-1 text-left">
                      <button type="button" onClick={() => toggleDay(d.key)} className="text-sm font-semibold hover:text-forest-800" title={`Select all of ${d.long}`}>
                        {d.short}
                      </button>
                    </th>
                    {VIEWING_TIME_SLOTS.map((s) => (
                      <td key={s}>
                        <label className="block cursor-pointer">
                          <input type="checkbox" checked={has(d.key, s)} onChange={() => toggle(d.key, s)} className="peer sr-only" />
                          <span className="sr-only">
                            {d.long} {formatTime(s)}
                          </span>
                          <span
                            aria-hidden="true"
                            className="block h-8 rounded-md border border-stone-200 bg-white peer-checked:border-forest-600 peer-checked:bg-forest-500 peer-focus-visible:ring-2 peer-focus-visible:ring-forest-600"
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-500">Each box is a one-hour viewing slot starting at that time. Tap a day name to tick or clear the whole day.</p>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save viewing hours
      </button>
    </section>
  );
}
