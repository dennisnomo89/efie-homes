import { advanceLabel, propertyTypeLabel } from "./constants";
import { absoluteUrl, SITE_NAME } from "./site";
import { formatCedis } from "./utils";

type ListingForSeo = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  region: string;
  neighborhood: string;
  monthlyRent: number;
  advanceMonths: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number | null;
  furnished: boolean;
  status: string;
  images: string[];
  /** Already rounded for the public (see toView) */
  latitude: number | null;
  longitude: number | null;
  updatedAt: Date;
};

/** One-line summary used for search snippets and share previews (≤ ~160 characters). */
export function listingSummary(p: ListingForSeo): string {
  const beds = p.bedrooms > 0 ? `${p.bedrooms}-bed ` : "";
  const parts = [
    `${formatCedis(p.monthlyRent)}/month`,
    `${beds}${propertyTypeLabel(p.propertyType).toLowerCase()} in ${p.neighborhood}, ${p.region}`,
    advanceLabel(p.advanceMonths).toLowerCase(),
  ];
  const text = `${parts.join(" · ")}. ${p.furnished ? "Furnished. " : ""}Book a viewing on ${SITE_NAME}.`;
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/**
 * schema.org structured data for a rental listing: an Offer (rent in GHS per month)
 * for an Accommodation with rooms, size and an approximate location.
 */
export function listingJsonLd(p: ListingForSeo) {
  const url = absoluteUrl(`/properties/${p.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    url,
    name: p.title,
    description: p.description.slice(0, 500),
    image: p.images.slice(0, 5),
    dateModified: p.updatedAt.toISOString(),
    offers: {
      "@type": "Offer",
      businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
      availability: p.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      price: p.monthlyRent,
      priceCurrency: "GHS",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: p.monthlyRent,
        priceCurrency: "GHS",
        unitCode: "MON",
        unitText: "month",
      },
    },
    mainEntity: {
      "@type": "Accommodation",
      name: propertyTypeLabel(p.propertyType),
      numberOfBedrooms: p.bedrooms,
      numberOfBathroomsTotal: p.bathrooms,
      ...(p.sizeSqm ? { floorSize: { "@type": "QuantitativeValue", value: p.sizeSqm, unitCode: "MTK" } } : {}),
      address: { "@type": "PostalAddress", addressLocality: p.neighborhood, addressRegion: p.region, addressCountry: "GH" },
      ...(p.latitude !== null && p.longitude !== null
        ? { geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } }
        : {}),
    },
  };
}

/** Site-level structured data (organisation + search box) for the home page. */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": absoluteUrl("/#org"), name: SITE_NAME, url: absoluteUrl("/"), areaServed: "GH" },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: SITE_NAME,
        url: absoluteUrl("/"),
        inLanguage: "en-GH",
        publisher: { "@id": absoluteUrl("/#org") },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/properties?location={search_term_string}") },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/** Serialises JSON-LD safely for a <script> tag (no "</script>" breakout from user text). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
