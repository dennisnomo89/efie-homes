"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChartColumn, Eye, KeyRound, Loader2, Pencil, Trash2, Undo2 } from "lucide-react";
import { useToast } from "../ui/Toast";
import { ConfirmButton } from "../ui/ConfirmButton";

export function ListingActions({ id, title, status }: { id: string; title: string; status: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const rented = status === "RENTED";

  async function toggleStatus() {
    setBusy(true);
    const next = rented ? "AVAILABLE" : "RENTED";
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Couldn't update status", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    toast({ title: next === "RENTED" ? "Marked as rented" : "Listing is live again", description: title });
    router.refresh();
  }

  async function remove() {
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Couldn't delete listing", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    toast({ title: "Listing deleted", description: title, variant: "info" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link href={`/properties/${id}`} className="btn btn-sm btn-ghost" aria-label="View listing">
        <Eye className="h-4 w-4" /> View
      </Link>
      <Link href={`/dashboard/landlord/properties/${id}/edit`} className="btn btn-sm btn-ghost">
        <Pencil className="h-4 w-4" /> Edit
      </Link>
      <Link href={`/dashboard/landlord/properties/${id}/insights`} className="btn btn-sm btn-ghost">
        <ChartColumn className="h-4 w-4" /> Insights
      </Link>
      <button onClick={toggleStatus} disabled={busy} className="btn btn-sm btn-ghost">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : rented ? <Undo2 className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
        {rented ? "Mark available" : "Mark rented"}
      </button>
      <ConfirmButton
        title="Delete this listing?"
        description={`“${title}” and all of its viewing requests will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={remove}
        className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </ConfirmButton>
    </div>
  );
}
