import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating (supports halves visually by rounding to the nearest half). */
export function Stars({ value, size = "sm", className }: { value: number; size?: "sm" | "md"; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  const dim = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className={cn("relative inline-block", dim)} aria-hidden="true">
            <Star className={cn("absolute inset-0 text-stone-300", dim)} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("fill-gold-500 text-gold-500", dim)} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** "★★★★½ 4.6 · 12 reviews" — or nothing useful to show yet. */
export function RatingSummaryLine({ rating, count, className }: { rating: number; count: number; className?: string }) {
  if (count === 0) return <span className={cn("text-sm text-stone-500", className)}>No reviews yet</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Stars value={rating} />
      <strong className="font-semibold text-ink">{rating.toFixed(1)}</strong>
      <span className="text-stone-500">
        · {count} {count === 1 ? "review" : "reviews"}
      </span>
    </span>
  );
}
