import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isLandlord = user.role === "LANDLORD" || user.role === "ADMIN";

  return (
    <div className="bg-sand/50">
      <div className="border-b border-stone-200 bg-cream">
        <div className="container py-6 sm:py-8">
          <p className="section-eyebrow">{user.role === "ADMIN" ? "Admin dashboard" : isLandlord ? "Landlord dashboard" : "Tenant dashboard"}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Akwaaba, {user.name.split(" ")[0]} 👋
          </h1>
          <div className="mt-5">
            <DashboardNav role={user.role} />
          </div>
        </div>
      </div>
      <div className="container py-8">{children}</div>
    </div>
  );
}
