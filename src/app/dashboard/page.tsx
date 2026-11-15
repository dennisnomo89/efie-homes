import { redirect } from "next/navigation";
import { dashboardFor, requireUser } from "@/lib/auth";

/** /dashboard sends each person to their own dashboard, based on their current role in the database. */
export default async function DashboardIndex() {
  const user = await requireUser();
  redirect(dashboardFor(user.role));
}
