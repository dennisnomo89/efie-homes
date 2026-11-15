import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Home, Star } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { HideReviewButton } from "@/components/reviews/ReviewActions";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Stars } from "@/components/reviews/Stars";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSavedIds, landlordSelect, toView } from "@/lib/properties";
import { landlordRatingSummary } from "@/lib/reviews";
import { favoriteModeFor, formatDate, initials } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

async function findLandlord(id: string) {
  const u = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, isVerified: true, createdAt: true } });
  return u && u.role === "LANDLORD" ? u : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const landlord = await findLandlord(id);
  if (!landlord) return { title: "Landlord not found", robots: { index: false } };
  const rating = await landlordRatingSummary(id);
  const description =
    rating.count > 0
      ? `${landlord.name} is rated ${rating.landlord.toFixed(1)}/5 by ${rating.count} tenants on Efie Homes. See their homes for rent and reviews.`
      : `See homes for rent from ${landlord.name} on Efie Homes.`;
  return { title: `${landlord.name} — landlord reviews`, description, alternates: { canonical: `/landlords/${id}` } };
}

export default async function LandlordProfilePage({ params }: Props) {
  const { id } = await params;
  const landlord = await findLandlord(id);
  if (!landlord) notFound();

  const viewer = await getCurrentUser();
  const isAdmin = viewer?.role === "ADMIN";

  const [rating, listingsRaw, reviews, savedIds] = await Promise.all([
    landlordRatingSummary(id),
    prisma.property.findMany({
      where: { landlordId: id, isHidden: false },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { landlord: { select: landlordSelect } },
    }),
    prisma.review.findMany({
      // Admins also see hidden reviews so they can restore them.
      where: { landlordId: id, ...(isAdmin ? {} : { isHidden: false }) },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { tenant: { select: { name: true } }, landlord: { select: { name: true } } },
    }),
    getSavedIds(viewer?.id),
  ]);
  const listings = listingsRaw.map(toView);
  const available = listings.filter((p) => p.status === "AVAILABLE");
  const favoriteMode = favoriteModeFor(viewer?.role);

  // Star breakdown of visible reviews, 5 down to 1.
  const visible = reviews.filter((r) => !r.isHidden);
  const breakdown = [5, 4, 3, 2, 1].map((n) => ({ n, count: visible.filter((r) => r.landlordRating === n).length }));

  return (
    <div className="container py-8 sm:py-10">
      <section className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-terracotta-100 text-2xl font-bold text-terracotta-700">
          {initials(landlord.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 font-display text-3xl font-bold">
            {landlord.name}
            {landlord.isVerified && <BadgeCheck className="h-6 w-6 text-forest-600" aria-label="Verified" />}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {landlord.isVerified ? "Verified landlord/agent" : "Landlord/agent"} · Joined {formatDate(landlord.createdAt, { month: "long", year: "numeric" })} ·{" "}
            {available.length} {available.length === 1 ? "home" : "homes"} available
          </p>
        </div>
        {rating.count > 0 && (
          <div className="shrink-0 sm:text-right">
            <p className="font-display text-4xl font-bold">{rating.landlord.toFixed(1)}</p>
            <Stars value={rating.landlord} size="md" />
            <p className="mt-1 text-sm text-stone-600">
              {rating.count} {rating.count === 1 ? "review" : "reviews"} · listings {rating.accuracy.toFixed(1)}/5 accurate
            </p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="section-title text-2xl">Homes from {landlord.name.split(" ")[0]}</h2>
        {listings.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={Home} title="No homes listed right now" description="Check back soon, or browse other homes for rent." action={{ label: "Browse homes", href: "/properties" }} />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((p) => (
              <PropertyCard key={p.id} property={p} saved={savedIds.has(p.id)} favoriteMode={favoriteMode} />
            ))}
          </div>
        )}
      </section>

      <section id="reviews" className="mt-12 scroll-mt-24">
        <h2 className="section-title text-2xl">Reviews from tenants</h2>
        <p className="mt-1 text-sm text-stone-600">Only people who had a confirmed viewing through Efie Homes can leave a review.</p>
        {reviews.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={Star} title="No reviews yet" description={`${landlord.name.split(" ")[0]} hasn't been reviewed yet.`} />
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
            <dl className="space-y-1.5 self-start text-sm">
              {breakdown.map((b) => (
                <div key={b.n} className="flex items-center gap-2">
                  <dt className="w-14 shrink-0 text-stone-600">{b.n} star</dt>
                  <dd className="flex flex-1 items-center gap-2">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                      <span className="block h-full rounded-full bg-gold-500" style={{ width: `${visible.length ? (b.count / visible.length) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 text-right text-stone-600">{b.count}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} actions={isAdmin ? <HideReviewButton reviewId={r.id} isHidden={r.isHidden} /> : undefined} />
              ))}
            </div>
          </div>
        )}
      </section>

      <p className="mt-10 text-sm text-stone-500">
        See something wrong in a review?{" "}
        <Link href="/contact" className="font-semibold text-forest-800 hover:underline">
          Let us know
        </Link>
        .
      </p>
    </div>
  );
}
