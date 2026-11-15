import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, EyeOff, Inbox, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import { AdminListingActions, DemoCleanup, VerifyToggle } from "@/components/admin/AdminControls";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SafeImage } from "@/components/ui/SafeImage";
import { requireUser } from "@/lib/auth";
import { DEMO_EMAIL_DOMAIN, propertyTypeLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { cn, formatCedis, formatDate, parseJsonArray } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

type Props = { searchParams: Promise<{ listings?: string; q?: string; landlords?: string }> };

const LISTING_TABS = [
  { key: "all", label: "All" },
  { key: "hidden", label: "Hidden" },
  { key: "featured", label: "Featured" },
  { key: "unverified", label: "Unverified landlords" },
] as const;

export default async function AdminDashboard({ searchParams }: Props) {
  const admin = await requireUser(["ADMIN"], "/dashboard/admin");
  const { listings: tabParam, q, landlords: landlordFilter } = await searchParams;
  const tab = LISTING_TABS.some((t) => t.key === tabParam) ? tabParam! : "all";
  const query = q?.trim() || undefined;

  const listingWhere: Prisma.PropertyWhereInput = {
    ...(tab === "hidden" && { isHidden: true }),
    ...(tab === "featured" && { isFeatured: true }),
    ...(tab === "unverified" && { landlord: { isVerified: false } }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { neighborhood: { contains: query, mode: "insensitive" } },
        { landlord: { name: { contains: query, mode: "insensitive" } } },
      ],
    }),
  };
  const demoWhere = { email: { endsWith: DEMO_EMAIL_DOMAIN }, id: { not: admin.id } };

  const [tenants, landlords, live, hidden, pendingViewings, demo, landlordRows, listings, listingTotal] = await Promise.all([
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.groupBy({ by: ["isVerified"], where: { role: "LANDLORD" }, _count: { _all: true } }),
    prisma.property.count({ where: { isHidden: false, status: "AVAILABLE" } }),
    prisma.property.count({ where: { isHidden: true } }),
    prisma.viewingRequest.count({ where: { status: "PENDING" } }),
    Promise.all([
      prisma.user.count({ where: demoWhere }),
      prisma.property.count({ where: { landlord: demoWhere } }),
      prisma.viewingRequest.count({ where: { OR: [{ tenant: demoWhere }, { property: { landlord: demoWhere } }] } }),
    ]),
    prisma.user.findMany({
      where: { role: "LANDLORD", ...(landlordFilter === "unverified" && { isVerified: false }) },
      orderBy: [{ isVerified: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: { id: true, name: true, email: true, phone: true, isVerified: true, createdAt: true, _count: { select: { properties: true } } },
    }),
    prisma.property.findMany({
      where: listingWhere,
      orderBy: [{ isHidden: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { landlord: { select: { name: true, isVerified: true } }, _count: { select: { viewingRequests: true } } },
    }),
    prisma.property.count({ where: listingWhere }),
  ]);

  const verified = landlords.find((l) => l.isVerified)?._count._all ?? 0;
  const unverified = landlords.find((l) => !l.isVerified)?._count._all ?? 0;
  const [demoAccounts, demoListings, demoViewings] = demo;
  const tabHref = (key: string) => {
    const p = new URLSearchParams();
    if (key !== "all") p.set("listings", key);
    if (query) p.set("q", query);
    if (landlordFilter) p.set("landlords", landlordFilter);
    const qs = p.toString();
    return `/dashboard/admin${qs ? `?${qs}` : ""}#listings`;
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard icon={Users} label="Tenants" value={tenants} />
        <StatCard icon={BadgeCheck} label="Verified landlords" value={verified} tone="forest" />
        <StatCard icon={ShieldCheck} label="Awaiting verification" value={unverified} tone="gold" />
        <StatCard icon={Building2} label={`Live listings · ${hidden} hidden`} value={live} tone="terracotta" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon={Inbox} label="Pending viewing requests" value={pendingViewings} tone="stone" />
        </div>
      </div>

      {demoAccounts > 0 && <DemoCleanup accounts={demoAccounts} listings={demoListings} viewings={demoViewings} />}

      {/* ---------- Landlords ---------- */}
      <section id="landlords" className="scroll-mt-24">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold">Landlords &amp; agents</h2>
            <p className="text-sm text-stone-600">
              Verify a landlord once you&rsquo;ve confirmed who they are. Verified landlords get a trust badge on every listing.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/admin#landlords" scroll={false} className={cn("chip min-h-[36px] text-xs", !landlordFilter && "chip-active")}>
              All ({verified + unverified})
            </Link>
            <Link
              href="/dashboard/admin?landlords=unverified#landlords"
              scroll={false}
              className={cn("chip min-h-[36px] text-xs", landlordFilter === "unverified" && "chip-active")}
            >
              Awaiting ({unverified})
            </Link>
          </div>
        </div>

        {landlordRows.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={ShieldCheck} title="No landlords here" description="When landlords and agents sign up, they'll appear here for verification." />
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {landlordRows.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <span className="truncate">{l.name}</span>
                    {l.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-forest-600" aria-label="Verified" />}
                    {l.email.endsWith(DEMO_EMAIL_DOMAIN) && <span className="badge bg-stone-100 text-stone-600">Demo</span>}
                  </p>
                  <p className="truncate text-sm text-stone-600">
                    {l.email}
                    {l.phone ? ` · ${l.phone}` : ""}
                  </p>
                  <p className="text-xs text-stone-500">
                    {l._count.properties} {l._count.properties === 1 ? "listing" : "listings"} · joined {formatDate(l.createdAt)}
                  </p>
                </div>
                <VerifyToggle userId={l.id} name={l.name} verified={l.isVerified} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Listings ---------- */}
      <section id="listings" className="scroll-mt-24">
        <h2 className="text-xl font-semibold">Listings</h2>
        <p className="text-sm text-stone-600">
          Hide a listing to take it off the public site while you check it; the landlord still sees it, marked &ldquo;Hidden by admin&rdquo;.
        </p>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {LISTING_TABS.map((t) => (
              <Link key={t.key} href={tabHref(t.key)} scroll={false} className={cn("chip min-h-[36px] shrink-0 text-xs", tab === t.key && "chip-active")}>
                {t.label}
              </Link>
            ))}
          </div>
          <form action="/dashboard/admin" className="relative lg:w-72">
            {tab !== "all" && <input type="hidden" name="listings" value={tab} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input name="q" defaultValue={query} placeholder="Search title, area or landlord" className="input pl-9" aria-label="Search listings" />
          </form>
        </div>

        {listings.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={tab === "hidden" ? EyeOff : Building2} title="No listings match" description="Try another tab or clear the search." />
          </div>
        ) : (
          <>
            <ul className="mt-5 space-y-3">
              {listings.map((p) => (
                <li key={p.id} className={cn("card flex flex-col gap-4 p-4 md:flex-row md:items-center", p.isHidden && "border-terracotta-200 bg-terracotta-50/40")}>
                  <SafeImage src={parseJsonArray(p.images)[0]} alt="" sizes="(min-width: 768px) 112px, 100vw" className={cn("aspect-[4/3] w-full shrink-0 rounded-xl object-cover md:h-20 md:w-28", p.isHidden && "opacity-60")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={p.status} />
                      {p.isHidden && (
                        <span className="badge bg-terracotta-100 text-terracotta-700">
                          <EyeOff className="h-3.5 w-3.5" /> Hidden
                        </span>
                      )}
                      {p.isFeatured && <span className="badge bg-gold-400 text-ink">Featured</span>}
                      <span className="text-xs text-stone-500">{propertyTypeLabel(p.propertyType)}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 font-semibold">{p.title}</p>
                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-stone-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {p.neighborhood}
                      </span>
                      <span className="font-semibold text-forest-800">{formatCedis(p.monthlyRent)}/mo</span>
                      <span className="flex items-center gap-1">
                        by {p.landlord.name}
                        {p.landlord.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-forest-600" aria-label="Verified" />}
                      </span>
                      <span className="text-xs">
                        {p.views} views · {p._count.viewingRequests} requests
                      </span>
                    </p>
                  </div>
                  <AdminListingActions id={p.id} title={p.title} isHidden={p.isHidden} isFeatured={p.isFeatured} />
                </li>
              ))}
            </ul>
            {listingTotal > listings.length && (
              <p className="mt-3 text-center text-sm text-stone-500">
                Showing the first {listings.length} of {listingTotal}. Use search to narrow it down.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
