"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "./ui/Toast";
import { cn } from "@/lib/utils";

type Props = {
  propertyId: string;
  initialSaved: boolean;
  /** "unauth" sends visitors to login; "landlord" explains wishlists are for tenants */
  mode?: "tenant" | "unauth" | "landlord";
  variant?: "overlay" | "full";
  className?: string;
};

export function FavoriteButton({ propertyId, initialSaved, mode = "tenant", variant = "overlay", className }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (mode === "unauth") {
      toast({ title: "Log in to save homes", description: "Create a free tenant account to build your wishlist.", variant: "info" });
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (mode === "landlord") {
      toast({ title: "Wishlists are for tenants", description: "Sign in with a tenant account to save homes.", variant: "info" });
      return;
    }

    const next = !saved;
    setSaved(next); // optimistic
    const res = next
      ? await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId }),
        })
      : await fetch(`/api/favorites/${propertyId}`, { method: "DELETE" });

    if (!res.ok) {
      setSaved(!next);
      const data = await res.json().catch(() => ({}));
      toast({ title: "Couldn't update wishlist", description: data.error ?? "Please try again.", variant: "error" });
      return;
    }
    toast({ title: next ? "Saved to your wishlist" : "Removed from wishlist", variant: next ? "success" : "info" });
    startTransition(() => router.refresh());
  }

  if (variant === "full") {
    return (
      <button onClick={toggle} disabled={pending} className={cn("btn btn-outline", saved && "border-terracotta-300 text-terracotta-600", className)} aria-pressed={saved}>
        <Heart className={cn("h-4 w-4", saved && "fill-terracotta-500 text-terracotta-500")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white active:scale-95",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5 transition", saved ? "fill-terracotta-500 text-terracotta-500" : "text-stone-700")} />
    </button>
  );
}
