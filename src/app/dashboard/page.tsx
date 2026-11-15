import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

// Middleware normally handles this redirect; this is a server-side fallback.
export default async function DashboardIndex() {
  const user = await requireUser();
  redirect(user.role === "ADMIN" ? "/dashboard/admin" : user.role === "TENANT" ? "/dashboard/tenant" : "/dashboard/landlord");
}
