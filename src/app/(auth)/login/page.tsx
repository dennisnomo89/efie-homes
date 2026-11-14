import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Log in" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your viewings, wishlist and listings.">
      <LoginForm next={next} />
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-sand/60 p-3 text-xs text-stone-600">
          <p className="font-semibold text-stone-700">Demo accounts (password: Password123)</p>
          <p className="mt-1">Tenant: ama@efiehomes.test · Landlord: akosua@efiehomes.test · Admin: admin@efiehomes.test</p>
        </div>
      )}
    </AuthShell>
  );
}
