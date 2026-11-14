import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarDays, Eye, Inbox, KeyRound, MapPin, MessageSquareText, Phone, Plus, Wallet } from "lucide-react";
import { ListingActions } from "@/components/dashboard/ListingActions";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ViewingRequestActions } from "@/components/dashboard/ViewingRequestActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { SafeImage } from "@/components/ui/SafeImage";
import { requireUser } from "@/lib/auth";
import { advanceLabel, propertyTypeLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn, formatCedis, formatDate, formatTime, parseJsonArray } from "@/lib/utils";

export const metadata: Metadata = { title: "Landlord dashboard" };

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function LandlordDashboard({ searchParams }: Props) {
  const user = await requireUser(["LANDLORD", "ADMIN"], "/dashboard/landlord");
  const { tab } = await searchParams;
  const listingFilter = tab === "rented" ? "RENTED" : tab === "active" ? "AVAILABLE" : undefined;
  const isAdmin = user.role === "ADMIN";
  const ownerWhere = isAdmin ? {} : { landlordId: user.id };

  const [listings, requests] = await Promise.all([
    prisma.property.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { viewingRequests: true, savedBy: true } }, landlord: { select: { name: true } } },
    }),
    prisma.viewingRequest.findMany({
      where: { property: ownerWhere },
      orderBy: [{ createdAt: "desc" }],
      include: {
        property: { select: { id: true, title: true, neighborhood: true } },
        tenant: { select: { name: true, email: true } },
      },
    }),
  ]);

  const active = listings.filter((l) => l.status === "AVAILABLE");
  const rented = listings.filter((l) => l.status === "RENTED");
  const totalViews = listings.reduce((s, l) => s + l.views, 0);
  const totalSaves = listings.reduce((s, l) => s + l._count.savedBy, 0);
  const pending = requests.filter((r) => r.status === "PENDING");
  const responded = requests.filter((r) => r.status !== "PENDING").slice(0, 8);
  const monthlyIncome = rented.reduce((s, l) => s + l.monthlyRent, 0);
  const shown = listingFilter ? listings.filter((l) => l.status === listingFilter) : listings;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard icon={Building2} label="Total listings" value={listings.length} />
        <StatCard icon={KeyRound} label="Active / rented" value={`${active.length} / ${rented.length}`} tone="stone" />
        <StatCard icon={Inbox} label="Pending requests" value={pending.length} tone="gold" />
        <StatCard icon={Eye} label={`Views · ${totalSaves} saves`} value={totalViews.toLocaleString()} tone="terracotta" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon={Wallet} label="Monthly rent (rented units)" value={formatCedis(monthlyIncome)} />
        </div>
      </div>

      {/* ---------- Requests ---------- */}
      <section>
        <h2 className="text-xl font-semibold">Incoming viewing requests</h2>
        <p className="text-sm text-stone-600">Confirm or decline — tenants see your response instantly in their dashboard.</p>

        {pending.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={Inbox}
              title="You're all caught up"
              description="New viewing requests from tenants will appear here. Featured, well-photographed listings get the most requests."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {pending.map((r) => (
              <article key={r.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.tenant.name}</p>
                    <Link href={`/properties/${r.property.id}`} className="line-clamp-1 text-sm text-stone-600 hover:text-forest-800">
                      {r.property.title}
                    </Link>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CalendarDays className="h-4 w-4 text-terracotta-500" />
                    {formatDate(r.preferredDate, { weekday: "short", day: "numeric", month: "short" })} · {formatTime(r.preferredTime)}
                  </span>
                  <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 text-forest-800 hover:underline">
                    <Phone className="h-4 w-4" /> {r.phone}
                  </a>
                </div>
                <p className="mt-3 flex flex-1 gap-2 rounded-xl bg-sand p-3 text-sm text-stone-700">
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" /> {r.message}
                </p>
                <div className="mt-4">
                  <ViewingRequestActions id={r.id} tenantName={r.tenant.name.split(" ")[0]} />
                </div>
              </article>
            ))}
          </div>
        )}

        {responded.length > 0 && (
          <details className="mt-5 rounded-2xl border border-stone-200 bg-white">
            <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold">Recently answered ({responded.length})</summary>
            <ul className="divide-y divide-stone-100 border-t border-stone-100">
              {responded.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className="min-w-0">
                    <strong className="font-semibold">{r.tenant.name}</strong> · <span className="text-stone-600">{r.property.title}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-stone-500">{formatDate(r.preferredDate)}</span>
                    <StatusBadge status={r.status} />
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* ---------- Listings ---------- */}
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold">{isAdmin ? "All listings" : "Your listings"}</h2>
            <div className="mt-3 flex gap-2">
              {[
                { key: undefined, label: `All (${listings.length})` },
                { key: "active", label: `Active (${active.length})` },
                { key: "rented", label: `Rented (${rented.length})` },
              ].map((t) => (
                <Link
                  key={t.label}
                  href={t.key ? `/dashboard/landlord?tab=${t.key}` : "/dashboard/landlord"}
                  scroll={false}
                  className={cn("chip min-h-[36px] text-xs", tab === t.key && "chip-active")}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/dashboard/landlord/properties/new" className="btn btn-accent self-start sm:self-auto">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </div>

        {shown.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={Building2}
              title={listings.length === 0 ? "List your first property" : "Nothing in this tab"}
              description={
                listings.length === 0
                  ? "Add photos, rent in cedis, advance terms and utilities. Your listing goes live immediately."
                  : "Switch tabs to see your other listings."
              }
              action={listings.length === 0 ? { label: "Create a listing", href: "/dashboard/landlord/properties/new" } : undefined}
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {shown.map((l) => (
              <li key={l.id} className="card flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <SafeImage src={parseJsonArray(l.images)[0]} alt="" className="aspect-[4/3] w-full shrink-0 rounded-xl object-cover md:h-24 md:w-32" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={l.status} />
                    <span className="text-xs text-stone-500">
                      {propertyTypeLabel(l.propertyType)} · {advanceLabel(l.advanceMonths)}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-1 font-semibold">{l.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-stone-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {l.neighborhood}
                    </span>
                    <span className="font-semibold text-forest-800">{formatCedis(l.monthlyRent)}/mo</span>
                    <span>
                      {l.views} views · {l._count.viewingRequests} requests · {l._count.savedBy} saves
                    </span>
                    {isAdmin && <span className="text-xs">by {l.landlord.name}</span>}
                  </p>
                </div>
                <ListingActions id={l.id} title={l.title} status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
