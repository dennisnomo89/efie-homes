import { prisma } from "@/lib/prisma";
import { fail, guard, ok, readJson, validationFailed } from "@/lib/api";
import { viewingRequestSchema } from "@/lib/validations";

const propertySummary = {
  select: { id: true, title: true, neighborhood: true, region: true, images: true, monthlyRent: true, landlordId: true },
} as const;

/**
 * GET /api/viewings
 * Tenants receive the requests they sent; landlords receive requests for their listings.
 */
export async function GET() {
  const g = await guard();
  if (g.response) return g.response;
  const { sub, role } = g.session;

  const where =
    role === "TENANT" ? { tenantId: sub } : role === "LANDLORD" ? { property: { landlordId: sub } } : {};

  const viewings = await prisma.viewingRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      property: propertySummary,
      tenant: { select: { id: true, name: true, email: true } },
    },
  });
  return ok({ viewings });
}

/** POST /api/viewings — a tenant requests a viewing for a property. */
export async function POST(req: Request) {
  const g = await guard(["TENANT"]);
  if (g.response) return g.response;

  const parsed = viewingRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return validationFailed(parsed.error);
  const { propertyId, preferredDate, preferredTime, phone, message } = parsed.data;

  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, status: true } });
  if (!property) return fail("Property not found.", 404);
  if (property.status !== "AVAILABLE") return fail("This property has already been rented.", 409);

  const duplicate = await prisma.viewingRequest.findFirst({
    where: { propertyId, tenantId: g.session.sub, status: "PENDING" },
    select: { id: true },
  });
  if (duplicate) {
    return fail("You already have a pending viewing request for this property.", 409);
  }

  const viewing = await prisma.viewingRequest.create({
    data: {
      propertyId,
      tenantId: g.session.sub,
      preferredDate: new Date(`${preferredDate}T00:00:00.000Z`),
      preferredTime,
      phone,
      message,
    },
  });
  return ok({ viewing }, 201);
}
