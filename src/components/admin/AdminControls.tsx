"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Eye, EyeOff, Loader2, Star, StarOff, Trash2 } from "lucide-react";
import { useToast } from "../ui/Toast";
import { ConfirmButton } from "../ui/ConfirmButton";
import { cn } from "@/lib/utils";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/** Verify / unverify a landlord. */
export function VerifyToggle({ userId, name, verified }: { userId: string; name: string; verified: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const { ok, data } = await send(`/api/admin/users/${userId}`, "PATCH", { isVerified: !verified });
    setBusy(false);
    if (!ok) return toast({ title: "Couldn't update landlord", description: data.error ?? "Please try again.", variant: "error" });
    toast({ title: verified ? "Verification removed" : "Landlord verified", description: name, variant: verified ? "info" : "success" });
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={verified}
      className={cn("btn btn-sm min-w-[118px]", verified ? "btn-outline text-forest-700" : "btn-primary")}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
      {verified ? "Verified" : "Verify"}
    </button>
  );
}

/** Feature / hide / delete controls for one listing. */
export function AdminListingActions({ id, title, isHidden, isFeatured }: { id: string; title: string; isHidden: boolean; isFeatured: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<"feature" | "hide" | null>(null);

  async function patch(kind: "feature" | "hide", body: { isFeatured?: boolean; isHidden?: boolean }, message: string) {
    setBusy(kind);
    const { ok, data } = await send(`/api/admin/properties/${id}`, "PATCH", body);
    setBusy(null);
    if (!ok) return toast({ title: "Couldn't update listing", description: data.error ?? "Please try again.", variant: "error" });
    toast({ title: message, description: title, variant: "info" });
    router.refresh();
  }

  async function remove() {
    const { ok, data } = await send(`/api/properties/${id}`, "DELETE");
    if (!ok) return toast({ title: "Couldn't delete listing", description: data.error ?? "Please try again.", variant: "error" });
    toast({ title: "Listing deleted", description: title, variant: "info" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link href={`/properties/${id}`} className="btn btn-sm btn-ghost">
        <Eye className="h-4 w-4" /> View
      </Link>
      <button
        onClick={() => patch("feature", { isFeatured: !isFeatured }, isFeatured ? "Removed from featured" : "Featured on the home page")}
        disabled={busy !== null || isHidden}
        title={isHidden ? "Unhide the listing before featuring it" : undefined}
        className="btn btn-sm btn-ghost"
      >
        {busy === "feature" ? <Loader2 className="h-4 w-4 animate-spin" /> : isFeatured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
        {isFeatured ? "Unfeature" : "Feature"}
      </button>
      <button
        onClick={() => patch("hide", { isHidden: !isHidden }, isHidden ? "Listing is public again" : "Listing hidden from the public")}
        disabled={busy !== null}
        className={cn("btn btn-sm btn-ghost", !isHidden && "text-terracotta-700")}
      >
        {busy === "hide" ? <Loader2 className="h-4 w-4 animate-spin" /> : isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        {isHidden ? "Unhide" : "Hide"}
      </button>
      <ConfirmButton
        title="Delete this listing?"
        description={`“${title}” and all of its viewing requests and saves will be permanently removed. This cannot be undone. To take it down temporarily, use Hide instead.`}
        confirmLabel="Delete"
        onConfirm={remove}
        className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </ConfirmButton>
    </div>
  );
}

/** One-click removal of all seeded demo accounts and their listings. */
export function DemoCleanup({ accounts, listings, viewings }: { accounts: number; listings: number; viewings: number }) {
  const router = useRouter();
  const { toast } = useToast();

  async function cleanup() {
    const { ok, data } = await send("/api/admin/demo-data", "DELETE");
    if (!ok) return toast({ title: "Cleanup failed", description: data.error ?? "Please try again.", variant: "error" });
    toast({
      title: "Demo data removed",
      description: `Deleted ${data.deleted.accounts} accounts and ${data.deleted.listings} listings.`,
    });
    router.refresh();
  }

  return (
    <div className="card flex flex-col gap-4 border-gold-300 bg-gold-100/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold">Demo data is still on this site</h2>
        <p className="mt-1 text-sm text-stone-600">
          {accounts} demo {accounts === 1 ? "account" : "accounts"} (emails ending in @efiehomes.test), {listings}{" "}
          {listings === 1 ? "listing" : "listings"} and {viewings} viewing {viewings === 1 ? "request" : "requests"}. Remove them before
          launching so tenants only see real homes.
        </p>
      </div>
      <ConfirmButton
        title="Delete all demo data?"
        description={`This permanently deletes ${accounts} demo accounts, ${listings} listings and ${viewings} viewing requests, plus any saved homes attached to them. Real accounts and your own admin account are not touched. This cannot be undone.`}
        confirmLabel="Delete demo data"
        onConfirm={cleanup}
        className="btn btn-danger shrink-0"
      >
        <Trash2 className="h-4 w-4" /> Remove demo data
      </ConfirmButton>
    </div>
  );
}
