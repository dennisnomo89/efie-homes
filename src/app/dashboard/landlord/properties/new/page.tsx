import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { requireUser } from "@/lib/auth";
import { uploadsMode } from "@/lib/uploads";

export const metadata: Metadata = { title: "New listing" };

export default async function NewPropertyPage() {
  await requireUser(["LANDLORD", "ADMIN"], "/dashboard/landlord/properties/new");
  return (
    <div>
      <Link href="/dashboard/landlord" className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-forest-800">
        <ChevronLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h2 className="mt-2 font-display text-2xl font-semibold">Create a new listing</h2>
      <p className="mb-6 text-sm text-stone-600">It takes about 3 minutes. Your listing goes live as soon as you publish.</p>
      <PropertyForm uploadsEnabled={uploadsMode() !== "off"} />
    </div>
  );
}
