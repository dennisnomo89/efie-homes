"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useToast } from "../ui/Toast";

export function ViewingRequestActions({ id, tenantName }: { id: string; tenantName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"CONFIRMED" | "DECLINED" | null>(null);

  async function respond(status: "CONFIRMED" | "DECLINED") {
    setBusy(status);
    const res = await fetch(`/api/viewings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, landlordNote: note || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      toast({ title: "Couldn't update request", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    toast({
      title: status === "CONFIRMED" ? "Viewing confirmed" : "Request declined",
      description: status === "CONFIRMED" ? `${tenantName} can now see your confirmation and phone number.` : `${tenantName} has been notified.`,
      variant: status === "CONFIRMED" ? "success" : "info",
    });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="Optional note, e.g. “Call when you reach the junction”"
        className="input min-h-[40px] py-2 text-xs"
        aria-label="Note to tenant"
      />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => respond("DECLINED")} disabled={busy !== null} className="btn btn-sm btn-outline min-h-[40px] text-red-600">
          {busy === "DECLINED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Decline
        </button>
        <button onClick={() => respond("CONFIRMED")} disabled={busy !== null} className="btn btn-sm btn-primary min-h-[40px]">
          {busy === "CONFIRMED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirm
        </button>
      </div>
    </div>
  );
}
