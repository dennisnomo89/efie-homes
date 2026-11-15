"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Flag,
  Home,
  MessageSquareText,
  Search,
  Star,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: string; type: string; title: string; body: string | null; url: string; readAt: string | null; createdAt: string };

const ICONS: Record<string, typeof Bell> = {
  VIEWING_REQUESTED: CalendarPlus,
  VIEWING_ANSWERED: CalendarCheck,
  VIEWING_CANCELLED: CalendarX,
  NEW_MESSAGE: MessageSquareText,
  REVIEW_RECEIVED: Star,
  PRICE_DROP: TrendingDown,
  BACK_ON_MARKET: Home,
  SEARCH_MATCH: Search,
  LISTING_REPORTED: Flag,
};

/** Refresh while the tab is open; the count also refreshes on every page change. */
const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function NotificationBell({ className }: { className?: string }) {
  const pathname = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Item[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
      setLoaded(true);
    } catch {
      /* offline: keep what we have */
    }
  }, []);

  // Load on mount and after each navigation (opening a thread can clear notifications).
  useEffect(() => {
    load();
    setOpen(false);
  }, [pathname, load]);

  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && load();
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markRead(body: { all: true } | { ids: string[] }) {
    const now = new Date().toISOString();
    setItems((list) => list.map((i) => (("all" in body || body.ids.includes(i.id)) && !i.readAt ? { ...i, readAt: now } : i)));
    setUnread((n) => ("all" in body ? 0 : Math.max(0, n - body.ids.filter((id) => items.some((i) => i.id === id && !i.readAt)).length)));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => undefined);
  }

  const label = unread ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-stone-100"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-cream">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 animate-fade-in overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <h2 className="font-semibold">Notifications</h2>
            {unread > 0 && (
              <button type="button" onClick={() => markRead({ all: true })} className="text-sm font-semibold text-forest-800 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          {!loaded ? (
            <p className="px-4 py-8 text-center text-sm text-stone-500">Loading…</p>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-2 text-sm font-semibold">Nothing yet</p>
              <p className="text-sm text-stone-500">Viewing requests, messages and price drops will show up here.</p>
            </div>
          ) : (
            <ul className="max-h-[min(28rem,70vh)] divide-y divide-stone-100 overflow-y-auto">
              {items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.url}
                      onClick={() => {
                        if (!n.readAt) markRead({ ids: [n.id] });
                        setOpen(false);
                      }}
                      className={cn("flex gap-3 px-4 py-3 hover:bg-stone-50", !n.readAt && "bg-forest-50/60")}
                    >
                      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", n.readAt ? "bg-stone-100 text-stone-500" : "bg-forest-100 text-forest-800")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("line-clamp-2 block text-sm", !n.readAt && "font-semibold")}>{n.title}</span>
                        {n.body && <span className="line-clamp-2 block text-sm text-stone-600">{n.body}</span>}
                        <span className="mt-0.5 block text-xs text-stone-500">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terracotta-600" aria-label="Unread" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
