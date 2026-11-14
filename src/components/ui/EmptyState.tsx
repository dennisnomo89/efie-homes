import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

/** Friendly empty state with a soft "house on a hill" illustration. */
export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
      <div className="relative mb-5">
        <svg width="132" height="84" viewBox="0 0 132 84" fill="none" aria-hidden="true">
          <ellipse cx="66" cy="74" rx="62" ry="10" fill="#f3ede3" />
          <path d="M8 74c18-22 38-30 58-30s40 8 58 30" fill="#d8f3e3" />
          <circle cx="108" cy="18" r="9" fill="#f6d488" />
        </svg>
        <div className="absolute left-1/2 top-3 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-stone-200">
          <Icon className="h-7 w-7 text-forest-700" />
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-stone-600">{description}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}
