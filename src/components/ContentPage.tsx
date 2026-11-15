import type { ReactNode } from "react";

/** Simple, readable layout for About / Terms / Privacy style pages. */
export function ContentPage({ eyebrow, title, intro, updated, children }: { eyebrow?: string; title: string; intro?: ReactNode; updated?: string; children: ReactNode }) {
  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {intro && <div className="mt-3 text-lg text-stone-600">{intro}</div>}
      {updated && <p className="mt-2 text-sm text-stone-500">Last updated {updated}</p>}
      <div className="content-prose mt-8">{children}</div>
    </div>
  );
}
