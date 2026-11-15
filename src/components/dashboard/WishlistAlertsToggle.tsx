"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "../ui/Toast";

/** Turns price-drop / available-again emails for wishlist homes on or off. */
export function WishlistAlertsToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/wishlist-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistAlerts: !on }),
    });
    setBusy(false);
    if (!res.ok) return toast({ title: "Couldn't update emails", description: "Please try again.", variant: "error" });
    setOn(!on);
    toast({
      title: on ? "Wishlist emails off" : "Wishlist emails on",
      description: on ? undefined : "We'll email you when a saved home drops in price or is available again.",
      variant: "info",
    });
    router.refresh();
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={on} className="btn btn-sm btn-ghost">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : on ? <Bell className="h-4 w-4 text-forest-700" /> : <BellOff className="h-4 w-4" />}
      {on ? "Price-drop emails on" : "Price-drop emails off"}
    </button>
  );
}
