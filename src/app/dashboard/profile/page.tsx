import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfilePage() {
  const user = await requireUser(undefined, "/dashboard/profile");
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
    </div>
  );
}
