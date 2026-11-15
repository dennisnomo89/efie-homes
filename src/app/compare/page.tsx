import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Check, GitCompareArrows, Minus } from "lucide-react";
import { CompareSync, RemoveFromCompare } from "@/components/compare/CompareSync";
import { Stars } from "@/components/reviews/Stars";
import { EmptyState } from "@/components/ui/EmptyState";
import { SafeImage } from "@/components/ui/SafeImage";
import { AMENITIES, advanceLabel, propertyTypeLabel } from "@/lib/constants";
import { MAX_COMPARE, parseCompareIds } from "@/lib/compare";
import { calculateUpfront } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { landlordSelect, toView } from "@/lib/properties";
import { landlordRatingSummaries } from "@/lib/reviews";
import { cn, formatCedis, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compare homes",
  description: "Compare rent, advance, move-in cost and amenities side by side.",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ ids?: string | string[] }> };

export default async function ComparePage({ searchParams }: Props) {
  const ids = parseCompareIds((await searchParams).ids);

  const rows = ids.length
    ? await prisma.property.findMany({ where: { id: { in: ids }, isHidden: false }, include: { landlord: { select: landlordSelect } } })
    : [];
  // Keep the order the homes were picked in.
  const homes = ids.flatMap((id) => rows.filter((r) => r.id === id).map(toView));
  const missing = ids.length - homes.length;
  const shownIds = homes.map((h) => h.id);

  const [ratings, accuracy] = await Promise.all([
    landlordRatingSummaries(homes.map((h) => h.landlordId)),
    shownIds.length
      ? prisma.review.groupBy({ by: ["propertyId"], where: { propertyId: { in: shownIds }, isHidden: false }, _avg: { accuracyRating: true }, _count: { _all: true } })
      : Promise.resolve([]),
  ]);

  if (homes.length === 0) {
    return (
      <div className="container py-10">
        <CompareSync ids={[]} />
        <h1 className="section-title">Compare homes</h1>
        <div className="mt-6">
          <EmptyState
            icon={GitCompareArrows}
            title={missing ? "These homes are no longer listed" : "Pick homes to compare"}
            description={`Tap “Compare” on up to ${MAX_COMPARE} listings to see rent, advance, move-in cost and amenities side by side.`}
            action={{ label: "Browse homes", href: "/properties" }}
          />
        </div>
      </div>
    );
  }

  const costs = homes.map((h) =>
    calculateUpfront({ monthlyRent: h.monthlyRent, months: h.advanceMonths, agentFeePercent: h.agentFeePercent, securityDeposit: h.securityDeposit }),
  );
  const lowest = (values: number[]) => (homes.length > 1 ? Math.min(...values) : Number.NaN);
  const lowestRent = lowest(homes.map((h) => h.monthlyRent));
  const lowestMoveIn = lowest(costs.map((c) => c.total));
  // Every amenity at least one of the homes has, in the site's usual order.
  const amenities = AMENITIES.filter((a) => homes.some((h) => h.amenities.includes(a.value)));

  const cols = homes.length;
  const grid = cn("grid gap-x-4", cols === 1 ? "grid-cols-[9rem_minmax(14rem,1fr)]" : cols === 2 ? "grid-cols-[9rem_repeat(2,minmax(13rem,1fr))]" : "grid-cols-[9rem_repeat(3,minmax(13rem,1fr))]");

  const Row = ({ label, children, highlight }: { label: string; children: React.ReactNode[]; highlight?: boolean }) => (
    <div role="row" className={cn(grid, "border-t border-stone-200 py-3", highlight && "bg-sand")}>
      {/* Stays in view while the homes scroll sideways on a phone. */}
      <div role="rowheader" className={cn("sticky left-0 z-10 pl-1 text-sm font-medium text-stone-600", highlight ? "bg-sand" : "bg-cream")}>
        {label}
      </div>
      {children.map((c, i) => (
        <div role="cell" key={shownIds[i]} className="text-sm">
          {c}
        </div>
      ))}
    </div>
  );

  return (
    <div className="container py-8 sm:py-10">
      <CompareSync ids={shownIds} />
      <h1 className="section-title">Compare homes</h1>
      <p className="mt-2 text-stone-600">
        Move-in cost is the rent advance plus the agent&rsquo;s commission and any security deposit — what you pay before you get the keys.
      </p>
      {missing > 0 && (
        <p className="mt-3 rounded-xl bg-gold-100 p-3 text-sm text-gold-600">
          {missing === 1 ? "One home you picked is" : `${missing} homes you picked are`} no longer listed, so {missing === 1 ? "it isn't" : "they aren't"} shown.
        </p>
      )}

      <div className="mt-6 overflow-x-auto pb-2">
        <div role="table" aria-label="Homes compared side by side" className="min-w-max">
          <div role="row" className={grid}>
            <div role="columnheader" className="sr-only">
              Detail
            </div>
            {homes.map((h, i) => (
              <div role="columnheader" key={h.id} className="pb-3">
                <div className="relative overflow-hidden rounded-2xl bg-sand">
                  <SafeImage src={h.images[0]} alt="" sizes="260px" className="aspect-[4/3] w-full object-cover" priority={i === 0} />
                  <RemoveFromCompare id={h.id} ids={shownIds} title={h.title} />
                </div>
                <Link href={`/properties/${h.id}`} className="mt-2 line-clamp-2 block font-semibold leading-snug hover:text-forest-800 hover:underline">
                  {h.title}
                </Link>
                <p className="text-sm text-stone-600">
                  {h.neighborhood}, {h.region}
                </p>
                {h.status === "RENTED" && <span className="badge mt-1 bg-ink text-white">Rented</span>}
              </div>
            ))}
          </div>

          <Row label="Monthly rent">
            {homes.map((h) => (
              <span key={h.id} className="font-display text-lg font-semibold text-forest-800">
                {formatCedis(h.monthlyRent)}
                {h.monthlyRent === lowestRent && <LowestBadge />}
              </span>
            ))}
          </Row>
          <Row label="Advance">{homes.map((h) => advanceLabel(h.advanceMonths))}</Row>
          <Row label="Move-in cost" highlight>
            {costs.map((c, i) => (
              <div key={shownIds[i]}>
                <p className="font-display text-lg font-semibold">
                  {formatCedis(c.total)}
                  {c.total === lowestMoveIn && <LowestBadge />}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                  <li>Advance {formatCedis(c.advance)}</li>
                  <li>Agent fee {c.agentFee ? formatCedis(c.agentFee) : "none"}</li>
                  <li>Deposit {c.securityDeposit ? formatCedis(c.securityDeposit) : "none"}</li>
                </ul>
              </div>
            ))}
          </Row>
          <Row label="Type">{homes.map((h) => propertyTypeLabel(h.propertyType))}</Row>
          <Row label="Bedrooms">{homes.map((h) => h.bedrooms)}</Row>
          <Row label="Bathrooms">{homes.map((h) => h.bathrooms)}</Row>
          <Row label="Size">{homes.map((h) => (h.sizeSqm ? `${h.sizeSqm} m²` : "Not given"))}</Row>
          <Row label="Furnished">{homes.map((h) => <YesNo key={h.id} value={h.furnished} />)}</Row>
          {amenities.map((a) => (
            <Row key={a.value} label={a.label}>
              {homes.map((h) => (
                <YesNo key={h.id} value={h.amenities.includes(a.value)} />
              ))}
            </Row>
          ))}
          <Row label="Landlord">
            {homes.map((h) => {
              const r = ratings.get(h.landlordId);
              return (
                <div key={h.id}>
                  <Link href={`/landlords/${h.landlordId}`} className="inline-flex items-center gap-1 font-medium hover:underline">
                    {h.landlord?.name}
                    {h.landlord?.isVerified && <BadgeCheck className="h-4 w-4 text-forest-600" aria-label="Verified" />}
                  </Link>
                  {r ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-600">
                      <Stars value={r.landlord} /> {r.landlord.toFixed(1)} ({r.count})
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500">No reviews yet</p>
                  )}
                </div>
              );
            })}
          </Row>
          <Row label="Listing accuracy">
            {homes.map((h) => {
              const a = accuracy.find((x) => x.propertyId === h.id);
              return a?._avg.accuracyRating ? `${(Math.round(a._avg.accuracyRating * 10) / 10).toFixed(1)}/5 (${a._count._all})` : "Not rated yet";
            })}
          </Row>
          <Row label="Listed">{homes.map((h) => formatDate(h.createdAt))}</Row>
          <div role="row" className={cn(grid, "border-t border-stone-200 pt-4")}>
            <div role="rowheader" className="sr-only">
              Open
            </div>
            {homes.map((h) => (
              <div role="cell" key={h.id}>
                <Link href={`/properties/${h.id}`} className="btn btn-primary btn-sm w-full">
                  View &amp; book a viewing
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {homes.length < MAX_COMPARE && (
        <p className="mt-6 text-sm text-stone-600">
          You can add {MAX_COMPARE - homes.length} more {MAX_COMPARE - homes.length === 1 ? "home" : "homes"}.{" "}
          <Link href="/properties" className="font-semibold text-forest-800 hover:underline">
            Keep browsing
          </Link>
        </p>
      )}
    </div>
  );
}

function LowestBadge() {
  return <span className="badge ml-2 bg-forest-50 align-middle font-sans text-xs font-semibold text-forest-700">Lowest</span>;
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-forest-700">
      <Check className="h-4 w-4" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-stone-500">
      <Minus className="h-4 w-4" /> No
    </span>
  );
}
