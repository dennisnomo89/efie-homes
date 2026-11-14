import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Create an account" };

type Props = { searchParams: Promise<{ role?: string; next?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { role, next } = await searchParams;
  const defaultRole = role === "LANDLORD" ? "LANDLORD" : "TENANT";
  return (
    <AuthShell
      title={defaultRole === "LANDLORD" ? "List your property" : "Create your account"}
      subtitle="Join thousands of Ghanaians finding and letting homes the transparent way."
    >
      <RegisterForm defaultRole={defaultRole} next={next} />
    </AuthShell>
  );
}
