import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, Home, Info, Sofa, Wallet } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { getCurrentUser } from "@/lib/auth";
import { SMALL_SAMPLE } from "@/lib/areas";
import { loadArea } from "@/lib/areas-data";
import { advanceLabel } from "@/lib/constants";
import { getSavedIds } from "@/lib/properties";
import { favoriteModeFor, formatCedis } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = await loadArea(slug);
  if (!area) return { title: "Area not found", robots: { index: false } };
  const { stats } = area;
  const description =
    `Renting in ${area.name}, ${area.region}: ${stats.count} ${stats.count === 1 ? "home" : "homes"} listed, typical rent ` +
    `${formatCedis(stats.medianRent ?? 0)} a month` +
    (stats.usualAdvance ? `, usually ${advanceLabel(stats.usualAdvance).toLowerCase()}.` : ".");
  return { title: `Renting in ${area.name}`, description, alternates: { canonical: `/areas/${slug}` } };
}

export default async function AreaGuidePage({ params }: Props) {
  const { slug } = await params;
  const area = await loadArea(slug);
  if (!area) notFound();
  const user = await getCurrentUser();
  const savedIds = await getSavedIds(user?.id);
  const { stats, homes } = area;
  const search = `/properties?location=${encodeURIComponent(area.name)}`;
  const topTypeRent = Math.max(...stats.byType.map((t) => t.medianRent), 1);
  const typicalAdvance = stats.medianRent !== null && stats.usualAdvance ? stats.medianRent * stats.usualAdvance : null;

  return (
    <div className="container py-8 sm:py-10">
      <nav className="mb-4 flex flex-wrap gap-1 text-sm text-stone-500" aria-label="Breadcrumb">
        <Link href="/areas" className="hover:text-forest-800">Neighbourhood guides</Link> /
        <span>{area.region}</span>
      </nav>
      <h1 className="section-title">Renting in {area.name}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Based on the {stats.count} {stats.count === 1 ? "home" : "homes"} listed in {area.name} on Efie Homes right now.
      </p>
      {stats.count < SMALL_SAMPLE && (
        <p className="mt-3 flex max-w-2xl gap-2 rounded-xl bg-gold-100 p-3 text-sm text-stone-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
          Only a few homes are listed here at the moment, so treat these figures as a rough guide.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Home} label="Homes to rent" value={String(stats.count)} />
        <Tile
          icon={Wallet}
          label="Typical rent"
          value={stats.medianRent !== null ? `${formatCedis(stats.medianRent)}/mo` : "—"}
          note={stats.minRent !== null && stats.maxRent !== null && stats.count > 1 ? `${formatCedis(stats.minRent)} to ${formatCedis(stats.maxRent)}` : undefined}
        />
        <Tile icon={CalendarClock} label="Usual advance" value={stats.usualAdvance ? advanceLabel(stats.usualAdvance) : "—"} />
        <Tile icon={Sofa} label="Furnished" value={`${stats.furnishedPercent}%`} note="of homes listed" />
      </div>

      {typicalAdvance !== null && (
        <p className="mt-4 max-w-2xl text-sm text-stone-700">
          For a typical home here, the advance alone comes to about <strong>{formatCedis(typicalAdvance)}</strong> (
          {advanceLabel(stats.usualAdvance!).toLowerCase()} at {formatCedis(stats.medianRent!)} a month), before any agent fee or deposit.
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Typical rent by type of home</h2>
          <p className="text-sm text-stone-600">Middle rent per month for each type listed here.</p>
          <ul className="mt-4 space-y-3">
            {stats.byType.map((t) => (
              <li key={t.type}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={`${search}&type=${t.type}`} className="font-medium hover:text-forest-800 hover:underline">
                    {t.label}
                  </Link>
                  <span className="shrink-0 tabular-nums">
                    <strong>{formatCedis(t.medianRent)}</strong>
                    <span className="text-stone-500"> · {t.count} {t.count === 1 ? "home" : "homes"}</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-stone-100" aria-hidden="true">
                  <div className="h-2 rounded-full bg-forest-500" style={{ width: `${Math.max(4, (t.medianRent / topTypeRent) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Essentials</h2>
          <p className="text-sm text-stone-600">Share of homes listed here that have each.</p>
          <ul className="mt-4 space-y-3">
            {stats.amenities.map((a) => (
              <li key={a.value}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{a.label}</span>
                  <strong className="tabular-nums">{a.percent}%</strong>
                </div>
                <div className="mt-1 h-2 rounded-full bg-stone-100" aria-hidden="true">
                  <div className="h-2 rounded-full bg-forest-500" style={{ width: `${a.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 className="section-title text-2xl sm:text-3xl">Homes in {area.name}</h2>
          <Link href={search} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-800 hover:underline">
            Filter and see them on a map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {homes.map((p, i) => (
            <PropertyCard key={p.id} property={p} saved={savedIds.has(p.id)} favoriteMode={favoriteModeFor(user?.role)} priority={i < 3} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-stone-500">
        <Link href="/areas" className="font-semibold text-forest-800 hover:underline">
          See other neighbourhoods
        </Link>
      </p>
    </div>
  );
}

function Tile({ icon: Icon, label, value, note }: { icon: typeof Home; label: string; value: string; note?: string }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 text-sm text-stone-600">
        <Icon className="h-4 w-4" /> {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">{value}</p>
      {note && <p className="text-xs text-stone-500">{note}</p>}
    </div>
  );
}
