import { describe, expect, it } from "vitest";
import { compareHref, MAX_COMPARE, parseCompareIds, toggleCompareId } from "@/lib/compare";

const a = "cmwhk0s6j000gt8ubts587jue";
const b = "cmwhkxjli000c00ubhf1zw7di";
const c = "cmwhk0qfz0001t8ub32picvpp";
const d = "cmwhk0qfz0002t8ub32picvpq";

describe("parseCompareIds", () => {
  it("handles empty input", () => {
    expect(parseCompareIds(undefined)).toEqual([]);
    expect(parseCompareIds(null)).toEqual([]);
    expect(parseCompareIds("")).toEqual([]);
  });

  it("keeps order, drops duplicates and malformed ids, and caps at the maximum", () => {
    expect(parseCompareIds(`${a}, ${a},bad id!,${b},<script>,${c},${d}`)).toEqual([a, b, c]);
    expect(MAX_COMPARE).toBe(3);
  });

  it("accepts repeated query params", () => {
    expect(parseCompareIds([a, `${b},${c}`])).toEqual([a, b, c]);
  });
});

describe("toggleCompareId", () => {
  it("adds and removes", () => {
    expect(toggleCompareId([], a)).toEqual({ ids: [a], outcome: "added" });
    expect(toggleCompareId([a, b], a)).toEqual({ ids: [b], outcome: "removed" });
  });

  it("refuses a fourth home without changing the list", () => {
    expect(toggleCompareId([a, b, c], d)).toEqual({ ids: [a, b, c], outcome: "full" });
  });

  it("still removes when the list is full", () => {
    expect(toggleCompareId([a, b, c], b).ids).toEqual([a, c]);
  });
});

it("builds the compare link", () => {
  expect(compareHref([a, b])).toBe(`/compare?ids=${a},${b}`);
});
