"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, LayoutDashboard, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname();
  const isLandlord = role === "LANDLORD" || role === "ADMIN";

  const items = isLandlord
    ? [
        { href: "/dashboard/landlord", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/landlord/properties/new", label: "New listing", icon: Plus },
        { href: "/dashboard/profile", label: "Profile", icon: UserRound },
      ]
    : [
        { href: "/dashboard/tenant", label: "My viewings", icon: CalendarDays },
        { href: "/dashboard/tenant#saved", label: "Saved homes", icon: Heart },
        { href: "/dashboard/profile", label: "Profile", icon: UserRound },
      ];

  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Dashboard">
      {items.map((item) => {
        const base = item.href.split("#")[0];
        const active = !item.href.includes("#") && (pathname === base || (base !== "/dashboard/landlord" && pathname.startsWith(base)));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
              active ? "bg-forest-800 text-white" : "text-stone-700 hover:bg-white",
            )}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
