import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Eye, Heart, Lightbulb, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { requireUser } from "@/lib/auth";
import { INSIGHT_DAYS, listingInsights } from "@/lib/insights";
import { prisma } from "@/lib/prisma";
import { formatCedis, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Listing insights", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function ListingInsightsPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(["LANDLORD", "ADMIN"], `/dashboard/landlord/properties/${id}/insights`);
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, title: true, neighborhood: true, monthlyRent: true, status: true, isHidden: true, views: true, createdAt: true, landlordId: true },
  });
  // Someone else's listing looks the same as a missing one.
  if (!property || (property.landlordId !== user.id && user.role !== "ADMIN")) notFound();

  const data = await listingInsights(id);
  const { period, previousViews, allTime } = data;
  const change = previousViews > 0 ? Math.round(((period.views - previousViews) / previousViews) * 100) : null;
  const listedDays = Math.max(1, Math.round((Date.now() - property.createdAt.getTime()) / 86_400_000));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/landlord" className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-forest-800">
          <ArrowLeft className="h-4 w-4" /> Back to your listings
        </Link>
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={property.status} />
              {property.isHidden && <span className="badge bg-terracotta-50 text-terracotta-700 ring-1 ring-terracotta-200">Hidden by admin</span>}
            </div>
            <h2 className="mt-1.5 text-xl font-semibold">{property.title}</h2>
            <p className="text-sm text-stone-600">
              {property.neighborhood} · {formatCedis(property.monthlyRent)}/mo · listed {formatDate(property.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/properties/${id}`} className="btn btn-sm btn-ghost">
              <Eye className="h-4 w-4" /> View
            </Link>
            <Link href={`/dashboard/landlord/properties/${id}/edit`} className="btn btn-sm btn-outline">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile icon={Eye} label={`Views · last ${INSIGHT_DAYS} days`} value={period.views.toLocaleString("en-GB")}>
          {change === null ? (
            <span className="text-stone-500">{previousViews === 0 && period.views > 0 ? "New this month" : "No earlier views to compare"}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-stone-600">
              {change >= 0 ? <ArrowUpRight className="h-4 w-4 text-forest-700" /> : <ArrowDownRight className="h-4 w-4 text-terracotta-600" />}
              {change >= 0 ? "Up" : "Down"} {Math.abs(change)}% on the {INSIGHT_DAYS} days before
            </span>
          )}
        </Tile>
        <Tile icon={Heart} label={`Saves · last ${INSIGHT_DAYS} days`} value={period.saves.toLocaleString("en-GB")}>
          <span className="text-stone-600">{data.saveRate === null ? "—" : `${data.saveRate}% of viewers saved it`}</span>
        </Tile>
        <Tile icon={CalendarDays} label={`Viewing requests · last ${INSIGHT_DAYS} days`} value={period.requests.toLocaleString("en-GB")}>
          <span className="text-stone-600">{data.requestRate === null ? "—" : `${data.requestRate}% of viewers asked to see it`}</span>
        </Tile>
      </div>

      <section className="card p-5">
        <h3 className="font-semibold">Daily views</h3>
        <p className="text-sm text-stone-600">
          Last {INSIGHT_DAYS} days, Ghana time. Visits from you, admins and search-engine robots aren&rsquo;t counted. Hover over a day, or focus the
          chart and use the arrow keys, to see saves and requests too.
        </p>
        <div className="mt-4">
          <ViewsChart series={data.series} />
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold text-forest-800">Show as a table</summary>
          <div className="mt-3 max-h-80 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white text-stone-600">
                <tr>
                  <th className="py-1.5 font-medium">Day</th>
                  <th className="py-1.5 text-right font-medium">Views</th>
                  <th className="py-1.5 text-right font-medium">Saves</th>
                  <th className="py-1.5 text-right font-medium">Requests</th>
                </tr>
              </thead>
              <tbody>
                {[...data.series].reverse().map((p) => (
                  <tr key={p.day} className="border-t border-stone-100">
                    <td className="py-1.5">{formatDate(`${p.day}T00:00:00Z`, { weekday: "short", day: "numeric", month: "short" })}</td>
                    <td className="py-1.5 text-right tabular-nums">{p.views}</td>
                    <td className="py-1.5 text-right tabular-nums">{p.saves}</td>
                    <td className="py-1.5 text-right tabular-nums">{p.requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold">Since you listed it</h3>
          <p className="text-sm text-stone-600">{listedDays} {listedDays === 1 ? "day" : "days"} on Efie Homes</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Stat label="Total views" value={property.views} />
            <Stat label="Saved by" value={allTime.saves} suffix={allTime.saves === 1 ? "tenant" : "tenants"} />
            <Stat label="Viewing requests" value={allTime.requests} />
            <Stat label="Confirmed viewings" value={allTime.confirmed} />
            <Stat label="Awaiting your reply" value={allTime.pending} />
            <Stat label="Declined" value={allTime.declined} />
          </dl>
          {allTime.pending > 0 && (
            <Link href="/dashboard/landlord" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-800 hover:underline">
              Answer {allTime.pending} pending {allTime.pending === 1 ? "request" : "requests"} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <Tips views={period.views} saves={period.saves} requests={period.requests} status={property.status} />
      </section>
    </div>
  );
}

function Tile({ icon: Icon, label, value, children }: { icon: typeof Eye; label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="flex items-center gap-1.5 text-sm text-stone-600">
        <Icon className="h-4 w-4" /> {label}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs">{children}</p>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <dt className="text-stone-600">{label}</dt>
      <dd className="font-semibold">
        {value.toLocaleString("en-GB")}
        {suffix && <span className="font-normal text-stone-600"> {suffix}</span>}
      </dd>
    </div>
  );
}

/** Plain suggestions based on where people drop off. */
function Tips({ views, saves, requests, status }: { views: number; saves: number; requests: number; status: string }) {
  const tips: string[] = [];
  if (status === "RENTED") tips.push("This home is marked as rented, so it no longer appears in search results. Mark it available when it's free again.");
  else if (views < 10)
    tips.push("Few people have seen this listing lately. Clear, bright photos of every room and an accurate area name help it show up in more searches.");
  else if (requests === 0 && saves === 0)
    tips.push("People are looking but not saving or asking to view. Check that the rent and advance are in line with similar homes nearby, and that the photos match the description.");
  else if (requests === 0)
    tips.push("Tenants are saving this home but not booking viewings yet. Answering messages quickly and offering a range of viewing times can help.");
  else tips.push("This listing is getting viewing requests. Reply to each one quickly: tenants often book more than one viewing.");
  tips.push("If you lower the rent, tenants who saved the home get an email about the price drop.");

  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-1.5 font-semibold">
        <Lightbulb className="h-4 w-4 text-gold-600" /> Suggestions
      </h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-700">
        {tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
