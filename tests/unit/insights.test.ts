import { describe, expect, it } from "vitest";
import { niceMax } from "@/components/dashboard/ViewsChart";
import { buildDailySeries, isBot, rate, utcDay } from "@/lib/insights";

describe("isBot", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "facebookexternalhit/1.1",
    "WhatsApp/2.23.20.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36",
    "curl/8.4.0",
    "",
    null,
  ])("treats %s as a bot", (ua) => {
    expect(isBot(ua)).toBe(true);
  });

  it("counts real browsers", () => {
    expect(isBot("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36")).toBe(false);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe(false);
  });
});

describe("utcDay", () => {
  it("drops the time of day (UTC is Ghana time)", () => {
    expect(utcDay(new Date("2026-11-15T23:59:59Z")).toISOString()).toBe("2026-11-15T00:00:00.000Z");
  });
});

describe("buildDailySeries", () => {
  const start = new Date("2026-11-13T00:00:00Z");

  it("has one point per day, oldest first, with gaps filled", () => {
    const s = buildDailySeries(start, 3, { views: [], saves: [], requests: [] });
    expect(s).toEqual([
      { day: "2026-11-13", views: 0, saves: 0, requests: 0 },
      { day: "2026-11-14", views: 0, saves: 0, requests: 0 },
      { day: "2026-11-15", views: 0, saves: 0, requests: 0 },
    ]);
  });

  it("puts views, saves and requests on the right day and ignores anything outside the window", () => {
    const s = buildDailySeries(start, 3, {
      views: [
        { day: new Date("2026-11-13T00:00:00Z"), views: 5 },
        { day: new Date("2026-11-15T00:00:00Z"), views: 2 },
        { day: new Date("2026-11-01T00:00:00Z"), views: 99 },
      ],
      saves: [new Date("2026-11-14T08:00:00Z"), new Date("2026-11-14T21:30:00Z")],
      requests: [new Date("2026-11-15T10:00:00Z"), new Date("2026-11-20T10:00:00Z")],
    });
    expect(s.map((p) => [p.views, p.saves, p.requests])).toEqual([
      [5, 0, 0],
      [0, 2, 0],
      [2, 0, 1],
    ]);
  });
});

describe("rate", () => {
  it("is a percentage to one decimal, or null without views", () => {
    expect(rate(3, 120)).toBe(2.5);
    expect(rate(1, 3)).toBe(33.3);
    expect(rate(0, 0)).toBeNull();
  });
});

describe("niceMax (chart top)", () => {
  it.each([
    [0, 4],
    [3, 4],
    [7, 8],
    [13, 20],
    [21, 40],
    [230, 250],
    [999, 1000],
  ])("%i → %i", (max, top) => {
    const v = niceMax(max);
    expect(v).toBe(top);
    expect(v % 2).toBe(0);
  });
});
