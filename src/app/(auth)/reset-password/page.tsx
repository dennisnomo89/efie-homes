import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Choose a new password", referrer: "no-referrer" };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you don't use on other sites.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4 text-center text-sm text-stone-700">
          <p>This reset link is incomplete. Please open the link from your email again, or request a new one.</p>
          <Link href="/forgot-password" className="btn btn-primary w-full">
            Request a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
