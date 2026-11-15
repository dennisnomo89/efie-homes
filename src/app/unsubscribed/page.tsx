import type { Metadata } from "next";
import Link from "next/link";
import { BellOff, CircleAlert } from "lucide-react";

export const metadata: Metadata = { title: "Email alerts", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ status?: string; kind?: string }> };

type Copy = { ok: { title: string; text: string }; gone: { title: string; text: string }; invalid: { title: string; text: string } };

const SEARCH: Copy = {
  ok: {
    title: "Alerts turned off",
    text: "You won't get any more emails for that saved search. You can turn alerts back on, or delete the search, from your dashboard.",
  },
  gone: { title: "Search already deleted", text: "That saved search no longer exists, so there's nothing more to turn off." },
  invalid: {
    title: "This link didn't work",
    text: "The unsubscribe link looks incomplete. Open your dashboard to manage your saved searches and alerts instead.",
  },
};

const WISHLIST: Copy = {
  ok: {
    title: "Wishlist emails turned off",
    text: "You won't get emails when homes on your wishlist drop in price or become available again. You can turn them back on from your dashboard.",
  },
  gone: { title: "Account not found", text: "That account no longer exists, so there's nothing more to turn off." },
  invalid: {
    title: "This link didn't work",
    text: "The unsubscribe link looks incomplete. Open your dashboard to manage wishlist emails instead.",
  },
};

export default async function UnsubscribedPage({ searchParams }: Props) {
  const { status, kind } = await searchParams;
  const wishlist = kind === "wishlist";
  const set = wishlist ? WISHLIST : SEARCH;
  const copy = set[(status as keyof Copy) ?? "ok"] ?? set.invalid;
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
          <Link href={wishlist ? "/dashboard/tenant#saved" : "/dashboard/tenant#searches"} className="btn btn-primary">
            {wishlist ? "Open my wishlist" : "Manage saved searches"}
          </Link>
          <Link href="/properties" className="btn btn-outline">
            Browse homes
          </Link>
        </div>
      </div>
    </div>
  );
}
