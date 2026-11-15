"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, BellOff, Loader2, Trash2 } from "lucide-react";
import { useToast } from "../ui/Toast";
import { ConfirmButton } from "../ui/ConfirmButton";

export function SavedSearchActions({ id, name, emailAlerts }: { id: string; name: string; emailAlerts: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggleAlerts() {
    setBusy(true);
    const res = await fetch(`/api/saved-searches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailAlerts: !emailAlerts }),
    });
    setBusy(false);
    if (!res.ok) return toast({ title: "Couldn't update alerts", description: "Please try again.", variant: "error" });
    toast({ title: emailAlerts ? "Email alerts off" : "Email alerts on", description: name, variant: "info" });
    router.refresh();
  }

  async function remove() {
    const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
    if (!res.ok) return toast({ title: "Couldn't delete search", description: "Please try again.", variant: "error" });
    toast({ title: "Saved search deleted", description: name, variant: "info" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={toggleAlerts} disabled={busy} className="btn btn-sm btn-ghost" aria-pressed={emailAlerts}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : emailAlerts ? <Bell className="h-4 w-4 text-forest-700" /> : <BellOff className="h-4 w-4" />}
        {emailAlerts ? "Alerts on" : "Alerts off"}
      </button>
      <ConfirmButton
        title="Delete this saved search?"
        description={`"${name}" and its email alerts will be removed.`}
        confirmLabel="Delete"
        onConfirm={remove}
        className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </ConfirmButton>
    </div>
  );
}
