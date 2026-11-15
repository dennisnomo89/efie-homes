import type { Prisma, Property, User } from "@prisma/client";
import { prisma } from "./prisma";
import { AMENITY_VALUES, PAGE_SIZE, PROPERTY_TYPE_VALUES, REGIONS, type Amenity } from "./constants";
import { parseJsonArray } from "./utils";

export type PropertyFilters = {
  location?: string;
  region?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  advance?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities: Amenity[];
  furnished?: boolean;
  includeRented?: boolean;
  sort: "newest" | "price_asc" | "price_desc" | "popular";
  page: number;
};

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function positiveInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseFilters(params: RawParams): PropertyFilters {
  const region = get(params, "region");
  const type = get(params, "type");
  const sort = get(params, "sort");
  const amenities = (get(params, "amenities") ?? "")
    .split(",")
    .filter((a): a is Amenity => (AMENITY_VALUES as readonly string[]).includes(a));

  return {
    location: get(params, "location")?.trim() || undefined,
    region: region && (REGIONS as readonly string[]).includes(region) ? region : undefined,
    type: type && (PROPERTY_TYPE_VALUES as readonly string[]).includes(type) ? type : undefined,
    minPrice: positiveInt(get(params, "minPrice")),
    maxPrice: positiveInt(get(params, "maxPrice")),
    advance: positiveInt(get(params, "advance")),
    bedrooms: positiveInt(get(params, "bedrooms")),
    bathrooms: positiveInt(get(params, "bathrooms")),
    amenities,
    furnished: get(params, "furnished") === "true" ? true : undefined,
    includeRented: get(params, "includeRented") === "true",
    sort: sort === "price_asc" || sort === "price_desc" || sort === "popular" ? sort : "newest",
    page: Math.max(1, positiveInt(get(params, "page")) ?? 1),
  };
}

export function buildWhere(f: PropertyFilters): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [];
  and.push({ isHidden: false });
  if (!f.includeRented) and.push({ status: "AVAILABLE" });
  if (f.location) {
    and.push({
      OR: [
        { region: { contains: f.location, mode: "insensitive" } },
        { neighborhood: { contains: f.location, mode: "insensitive" } },
        { address: { contains: f.location, mode: "insensitive" } },
        { title: { contains: f.location, mode: "insensitive" } },
      ],
    });
  }
  if (f.region) and.push({ region: f.region });
  if (f.type) and.push({ propertyType: f.type });
  if (f.minPrice !== undefined) and.push({ monthlyRent: { gte: f.minPrice } });
  if (f.maxPrice !== undefined && f.maxPrice > 0) and.push({ monthlyRent: { lte: f.maxPrice } });
  // "advance" = the most months the tenant can pay upfront
  if (f.advance) and.push({ advanceMonths: { lte: f.advance } });
  if (f.bedrooms) and.push({ bedrooms: { gte: f.bedrooms } });
  if (f.bathrooms) and.push({ bathrooms: { gte: f.bathrooms } });
  if (f.furnished) and.push({ furnished: true });
  for (const amenity of f.amenities) and.push({ amenities: { contains: `"${amenity}"` } });
  return and.length ? { AND: and } : {};
}

export function buildOrderBy(sort: PropertyFilters["sort"]): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ monthlyRent: "asc" }];
    case "price_desc":
      return [{ monthlyRent: "desc" }];
    case "popular":
      return [{ views: "desc" }, { createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  }
}

const landlordSelect = { id: true, name: true, isVerified: true, avatarUrl: true, role: true } as const;

export type PropertyWithLandlord = Property & { landlord: Pick<User, "id" | "name" | "isVerified" | "avatarUrl" | "role"> };

export type PropertyView = Omit<Property, "images" | "amenities"> & {
  images: string[];
  amenities: Amenity[];
  landlord?: Pick<User, "id" | "name" | "isVerified" | "avatarUrl" | "role">;
};

export function toView<T extends Property>(p: T): Omit<T, "images" | "amenities"> & { images: string[]; amenities: Amenity[] } {
  return {
    ...p,
    images: parseJsonArray(p.images),
    amenities: parseJsonArray(p.amenities) as Amenity[],
  };
}

export async function searchProperties(f: PropertyFilters) {
  const where = buildWhere(f);
  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: buildOrderBy(f.sort),
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { landlord: { select: landlordSelect } },
    }),
  ]);
  return {
    total,
    page: f.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    properties: rows.map(toView),
  };
}

export async function getSavedIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const saved = await prisma.savedProperty.findMany({ where: { userId }, select: { propertyId: true } });
  return new Set(saved.map((s) => s.propertyId));
}

export { landlordSelect };

/** Serialises filters back into a query string (used for pagination links). */
export function filtersToQuery(f: Partial<PropertyFilters>, overrides: Record<string, string | number | undefined> = {}): string {
  const q = new URLSearchParams();
  const entries: Record<string, string | number | boolean | undefined> = {
    location: f.location,
    region: f.region,
    type: f.type,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    advance: f.advance,
    bedrooms: f.bedrooms,
    bathrooms: f.bathrooms,
    amenities: f.amenities?.length ? f.amenities.join(",") : undefined,
    furnished: f.furnished ? "true" : undefined,
    sort: f.sort && f.sort !== "newest" ? f.sort : undefined,
    page: f.page && f.page > 1 ? f.page : undefined,
    ...overrides,
  };
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined && v !== "" && v !== false) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
