import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  CalendarClock,
  CircleCheck,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
  Ruler,
  ShieldAlert,
  Sofa,
} from "lucide-react";
import { AdvanceCalculator } from "@/components/AdvanceCalculator";
import { AmenityIcon } from "@/components/AmenityIcon";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ImageGallery } from "@/components/ImageGallery";
import { AreaMapLoader } from "@/components/map/MapLoaders";
import { PropertyCard } from "@/components/PropertyCard";
import { ScheduleViewingModal } from "@/components/ScheduleViewingModal";
import { ShareButton } from "@/components/ShareButton";
import { getCurrentUser } from "@/lib/auth";
import { AMENITIES, advanceLabel, propertyTypeLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSavedIds, landlordSelect, toView } from "@/lib/properties";
import { landlordRatingSummary, listingAccuracy } from "@/lib/reviews";
import { RatingSummaryLine } from "@/components/reviews/Stars";
import { jsonLdScript, listingJsonLd, listingSummary } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { cn, favoriteModeFor, formatCedis, formatDate, initials } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const raw = await prisma.property.findUnique({ where: { id } });
  if (!raw || raw.isHidden) return { title: "Property not found", robots: { index: false } };
  const p = toView(raw);
  const description = listingSummary(p);
  const title = `${p.title} — ${formatCedis(p.monthlyRent)}/month`;
  const path = `/properties/${p.id}`;
  const images = p.images.slice(0, 1).map((url) => ({ url, alt: p.title }));
  return {
    title: p.title,
    description,
    alternates: { canonical: path },
    // Rented homes stay reachable from old links but drop out of search results.
    robots: p.status === "RENTED" ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", url: path, title, description, ...(images.length ? { images } : {}) },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, ...(images.length ? { images: images.map((i) => i.url) } : {}) },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.property.findUnique({
    where: { id },
    include: { landlord: { select: { ...landlordSelect, phone: true, createdAt: true, _count: { select: { properties: true } } } } },
  });
  if (!raw) notFound();

  const user = await getCurrentUser();
  const canManage = Boolean(user && (user.id === raw.landlordId || user.role === "ADMIN"));
  // Hidden listings exist only for their owner and admins.
  if (raw.isHidden && !canManage) notFound();

  // Count public views only.
  if (!canManage) await prisma.property.update({ where: { id }, data: { views: { increment: 1 } } });

  const property = toView(raw);
  const [savedIds, similarRaw, pendingRequest, landlordRating, accuracy] = await Promise.all([
    getSavedIds(user?.id),
    prisma.property.findMany({
      where: { id: { not: id }, status: "AVAILABLE", isHidden: false, OR: [{ neighborhood: property.neighborhood }, { region: property.region }] },
      orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
      take: 3,
      include: { landlord: { select: landlordSelect } },
    }),
    user?.role === "TENANT"
      ? prisma.viewingRequest.findFirst({ where: { propertyId: id, tenantId: user.id }, orderBy: { createdAt: "desc" } })
      : Promise.resolve(null),
    landlordRatingSummary(raw.landlordId),
    listingAccuracy(id),
  ]);
  const similar = similarRaw.map(toView);
  const rented = property.status === "RENTED";
  const isOwner = canManage;
  const favoriteMode = favoriteModeFor(user?.role);

  return (
    <div className="container py-6 sm:py-8">
      {!property.isHidden && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(listingJsonLd(property)) }} />
      )}
      <nav className="mb-4 flex flex-wrap gap-1 text-sm text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-forest-800">Home</Link> /
        <Link href={`/properties?region=${encodeURIComponent(property.region)}`} className="hover:text-forest-800">{property.region}</Link> /
        <Link href={`/properties?location=${encodeURIComponent(property.neighborhood)}`} className="hover:text-forest-800">{property.neighborhood}</Link>
      </nav>

      {property.isHidden && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-4 text-sm text-terracotta-800">
          <EyeOff className="h-5 w-5 shrink-0" />
          This listing has been hidden by an Efie Homes admin. Only you and admins can see it; it doesn&rsquo;t appear in search.
        </div>
      )}

      {rented && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-stone-300 bg-stone-100 p-4 text-sm">
          <ShieldAlert className="h-5 w-5 text-stone-600" />
          This property has been rented and is no longer accepting viewing requests.
        </div>
      )}

      <ImageGallery images={property.images} title={property.title} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* ---------- Main ---------- */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-forest-50 text-forest-800">{propertyTypeLabel(property.propertyType)}</span>
            <span className="badge bg-gold-100 text-gold-600">{advanceLabel(property.advanceMonths)}</span>
            {property.furnished && <span className="badge bg-sand text-stone-700">Furnished</span>}
            {property.isFeatured && <span className="badge bg-gold-400 text-ink">Featured</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{property.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-stone-600">
            <MapPin className="h-4 w-4 text-terracotta-500" /> {property.address}, {property.neighborhood}, {property.region}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact icon={BedDouble} label="Bedrooms" value={String(property.bedrooms)} />
            <Fact icon={Bath} label="Bathrooms" value={String(property.bathrooms)} />
            <Fact icon={Ruler} label="Size" value={property.sizeSqm ? `${property.sizeSqm} m²` : "—"} />
            <Fact icon={Sofa} label="Furnishing" value={property.furnished ? "Furnished" : "Unfurnished"} />
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">About this home</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">{property.description}</p>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Utilities &amp; amenities</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {AMENITIES.map((a) => {
                const has = property.amenities.includes(a.value);
                return (
                  <li
                    key={a.value}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-sm",
                      has ? "border-forest-200 bg-forest-50/60 text-ink" : "border-stone-200 bg-white text-stone-500 line-through",
                    )}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", has ? "bg-white text-forest-700 shadow-sm" : "bg-stone-100")}>
                      <AmenityIcon amenity={a.value} className="h-4 w-4" />
                    </span>
                    {a.label}
                    {has && <CircleCheck className="ml-auto h-4 w-4 text-forest-600" />}
                  </li>
                );
              })}
            </ul>
          </section>

          {property.latitude !== null && property.longitude !== null && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Location</h2>
              <div className="mt-4 h-72 overflow-hidden rounded-2xl border border-stone-200">
                <AreaMapLoader lat={property.latitude} lng={property.longitude} />
              </div>
              <p className="mt-2 text-sm text-stone-600">
                The shaded circle shows the approximate area in {property.neighborhood}. The landlord shares exact directions when your
                viewing is confirmed.
              </p>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Rental terms</h2>
            <dl className="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
              <Term label="Monthly rent" value={formatCedis(property.monthlyRent)} />
              <Term label="Minimum advance" value={advanceLabel(property.advanceMonths)} />
              <Term label="Security deposit" value={property.securityDeposit ? formatCedis(property.securityDeposit) : "None"} />
              <Term label="Agent commission" value={property.agentFeePercent ? `${property.agentFeePercent}% of advance` : "None — listed by owner"} />
              <Term label="Listed" value={formatDate(property.createdAt)} />
            </dl>
          </section>
        </div>

        {/* ---------- Sidebar ---------- */}
        <aside>
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-3xl font-semibold text-forest-800">{formatCedis(property.monthlyRent)}</p>
                  <p className="text-sm text-stone-500">per month</p>
                </div>
                <div className="flex gap-2">
                  {!property.isHidden && (
                    <ShareButton
                      url={absoluteUrl(`/properties/${property.id}`)}
                      title={property.title}
                      text={`${property.title}: ${formatCedis(property.monthlyRent)}/month in ${property.neighborhood}`}
                      className="min-h-[40px] px-3"
                    />
                  )}
                  <FavoriteButton propertyId={property.id} initialSaved={savedIds.has(property.id)} mode={favoriteMode} variant="full" className="min-h-[40px] px-3" />
                </div>
              </div>

              <div className="mt-4">
                <AdvanceCalculator
                  monthlyRent={property.monthlyRent}
                  minAdvanceMonths={property.advanceMonths}
                  securityDeposit={property.securityDeposit}
                  agentFeePercent={property.agentFeePercent}
                />
              </div>

              <div className="mt-4">
                {isOwner ? (
                  <Link href={`/dashboard/landlord/properties/${property.id}/edit`} className="btn btn-outline w-full">
                    <Pencil className="h-4 w-4" /> Edit this listing
                  </Link>
                ) : (
                  <ScheduleViewingModal
                    propertyId={property.id}
                    propertyTitle={property.title}
                    rented={rented}
                    viewer={user ? { role: user.role, phone: user.phone, name: user.name } : null}
                  />
                )}
              </div>

              {pendingRequest && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-forest-50 p-3 text-xs text-forest-800">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  You requested a viewing for {formatDate(pendingRequest.preferredDate)} — status: <strong>{pendingRequest.status.toLowerCase()}</strong>.
                </div>
              )}

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-500">
                <Eye className="h-3.5 w-3.5" /> {property.views.toLocaleString()} views
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-100 font-bold text-terracotta-700">
                  {initials(raw.landlord.name)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <Link href={`/landlords/${raw.landlordId}`} className="truncate hover:text-forest-800 hover:underline">
                      {raw.landlord.name}
                    </Link>
                    {raw.landlord.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-forest-600" aria-label="Verified" />}
                  </p>
                  <p className="text-xs text-stone-500">
                    {raw.landlord.isVerified ? "Verified landlord/agent" : "Landlord/agent"} · {raw.landlord._count.properties}{" "}
                    {raw.landlord._count.properties === 1 ? "listing" : "listings"} · Joined {formatDate(raw.landlord.createdAt, { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t border-stone-100 pt-3">
                <RatingSummaryLine rating={landlordRating.landlord} count={landlordRating.count} />
                {accuracy.count > 0 && (
                  <p className="text-xs text-stone-600">
                    This listing rated <strong>{accuracy.accuracy.toFixed(1)}/5</strong> for accuracy by {accuracy.count}{" "}
                    {accuracy.count === 1 ? "visitor" : "visitors"}
                  </p>
                )}
                <Link href={`/landlords/${raw.landlordId}`} className="inline-block text-sm font-semibold text-forest-700 hover:underline">
                  View profile and reviews
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title text-2xl sm:text-3xl">Similar homes nearby</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} saved={savedIds.has(p.id)} favoriteMode={favoriteMode} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Bath; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <Icon className="h-5 w-5 text-terracotta-500" />
      <p className="mt-2 text-xs text-stone-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-stone-600">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
