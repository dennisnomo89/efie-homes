import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifySavedSearchMatches } from "@/lib/notifications";
import { guard, ok, readJson, validationFailed } from "@/lib/api";
import { parseFilters, searchProperties, toView } from "@/lib/properties";
import { propertySchema } from "@/lib/validations";

/** GET /api/properties — public search with the same filters as the listings page. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filters = parseFilters(searchParams);
  const result = await searchProperties(filters);
  return ok(result);
}

/** POST /api/properties — landlords (and admins) create a listing. */
export async function POST(req: Request) {
  const g = await guard(["LANDLORD", "ADMIN"]);
  if (g.response) return g.response;

  const parsed = propertySchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const { images, amenities, ...data } = parsed.data;

  const property = await prisma.property.create({
    data: {
      ...data,
      images: JSON.stringify(images),
      amenities: JSON.stringify(amenities),
      landlordId: g.session.sub,
    },
  });
  // Email tenants whose saved searches this new home matches (after the response is sent).
  after(() => notifySavedSearchMatches(property.id));
  return ok({ property: toView(property) }, 201);
}
