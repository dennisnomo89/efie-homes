import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PropertyForm, type PropertyFormValues } from "@/components/dashboard/PropertyForm";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit listing" };

type Props = { params: Promise<{ id: string }> };

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(["LANDLORD", "ADMIN"], `/dashboard/landlord/properties/${id}/edit`);
  const p = await prisma.property.findUnique({ where: { id } });
  if (!p || (p.landlordId !== user.id && user.role !== "ADMIN")) notFound();

  const initial: PropertyFormValues = {
    title: p.title,
    description: p.description,
    propertyType: p.propertyType,
    region: p.region,
    neighborhood: p.neighborhood,
    address: p.address,
    monthlyRent: String(p.monthlyRent),
    advanceMonths: String(p.advanceMonths),
    securityDeposit: String(p.securityDeposit),
    agentFeePercent: String(p.agentFeePercent),
    bedrooms: String(p.bedrooms),
    bathrooms: String(p.bathrooms),
    sizeSqm: p.sizeSqm ? String(p.sizeSqm) : "",
    furnished: p.furnished,
    images: parseJsonArray(p.images),
    amenities: parseJsonArray(p.amenities),
    status: p.status === "RENTED" ? "RENTED" : "AVAILABLE",
  };

  return (
    <div>
      <Link href="/dashboard/landlord" className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-forest-800">
        <ChevronLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h2 className="mt-2 font-display text-2xl font-semibold">Edit listing</h2>
      <p className="mb-6 line-clamp-1 text-sm text-stone-600">{p.title}</p>
      <PropertyForm initial={initial} propertyId={p.id} />
    </div>
  );
}
