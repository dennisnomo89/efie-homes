import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX, X } from "lucide-react";
import { FilterSidebar } from "@/components/FilterSidebar";
import { PropertyCard } from "@/components/PropertyCard";
import { SortSelect } from "@/components/SortSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/auth";
import { advanceLabel, amenityLabel, propertyTypeLabel } from "@/lib/constants";
import { filtersToQuery, getSavedIds, parseFilters, searchProperties, type PropertyFilters } from "@/lib/properties";
import { cn, favoriteModeFor, formatCedis } from "@/lib/utils";

export const metadata: Metadata = { title: "Rentals across Ghana" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const session = await getSession();
  const [{ properties, total, page, pageCount }, savedIds] = await Promise.all([searchProperties(filters), getSavedIds(session?.sub)]);
  const favoriteMode = favoriteModeFor(session?.role);

  const heading = filters.location ?? filters.region ?? "Ghana";
  const pills = activePills(filters);

  return (
    <div className="container py-8 sm:py-10">
      <div className="flex flex-col gap-1">
        <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-forest-800">
            Home
          </Link>{" "}
          / <span className="text-stone-700">Rentals</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {filters.type ? `${propertyTypeLabel(filters.type)} rentals` : "Homes for rent"} in {heading}
        </h1>
        <p className="text-stone-600">
          {total} {total === 1 ? "property" : "properties"} available
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]">
        <FilterSidebar />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {pills.map((p) => (
                <Link
                  key={p.key}
                  href={`/properties${filtersToQuery({ ...filters, ...p.clear, page: 1 })}`}
                  className="badge bg-forest-50 py-1.5 text-forest-800 ring-1 ring-forest-200 hover:bg-forest-100"
                  scroll={false}
                >
                  {p.label} <X className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
            <div className="ml-auto w-full sm:w-56">
              <SortSelect />
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={SearchX}
                title="No homes match those filters"
                description="Try widening your budget, choosing a nearby neighbourhood, or removing a few utilities. New listings are added every day."
                action={{ label: "Clear all filters", href: "/properties" }}
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} saved={savedIds.has(p.id)} favoriteMode={favoriteMode} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              <PageLink filters={filters} page={page - 1} disabled={page <= 1} label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </PageLink>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <PageLink key={n} filters={filters} page={n} active={n === page} label={`Page ${n}`}>
                  {n}
                </PageLink>
              ))}
              <PageLink filters={filters} page={page + 1} disabled={page >= pageCount} label="Next">
                <ChevronRight className="h-4 w-4" />
              </PageLink>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  active,
  label,
  children,
}: {
  filters: PropertyFilters;
  page: number;
  disabled?: boolean;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const cls = cn(
    "flex h-11 min-w-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition",
    active ? "border-forest-800 bg-forest-800 text-white" : "border-stone-300 bg-white hover:border-forest-700",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) return <span className={cls} aria-disabled="true" aria-label={label}>{children}</span>;
  return (
    <Link href={`/properties${filtersToQuery({ ...filters, page })}`} className={cls} aria-label={label} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

function activePills(f: PropertyFilters) {
  const pills: { key: string; label: string; clear: Partial<PropertyFilters> }[] = [];
  if (f.region) pills.push({ key: "region", label: f.region, clear: { region: undefined } });
  if (f.location) pills.push({ key: "location", label: `“${f.location}”`, clear: { location: undefined } });
  if (f.type) pills.push({ key: "type", label: propertyTypeLabel(f.type), clear: { type: undefined } });
  if (f.minPrice) pills.push({ key: "min", label: `From ${formatCedis(f.minPrice)}`, clear: { minPrice: undefined } });
  if (f.maxPrice) pills.push({ key: "max", label: `Up to ${formatCedis(f.maxPrice)}`, clear: { maxPrice: undefined } });
  if (f.advance) pills.push({ key: "adv", label: `≤ ${advanceLabel(f.advance)}`, clear: { advance: undefined } });
  if (f.bedrooms) pills.push({ key: "bed", label: `${f.bedrooms}+ beds`, clear: { bedrooms: undefined } });
  if (f.bathrooms) pills.push({ key: "bath", label: `${f.bathrooms}+ baths`, clear: { bathrooms: undefined } });
  if (f.furnished) pills.push({ key: "furn", label: "Furnished", clear: { furnished: undefined } });
  for (const a of f.amenities) {
    pills.push({ key: a, label: amenityLabel(a), clear: { amenities: f.amenities.filter((x) => x !== a) } });
  }
  return pills;
}
