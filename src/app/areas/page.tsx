import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { REGIONS } from "@/lib/constants";
import { listAreas } from "@/lib/areas-data";
import { formatCedis } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Neighbourhood guides",
  description: "Typical rent, advance and amenities in neighbourhoods across Ghana, from East Legon and Osu to Kumasi and Takoradi.",
  alternates: { canonical: "/areas" },
};

export default async function AreasPage() {
  const areas = await listAreas();
  // Regions in the usual order, each with its areas busiest first.
  const regions = REGIONS.map((r) => ({ region: r, areas: areas.filter((a) => a.region === r) })).filter((r) => r.areas.length);

  return (
    <div className="container py-8 sm:py-10">
      <h1 className="section-title">Neighbourhood guides</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        What renting costs in each area right now: typical monthly rent by type of home, the advance landlords usually ask for, and how many
        homes have a prepaid meter, borehole or standby power. Worked out from the homes listed on Efie Homes today.
      </p>

      {regions.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={MapPin} title="No homes listed yet" description="Area guides appear as soon as homes are listed." action={{ label: "Browse homes", href: "/properties" }} />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {regions.map(({ region, areas: list }) => (
            <section key={region}>
              <h2 className="text-xl font-semibold">{region}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/areas/${a.slug}`} className="card group flex items-center gap-3 p-4 transition hover:shadow-lift">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold group-hover:text-forest-800">{a.name}</span>
                        <span className="block text-sm text-stone-600">
                          {a.count} {a.count === 1 ? "home" : "homes"}
                          {a.medianRent !== null && <> · typically {formatCedis(a.medianRent)}/mo</>}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-forest-700" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
