import Link from "next/link";
import { Bath, BadgeCheck, BedDouble, MapPin, Ruler } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { CompareButton } from "./compare/CompareControls";
import { SafeImage } from "./ui/SafeImage";
import { advanceLabel, amenityLabel, propertyTypeLabel } from "@/lib/constants";
import { priceDrop } from "@/lib/price-drop";
import type { PropertyView } from "@/lib/properties";
import { formatCedis } from "@/lib/utils";

type Props = {
  property: PropertyView;
  saved?: boolean;
  favoriteMode?: "tenant" | "unauth" | "landlord";
  /** Cards visible without scrolling: load the photo immediately. */
  priority?: boolean;
};

const HIGHLIGHT_AMENITIES = ["BOREHOLE_POLYTANK", "WALLED_GATED", "GENERATOR_SOLAR", "ECG_PREPAID"];

export function PropertyCard({ property, saved = false, favoriteMode = "unauth", priority = false }: Props) {
  const highlights = property.amenities.filter((a) => HIGHLIGHT_AMENITIES.includes(a)).slice(0, 2);
  const rented = property.status === "RENTED";
  const drop = rented ? null : priceDrop(property);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <SafeImage
          priority={priority}
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
          src={property.images[0]}
          alt={property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="badge bg-white/95 text-ink shadow-sm">{propertyTypeLabel(property.propertyType)}</span>
            {property.isFeatured && !rented && <span className="badge bg-gold-400 text-ink shadow-sm">Featured</span>}
            {drop && <span className="badge bg-terracotta-600 text-white shadow-sm">Price dropped {drop.percent}%</span>}
            {rented && <span className="badge bg-ink text-white">Rented</span>}
          </div>
          <FavoriteButton propertyId={property.id} initialSaved={saved} mode={favoriteMode} />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="badge bg-forest-900/85 text-white backdrop-blur">{advanceLabel(property.advanceMonths)}</span>
          {!rented && <CompareButton propertyId={property.id} />}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="font-display text-xl font-semibold text-forest-800">
          {formatCedis(property.monthlyRent)}
          <span className="font-sans text-sm font-normal text-stone-500"> / month</span>
          {drop && (
            <span className="ml-2 font-sans text-sm font-normal text-stone-500">
              <span className="sr-only">was </span>
              <s>{formatCedis(drop.from)}</s>
            </span>
          )}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-semibold leading-snug text-ink group-hover:text-forest-800">{property.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-600">
          <MapPin className="h-4 w-4 shrink-0 text-terracotta-500" />
          <span className="truncate">
            {property.neighborhood}, {property.region}
          </span>
        </p>

        <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-4 text-sm text-stone-700">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-stone-500" /> {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-stone-500" /> {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
          </span>
          {property.sizeSqm && (
            <span className="hidden items-center gap-1.5 sm:flex">
              <Ruler className="h-4 w-4 text-stone-500" /> {property.sizeSqm} m²
            </span>
          )}
        </div>

        {(highlights.length > 0 || property.landlord?.isVerified) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {property.landlord?.isVerified && (
              <span className="badge bg-forest-50 text-forest-700">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {highlights.map((a) => (
              <span key={a} className="badge bg-sand text-stone-700">
                {amenityLabel(a)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="flex gap-4 border-t border-stone-100 pt-4">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
