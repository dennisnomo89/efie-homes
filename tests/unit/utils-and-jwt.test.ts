import { describe, expect, it, vi } from "vitest";
import { favoriteModeFor, formatCedis, formatCedisCompact, formatTime, initials, parseJsonArray } from "@/lib/utils";
import { signToken, verifyToken } from "@/lib/jwt";
import { advanceLabel, propertyTypeLabel } from "@/lib/constants";

describe("formatting", () => {
  it("formats cedis with a thousands separator", () => {
    expect(formatCedis(3500)).toBe("₵ 3,500");
    expect(formatCedis(95000)).toBe("₵ 95,000");
    expect(formatCedis(0)).toBe("₵ 0");
  });

  it("formats compact cedis", () => {
    expect(formatCedisCompact(85_000)).toBe("₵85k");
    expect(formatCedisCompact(1_500_000)).toBe("₵1.5m");
    expect(formatCedisCompact(900)).toBe("₵900");
  });

  it("formats 24-hour slots as 12-hour times", () => {
    expect(formatTime("09:00")).toBe("9:00am");
    expect(formatTime("12:00")).toBe("12:00pm");
    expect(formatTime("17:00")).toBe("5:00pm");
  });

  it("labels Ghanaian rental terms", () => {
    expect(advanceLabel(12)).toBe("1 Year Advance");
    expect(advanceLabel(9)).toBe("9 Months Advance");
    expect(propertyTypeLabel("CHAMBER_HALL")).toBe("Chamber and Hall");
  });

  it("builds initials", () => {
    expect(initials("Akosua Boateng Realty")).toBe("AB");
  });
});

describe("parseJsonArray", () => {
  it("returns strings only and survives bad JSON", () => {
    expect(parseJsonArray('["a", 2, "b"]')).toEqual(["a", "b"]);
    expect(parseJsonArray("not json")).toEqual([]);
    expect(parseJsonArray('{"a":1}')).toEqual([]);
    expect(parseJsonArray(null)).toEqual([]);
  });
});

describe("favoriteModeFor", () => {
  it("routes the heart button by role", () => {
    expect(favoriteModeFor(undefined)).toBe("unauth");
    expect(favoriteModeFor("LANDLORD")).toBe("landlord");
    expect(favoriteModeFor("TENANT")).toBe("tenant");
    expect(favoriteModeFor("ADMIN")).toBe("tenant");
  });
});

describe("session tokens", () => {
  const payload = { sub: "user_1", role: "TENANT" as const, name: "Ama", email: "ama@example.com", sv: 3 };

  it("treats tokens issued before session versions as version 0", async () => {
    const { SignJWT } = await import("jose");
    const legacy = await new SignJWT({ role: "TENANT", name: "Ama", email: "ama@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_1")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    expect((await verifyToken(legacy))?.sv).toBe(0);
  });

  it("round-trips a session", async () => {
    expect(await verifyToken(await signToken(payload))).toEqual(payload);
  });

  it("rejects a tampered token", async () => {
    const token = await signToken(payload);
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "user_1", role: "ADMIN", name: "Ama", email: "ama@example.com" })).toString("base64url");
    expect(await verifyToken(`${h}.${forged}.${s}`)).toBeNull();
    expect(await verifyToken("garbage")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signToken(payload);
    vi.stubEnv("JWT_SECRET", "a-completely-different-secret-of-sufficient-length");
    try {
      expect(await verifyToken(token)).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("refuses to sign with a missing or short secret", async () => {
    vi.stubEnv("JWT_SECRET", "short");
    try {
      await expect(signToken(payload)).rejects.toThrow(/JWT_SECRET/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
