import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Efie Homes — home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-forest-800 shadow-sm transition group-hover:bg-forest-900">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M3 11.2 12 4l9 7.2" stroke="#f2c14e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9.2h12V10" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 19.2v-4.6h4v4.6" stroke="#e2805c" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={cn("font-display text-xl font-semibold tracking-tight", light ? "text-white" : "text-ink")}>
        Efie<span className="text-terracotta-500"> Homes</span>
      </span>
    </Link>
  );
}
