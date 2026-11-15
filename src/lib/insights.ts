import { prisma } from "./prisma";

/** Crawlers, link previews and audit tools don't count as views. */
const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless|pingdom|uptime|curl|wget/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

const DAY_MS = 86_400_000;

/** Midnight UTC (= Ghana time) of the given moment. */
export function utcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Counts one public view: the all-time total and today's row. */
export async function recordListingView(propertyId: string, now = new Date()): Promise<void> {
  const day = utcDay(now);
  await prisma.$transaction([
    prisma.property.update({ where: { id: propertyId }, data: { views: { increment: 1 } } }),
    // Upsert in one statement so simultaneous first views of the day can't collide.
    prisma.$executeRaw`INSERT INTO "PropertyViewDay" ("propertyId", "day", "views") VALUES (${propertyId}, ${day}, 1)
      ON CONFLICT ("propertyId", "day") DO UPDATE SET "views" = "PropertyViewDay"."views" + 1`,
  ]);
}

export type DayPoint = { day: string; views: number; saves: number; requests: number };

/**
 * One point per day from `start` for `days` days (oldest first), filling gaps with zeros.
 * `views` rows are per-day totals; `saves` and `requests` are individual timestamps.
 */
export function buildDailySeries(
  start: Date,
  days: number,
  data: { views: { day: Date; views: number }[]; saves: Date[]; requests: Date[] },
): DayPoint[] {
  const points: DayPoint[] = [];
  const index = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const p = { day: isoDay(new Date(start.getTime() + i * DAY_MS)), views: 0, saves: 0, requests: 0 };
    points.push(p);
    index.set(p.day, p);
  }
  for (const v of data.views) {
    const p = index.get(isoDay(v.day));
    if (p) p.views += v.views;
  }
  for (const s of data.saves) {
    const p = index.get(isoDay(s));
    if (p) p.saves++;
  }
  for (const r of data.requests) {
    const p = index.get(isoDay(r));
    if (p) p.requests++;
  }
  return points;
}

/** "3 of 120" as a whole percentage, or null when there's nothing to divide by. */
export function rate(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

export const INSIGHT_DAYS = 30;

export async function listingInsights(propertyId: string, now = new Date()) {
  const today = utcDay(now);
  const start = new Date(today.getTime() - (INSIGHT_DAYS - 1) * DAY_MS);
  const prevStart = new Date(start.getTime() - INSIGHT_DAYS * DAY_MS);

  const [viewRows, prevViews, saves, requests, savesTotal, requestsByStatus] = await Promise.all([
    prisma.propertyViewDay.findMany({ where: { propertyId, day: { gte: start } }, select: { day: true, views: true } }),
    prisma.propertyViewDay.aggregate({ where: { propertyId, day: { gte: prevStart, lt: start } }, _sum: { views: true } }),
    prisma.savedProperty.findMany({ where: { propertyId, createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.viewingRequest.findMany({ where: { propertyId, createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.savedProperty.count({ where: { propertyId } }),
    prisma.viewingRequest.groupBy({ by: ["status"], where: { propertyId }, _count: { _all: true } }),
  ]);

  const series = buildDailySeries(start, INSIGHT_DAYS, {
    views: viewRows,
    saves: saves.map((s) => s.createdAt),
    requests: requests.map((r) => r.createdAt),
  });
  const sum = (k: "views" | "saves" | "requests") => series.reduce((n, p) => n + p[k], 0);
  const period = { views: sum("views"), saves: sum("saves"), requests: sum("requests") };
  const byStatus = (s: string) => requestsByStatus.find((r) => r.status === s)?._count._all ?? 0;

  return {
    series,
    period,
    previousViews: prevViews._sum.views ?? 0,
    saveRate: rate(period.saves, period.views),
    requestRate: rate(period.requests, period.views),
    allTime: {
      saves: savesTotal,
      requests: requestsByStatus.reduce((n, r) => n + r._count._all, 0),
      pending: byStatus("PENDING"),
      confirmed: byStatus("CONFIRMED"),
      declined: byStatus("DECLINED"),
    },
  };
}
