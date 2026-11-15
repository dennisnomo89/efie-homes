import type { Metadata } from "next";
import Link from "next/link";
import { BellPlus, CalendarCheck, CalendarDays, Clock, Heart, MapPin, MessageSquareText, Phone } from "lucide-react";
import { CancelViewingButton } from "@/components/dashboard/CancelViewingButton";
import { MessageThread } from "@/components/dashboard/MessageThread";
import { SavedSearchActions } from "@/components/dashboard/SavedSearchActions";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PropertyCard } from "@/components/PropertyCard";
import { ReviewForm } from "@/components/reviews/ReviewActions";
import { Stars } from "@/components/reviews/Stars";
import { EmptyState } from "@/components/ui/EmptyState";
import { SafeImage } from "@/components/ui/SafeImage";
import { requireUser } from "@/lib/auth";
import { messageTotals, unreadCounts } from "@/lib/messages";
import { savedSearchesWithCounts } from "@/lib/saved-searches";
import { prisma } from "@/lib/prisma";
import { landlordSelect, toView } from "@/lib/properties";
import { formatCedis, formatDate, formatTime, parseJsonArray } from "@/lib/utils";

export const metadata: Metadata = { title: "Tenant dashboard" };

type Props = { searchParams: Promise<{ thread?: string }> };

export default async function TenantDashboard({ searchParams }: Props) {
  const user = await requireUser(["TENANT", "ADMIN"], "/dashboard/tenant");
  const { thread: openThread } = await searchParams;

  const [viewings, saved] = await Promise.all([
    prisma.viewingRequest.findMany({
      where: { tenantId: user.id },
      orderBy: [{ preferredDate: "desc" }],
      include: {
        property: {
          select: {
            id: true,
            title: true,
            neighborhood: true,
            region: true,
            images: true,
            monthlyRent: true,
            landlord: { select: { name: true, phone: true } },
          },
        },
        review: { select: { id: true, landlordRating: true, accuracyRating: true, comment: true, isHidden: true } },
      },
    }),
    prisma.savedProperty.findMany({
      where: { userId: user.id, property: { isHidden: false } },
      orderBy: { createdAt: "desc" },
      include: { property: { include: { landlord: { select: landlordSelect } } } },
    }),
  ]);

  // A confirmed viewing can be reviewed from the day it happens.
  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);
  const canReview = (v: (typeof viewings)[number]) => v.status === "CONFIRMED" && v.preferredDate <= endOfToday;

  const count = (s: string) => viewings.filter((v) => v.status === s).length;
  const viewingIds = viewings.map((v) => v.id);
  const [unread, totals, searches] = await Promise.all([
    unreadCounts(user.id, viewingIds),
    messageTotals(viewingIds),
    savedSearchesWithCounts(user.id),
  ]);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Heart} label="Saved homes" value={saved.length} tone="terracotta" />
        <StatCard icon={CalendarDays} label="Viewing requests" value={viewings.length} />
        <StatCard icon={Clock} label="Awaiting reply" value={count("PENDING")} tone="gold" />
        <StatCard icon={CalendarCheck} label="Confirmed" value={count("CONFIRMED")} tone="forest" />
      </div>

      <section id="viewings" className="scroll-mt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">My viewing requests</h2>
            <p className="text-sm text-stone-600">Track responses from landlords and agents.</p>
          </div>
        </div>

        {viewings.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={CalendarDays}
              title="No viewings scheduled yet"
              description="Found a place you like? Open the listing and tap “Schedule a viewing” to pick a date and time."
              action={{ label: "Find a home", href: "/properties" }}
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {viewings.map((v) => {
              const img = parseJsonArray(v.property.images)[0];
              return (
                <li key={v.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link href={`/properties/${v.property.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <SafeImage src={img} alt="" sizes="96px" className="h-20 w-24 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-semibold hover:text-forest-800">{v.property.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-600">
                        <MapPin className="h-3.5 w-3.5" /> {v.property.neighborhood} · {formatCedis(v.property.monthlyRent)}/mo
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-medium text-ink">
                        <CalendarDays className="h-3.5 w-3.5 text-terracotta-500" />
                        {formatDate(v.preferredDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {formatTime(v.preferredTime)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <StatusBadge status={v.status} />
                      <MessageThread
                        viewingId={v.id}
                        withName={v.property.landlord.name}
                        unread={unread[v.id] ?? 0}
                        total={totals[v.id] ?? 0}
                        autoOpen={openThread === v.id}
                      />
                      {v.status === "PENDING" && <CancelViewingButton id={v.id} />}
                    </div>
                    {v.status === "CONFIRMED" && v.property.landlord.phone && (
                      <a href={`tel:${v.property.landlord.phone}`} className="flex items-center gap-1 text-sm font-semibold text-forest-800 hover:underline">
                        <Phone className="h-3.5 w-3.5" /> Call {v.property.landlord.name.split(" ")[0]} · {v.property.landlord.phone}
                      </a>
                    )}
                  </div>
                  {canReview(v) && (
                    <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:basis-full">
                      {v.review ? (
                        <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                          Your review: <Stars value={v.review.landlordRating} />
                          {v.review.isHidden && <span className="text-terracotta-700">(hidden by an admin)</span>}
                        </p>
                      ) : (
                        <p className="text-sm text-stone-600">How did the viewing go? Your review helps other renters.</p>
                      )}
                      <ReviewForm viewingId={v.id} landlordName={v.property.landlord.name.split(" ")[0]} existing={v.review ?? undefined} />
                    </div>
                  )}
                  {v.landlordNote && (
                    <p className="flex gap-2 rounded-xl bg-sand p-3 text-sm text-stone-700 sm:basis-full">
                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
                      <span>
                        <strong className="font-semibold">Landlord:</strong> {v.landlordNote}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="searches" className="scroll-mt-24">
        <h2 className="text-xl font-semibold">Saved searches</h2>
        <p className="text-sm text-stone-600">
          We email you when a new home matches (at most once every few hours per search). Save a search from the{" "}
          <Link href="/properties" className="font-semibold text-forest-800 hover:underline">
            listings page
          </Link>
          .
        </p>
        {searches.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={BellPlus}
              title="No saved searches yet"
              description="Filter homes by area, type and budget, then tap “Save search” to get an email when something new matches."
              action={{ label: "Start a search", href: "/properties" }}
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {searches.map((s) => (
              <li key={s.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <span className="truncate">{s.name}</span>
                    {s.newSince > 0 && <span className="badge bg-terracotta-600 text-white">{s.newSince} new</span>}
                  </p>
                  <p className="text-sm text-stone-600">
                    {s.total} {s.total === 1 ? "home matches" : "homes match"} now · saved {formatDate(s.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <a href={`/api/saved-searches/${s.id}/open`} className="btn btn-sm btn-primary">
                    View homes
                  </a>
                  <SavedSearchActions id={s.id} name={s.name} emailAlerts={s.emailAlerts} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="saved" className="scroll-mt-24">
        <h2 className="text-xl font-semibold">Saved homes</h2>
        <p className="text-sm text-stone-600">Your wishlist — tap the heart to remove a home.</p>
        {saved.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Tap the heart on any listing to save it here and compare later."
              action={{ label: "Browse homes", href: "/properties" }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <PropertyCard key={s.id} property={toView(s.property)} saved favoriteMode="tenant" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
