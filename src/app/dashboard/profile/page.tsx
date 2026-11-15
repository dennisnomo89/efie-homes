import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { RenterProfileForm } from "@/components/dashboard/RenterProfileForm";
import { ViewingHoursEditor } from "@/components/dashboard/ViewingHoursEditor";
import { parseHours } from "@/lib/viewing-hours";
import { prisma } from "@/lib/prisma";
import { dateToMonth } from "@/lib/renter";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfilePage() {
  const user = await requireUser(undefined, "/dashboard/profile");
  const renter = user.role === "TENANT" ? await prisma.renterProfile.findUnique({ where: { userId: user.id } }) : null;
  const hosting = user.role === "TENANT" ? null : await prisma.user.findUnique({ where: { id: user.id }, select: { viewingHours: true } });
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-semibold">Profile settings</h2>
        {user.isVerified && (
          <span className="badge bg-forest-50 text-forest-700 ring-1 ring-forest-200">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
        <span className="text-sm text-stone-500">Member since {formatDate(user.createdAt, { month: "long", year: "numeric" })}</span>
      </div>
      <ProfileForm
        initial={{ name: user.name, phone: user.phone ?? "", avatarUrl: user.avatarUrl ?? "", email: user.email, role: user.role }}
      />
      {hosting && (
        <div className="mt-8 scroll-mt-24" id="viewing-hours">
          <ViewingHoursEditor initial={parseHours(hosting.viewingHours)} />
        </div>
      )}
      {user.role === "TENANT" && (
        <div className="mt-8 scroll-mt-24" id="renter-profile">
          <RenterProfileForm
            initial={{
              occupation: renter?.occupation ?? "",
              householdSize: renter?.householdSize ? String(renter.householdSize) : "",
              moveInFrom: dateToMonth(renter?.moveInFrom ?? null),
              about: renter?.about ?? "",
            }}
          />
        </div>
      )}
    </div>
  );
}
