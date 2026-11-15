"use client";

import { useEffect, useRef, useState } from "react";
import type { DayPoint } from "@/lib/insights";

/*
 * Daily views as columns (one series, so the heading names it and there's no legend box).
 * Marks: <= 24px wide, 4px rounded tops square at the baseline, 2px gaps; hairline grid.
 * Hover or arrow keys show a tooltip with that day's views, saves and viewing requests.
 */

const BAR = "#2d9870"; // forest-500: passes the chroma, lightness and 3:1 contrast checks on white
const BAR_ACTIVE = "#1a624a"; // forest-700
const GRID = "#e7e5e4"; // stone-200
const HEIGHT = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 36 };

const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

/** A round, even top (0 → 4, 7 → 8, 13 → 20, 230 → 250) so the 0 / half / top gridlines land on whole numbers. */
export function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 4, 5, 6, 8, 10]) {
    const v = m * step;
    if (v >= max && v % 2 === 0) return v;
  }
  return 20 * step;
}

/** Top-rounded column path: square at the baseline, 4px radius at the data end. */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function ViewsChart({ series }: { series: DayPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(...series.map((p) => p.views), 0));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / series.length;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  // Label today and every 7th day back from it (a weekly rhythm, and labels never crowd each other).
  const labelled = new Set(series.map((_, i) => i).filter((i) => (series.length - 1 - i) % 7 === 0));

  const point = active !== null ? series[active] : null;
  // Centre the tooltip on the bar, but keep its ~200px width inside the chart.
  const tipLeft = active !== null ? Math.min(Math.max(PAD.left + slot * active + slot / 2, 100), width - 100) : 0;

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setActive((a) => (a === null ? series.length - 1 : Math.min(series.length - 1, Math.max(0, a + d))));
    } else if (e.key === "Escape") setActive(null);
  }

  return (
    <div ref={ref} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Daily views, last ${series.length} days. Use the left and right arrow keys to read each day.`}
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        onMouseLeave={() => setActive(null)}
        className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-stone-500 text-[11px]">
              {t.toLocaleString("en-GB")}
            </text>
          </g>
        ))}
        {series.map((p, i) => {
          const h = (p.views / max) * plotH;
          const x = PAD.left + slot * i + (slot - barW) / 2;
          return (
            <g key={p.day} onMouseEnter={() => setActive(i)}>
              {/* Hit target: the whole slot, taller than the bar. */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {p.views > 0 && <path d={columnPath(x, y(p.views), barW, h)} fill={active === i ? BAR_ACTIVE : BAR} />}
              {labelled.has(i) && (
                <text x={PAD.left + slot * i + slot / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-stone-500 text-[11px]">
                  {dayLabel(p.day, { day: "numeric", month: "short" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {point && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: tipLeft }}
        >
          <p className="font-semibold">{dayLabel(point.day, { weekday: "short", day: "numeric", month: "short" })}</p>
          <p>
            {point.views} {point.views === 1 ? "view" : "views"} · {point.saves} {point.saves === 1 ? "save" : "saves"} · {point.requests}{" "}
            {point.requests === 1 ? "request" : "requests"}
          </p>
        </div>
      )}
    </div>
  );
}
