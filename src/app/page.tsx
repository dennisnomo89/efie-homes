import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CalendarDays,
  Droplets,
  Fence,
  Handshake,
  Search,
  ShieldCheck,
  Sun,
  Zap,
} from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";
import { PropertyCard } from "@/components/PropertyCard";
import { SafeImage } from "@/components/ui/SafeImage";
import { getSession } from "@/lib/auth";
import { POPULAR_NEIGHBORHOODS, PROPERTY_TYPES } from "@/lib/constants";
import { calculateUpfront } from "@/lib/pricing";
import { jsonLdScript, siteJsonLd } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getSavedIds, landlordSelect, toView } from "@/lib/properties";
import { favoriteModeFor, formatCedis } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EXAMPLE = { monthlyRent: 3800, months: 12, agentFeePercent: 10, securityDeposit: 0 };
const exampleCost = calculateUpfront(EXAMPLE);

export default async function HomePage() {
  const session = await getSession();

  const [featuredRaw, totalAvailable, landlordCount, hoodCounts, typeCounts, savedIds] = await Promise.all([
    prisma.property.findMany({
      where: { status: "AVAILABLE", isHidden: false },
      orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
      take: 6,
      include: { landlord: { select: landlordSelect } },
    }),
    prisma.property.count({ where: { status: "AVAILABLE", isHidden: false } }),
    prisma.user.count({ where: { role: "LANDLORD", isVerified: true } }),
    prisma.property.groupBy({ by: ["neighborhood"], where: { status: "AVAILABLE", isHidden: false }, _count: { _all: true } }),
    prisma.property.groupBy({ by: ["propertyType"], where: { status: "AVAILABLE", isHidden: false }, _count: { _all: true }, _min: { monthlyRent: true } }),
    getSavedIds(session?.sub),
  ]);

  const featured = featuredRaw.map(toView);
  const countFor = (hood: string) => hoodCounts.find((h) => h.neighborhood === hood)?._count._all ?? 0;
  const favoriteMode = favoriteModeFor(session?.role);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd()) }} />
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden">
        <SafeImage
          priority
          sizes="100vw"
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=75"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/75 via-forest-950/45 to-forest-950/80" />
        <div className="container pb-16 pt-16 sm:pb-24 sm:pt-24 lg:pb-32 lg:pt-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-gold-300 ring-1 ring-white/20 backdrop-blur">
              <BadgeCheck className="h-4 w-4" /> Verified landlords &amp; agents across Ghana
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find a place that truly feels like <span className="italic text-gold-400">efie</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base text-stone-200 sm:text-lg">
              From a chamber and hall in Madina to an executive home in Trasacco — compare rentals in cedis, see the full
              advance upfront, and book viewings directly with landlords.
            </p>
          </div>
          <div className="mt-8 max-w-5xl sm:mt-10">
            <HeroSearch />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="text-stone-300">Popular:</span>
            {["East Legon", "Osu", "Spintex", "Kumasi - Ahodwo", "Tema"].map((h) => (
              <Link
                key={h}
                href={`/properties?location=${encodeURIComponent(h)}`}
                className="rounded-full bg-white/10 px-3 py-1 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
              >
                {h}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="border-b border-stone-200 bg-white">
        <div className="container grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          <Stat value={`${totalAvailable}+`} label="Homes available now" />
          <Stat value={`${landlordCount}`} label="Verified landlords" />
          <Stat value="16" label="Regions covered" />
          <Stat value="₵0" label="Fees to search & book" />
        </div>
      </section>

      {/* ---------- Featured ---------- */}
      <section className="container mt-16 sm:mt-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-eyebrow">Hand-picked</p>
            <h2 className="section-title mt-2">Featured rentals</h2>
            <p className="mt-2 max-w-xl text-stone-600">Fresh listings from verified landlords, with every cedi of the advance shown upfront.</p>
          </div>
          <Link href="/properties" className="btn btn-outline self-start sm:self-auto">
            View all homes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} saved={savedIds.has(p.id)} favoriteMode={favoriteMode} />
          ))}
        </div>
      </section>

      {/* ---------- Neighbourhoods ---------- */}
      <section className="container mt-20 sm:mt-24">
        <p className="section-eyebrow">Explore</p>
        <h2 className="section-title mt-2">Popular neighbourhoods</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {POPULAR_NEIGHBORHOODS.map((n, i) => (
            <Link
              key={n.name}
              href={`/properties?location=${encodeURIComponent(n.name)}`}
              className={`group relative overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-[4/3]"}`}
            >
              <SafeImage src={n.image} alt={n.name} sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-lg font-semibold text-white sm:text-xl">{n.name}</p>
                <p className="text-xs text-stone-200 sm:text-sm">
                  {n.region} · {countFor(n.name)} {countFor(n.name) === 1 ? "home" : "homes"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Property types ---------- */}
      <section className="container mt-20 sm:mt-24">
        <p className="section-eyebrow">Every budget</p>
        <h2 className="section-title mt-2">Browse by property type</h2>
        <div className="scrollbar-none -mx-4 mt-8 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {PROPERTY_TYPES.map((t) => {
            const c = typeCounts.find((x) => x.propertyType === t.value);
            return (
              <Link
                key={t.value}
                href={`/properties?type=${t.value}`}
                className="card min-w-[180px] snap-start p-4 transition hover:-translate-y-0.5 hover:border-forest-300"
              >
                <p className="font-semibold text-ink">{t.label}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {c ? `${c._count._all} available · from ${formatCedis(c._min.monthlyRent ?? 0)}` : "Coming soon"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Rent advance explainer ---------- */}
      <section id="advance" className="container mt-20 scroll-mt-24 sm:mt-24">
        <div className="grid overflow-hidden rounded-3xl bg-forest-900 text-white lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">No surprises</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Know your full advance before you visit</h2>
            <p className="mt-4 text-forest-100">
              Most Ghanaian landlords ask for 6 months to 2 years of rent upfront. Every Efie Homes listing states the minimum
              advance, security deposit and any agent commission — and our calculator adds it all up for you.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Clear minimum advance on every listing (6 months, 1 year or 2 years)",
                "Security deposit and agent fee shown separately",
                "Filter for homes that match the advance you can afford",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-gold-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center bg-forest-950/40 p-8 sm:p-12">
            <div className="w-full rounded-2xl bg-white p-6 text-ink shadow-lift">
              <div className="flex items-center gap-2 text-sm font-semibold text-forest-800">
                <Calculator className="h-5 w-5" /> Example: 2-bedroom in Spintex
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <Row label="Monthly rent" value={formatCedis(EXAMPLE.monthlyRent)} />
                <Row label={`1 Year Advance (12 × ${formatCedis(EXAMPLE.monthlyRent)})`} value={formatCedis(exampleCost.advance)} />
                <Row label={`Agent commission (${EXAMPLE.agentFeePercent}%)`} value={formatCedis(exampleCost.agentFee)} />
                <Row label="Security deposit" value={formatCedis(exampleCost.securityDeposit)} />
                <Row label="Total to move in" value={formatCedis(exampleCost.total)} strong />
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Utilities ---------- */}
      <section className="container mt-20 sm:mt-24">
        <div className="text-center">
          <p className="section-eyebrow">Filter for what matters</p>
          <h2 className="section-title mt-2">Utilities you can count on</h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-600">
            Dumsor and water flow matter. Filter homes by the backups and security features that make daily life easier.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: Zap, label: "ECG Prepaid Meter", key: "ECG_PREPAID" },
            { icon: Droplets, label: "Borehole / Polytank", key: "BOREHOLE_POLYTANK" },
            { icon: Sun, label: "Generator / Solar", key: "GENERATOR_SOLAR" },
            { icon: Fence, label: "Walled & Gated", key: "WALLED_GATED" },
            { icon: ShieldCheck, label: "24/7 Security", key: "SECURITY_24_7" },
          ].map((u) => (
            <Link key={u.key} href={`/properties?amenities=${u.key}`} className="card flex items-center gap-3 p-4 transition hover:border-forest-300">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                <u.icon className="h-5 w-5" />
              </span>
              <span className="font-semibold">{u.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="container mt-20 sm:mt-24">
        <div className="text-center">
          <p className="section-eyebrow">Simple &amp; direct</p>
          <h2 className="section-title mt-2">How Efie Homes works</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Search & compare", text: "Filter by region, neighbourhood, budget, advance period and must-have utilities." },
            { icon: CalendarDays, title: "Book a viewing", text: "Pick a date and time that suits you. The landlord confirms directly in their dashboard." },
            { icon: Handshake, title: "Move in with confidence", text: "Inspect in person, agree terms, and pay your advance knowing exactly what it covers." },
          ].map((s, i) => (
            <div key={s.title} className="card relative p-6">
              <span className="absolute right-5 top-4 font-display text-5xl font-semibold text-sand">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-white">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Landlord CTA ---------- */}
      <section className="container mt-20 sm:mt-24">
        <div className="relative overflow-hidden rounded-3xl bg-terracotta-600 px-6 py-12 text-white sm:px-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-400/30" />
          <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-terracotta-700/40" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Have a property to rent out?</h2>
              <p className="mt-3 text-terracotta-50">
                List for free, receive viewing requests from serious tenants, and manage everything from one dashboard.
              </p>
            </div>
            <Link href="/register?role=LANDLORD" className="btn btn-gold h-12 self-start px-7 text-base lg:self-auto">
              List your property <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-semibold text-forest-800">{value}</p>
      <p className="mt-1 text-sm text-stone-600">{label}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    // Each row is a direct child of the <dl> so screen readers pair the term with its value.
    <div className={strong ? "flex items-center justify-between gap-4 border-t border-dashed border-stone-300 pt-3" : "flex items-center justify-between gap-4"}>
      <dt className={strong ? "font-semibold" : "text-stone-600"}>{label}</dt>
      <dd className={strong ? "font-display text-xl font-semibold text-forest-800" : "font-medium"}>{value}</dd>
    </div>
  );
}
