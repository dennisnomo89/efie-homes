import type { Metadata } from "next";
import Link from "next/link";
import { BellOff, CircleAlert } from "lucide-react";

export const metadata: Metadata = { title: "Email alerts", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ status?: string }> };

const COPY = {
  ok: {
    title: "Alerts turned off",
    text: "You won't get any more emails for that saved search. You can turn alerts back on, or delete the search, from your dashboard.",
  },
  gone: { title: "Search already deleted", text: "That saved search no longer exists, so there's nothing more to turn off." },
  invalid: {
    title: "This link didn't work",
    text: "The unsubscribe link looks incomplete. Open your dashboard to manage your saved searches and alerts instead.",
  },
} as const;

export default async function UnsubscribedPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const copy = COPY[(status as keyof typeof COPY) ?? "ok"] ?? COPY.invalid;
  const Icon = status === "invalid" ? CircleAlert : BellOff;
  return (
    <div className="container flex justify-center py-20">
      <div className="card max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-2 text-sm text-stone-600">{copy.text}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard/tenant#searches" className="btn btn-primary">
            Manage saved searches
          </Link>
          <Link href="/properties" className="btn btn-outline">
            Browse homes
          </Link>
        </div>
      </div>
    </div>
  );
}
