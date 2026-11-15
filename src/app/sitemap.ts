import type { MetadataRoute } from "next";
import { PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

// Built on request so new listings appear without a redeploy (the database isn't available at build time).
export const dynamic = "force-dynamic";

/** /sitemap.xml — the home page, search landing pages and every public listing. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, regionsWithHomes, typesWithHomes] = await Promise.all([
    prisma.property.findMany({
      where: { isHidden: false, status: "AVAILABLE" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 45_000, // stay under the 50,000-URL sitemap limit
    }),
    prisma.property.groupBy({ by: ["region"], where: { isHidden: false, status: "AVAILABLE" } }),
    prisma.property.groupBy({ by: ["propertyType"], where: { isHidden: false, status: "AVAILABLE" } }),
  ]);

  const now = new Date();
  const regions = REGIONS.filter((r) => regionsWithHomes.some((x) => x.region === r));
  const types = PROPERTY_TYPES.filter((t) => typesWithHomes.some((x) => x.propertyType === t.value));

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/properties"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    ...["/about", "/contact", "/terms", "/privacy"].map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/about" || path === "/contact" ? 0.5 : 0.3,
    })),
    ...regions.map((r) => ({
      url: absoluteUrl(`/properties?region=${encodeURIComponent(r)}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...types.map((t) => ({
      url: absoluteUrl(`/properties?type=${t.value}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...listings.map((l) => ({
      url: absoluteUrl(`/properties/${l.id}`),
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
