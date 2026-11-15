import { afterEach, describe, expect, it, vi } from "vitest";
import { appUrl } from "@/lib/email";
import {
  escapeHtml,
  passwordResetEmail,
  viewingAnsweredEmail,
  viewingCancelledEmail,
  viewingRequestedEmail,
} from "@/lib/email-templates";
import { hashResetToken } from "@/lib/password-reset";

afterEach(() => vi.unstubAllEnvs());

describe("escapeHtml", () => {
  it("neutralises markup", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;");
  });
});

describe("viewing emails", () => {
  const requested = viewingRequestedEmail({
    landlordName: "Kwame Mensah",
    tenantName: "Ama <b>Serwaa</b>",
    tenantPhone: "0559876543",
    propertyTitle: "Neat 2-Bedroom, Spintex",
    date: new Date("2026-11-20T00:00:00Z"),
    time: "14:00",
    message: 'Is it available? <img src=x onerror="alert(1)">',
    dashboardUrl: "https://efie.example/dashboard/landlord",
  });

  it("escapes tenant-supplied text in the HTML", () => {
    expect(requested.html).not.toContain("<img src=x");
    expect(requested.html).not.toContain("<b>Serwaa</b>");
    expect(requested.html).toContain("&lt;img src=x");
  });

  it("includes the details landlords need, in HTML and plain text", () => {
    expect(requested.subject).toBe("New viewing request: Neat 2-Bedroom, Spintex");
    for (const body of [requested.html, requested.text]) {
      expect(body).toContain("0559876543");
      expect(body).toContain("2:00pm");
      expect(body).toContain("https://efie.example/dashboard/landlord");
    }
    expect(requested.text).toMatch(/^Hi Kwame,/);
  });

  it("shares the landlord's phone only when a viewing is confirmed", () => {
    const base = {
      tenantName: "Ama Serwaa",
      landlordName: "Kwame Mensah",
      landlordPhone: "0244123456",
      propertyTitle: "Neat 2-Bedroom, Spintex",
      date: "2026-11-20T00:00:00Z",
      time: "10:00",
      note: "Call at the gate",
      propertyUrl: "https://efie.example/properties/p1",
      dashboardUrl: "https://efie.example/dashboard/tenant",
    };
    const confirmed = viewingAnsweredEmail({ ...base, status: "CONFIRMED" });
    const declined = viewingAnsweredEmail({ ...base, status: "DECLINED" });
    expect(confirmed.subject).toMatch(/^Viewing confirmed/);
    expect(confirmed.text).toContain("0244123456");
    expect(confirmed.text).toContain("Call at the gate");
    expect(declined.subject).toMatch(/declined/);
    expect(declined.text).not.toContain("0244123456");
    expect(declined.html).not.toContain("0244123456");
  });

  it("tells the landlord about cancellations", () => {
    const e = viewingCancelledEmail({
      landlordName: "Kwame",
      tenantName: "Ama",
      propertyTitle: "Chamber and Hall, Madina",
      date: "2026-11-20T00:00:00Z",
      time: "09:00",
      dashboardUrl: "https://efie.example/dashboard/landlord",
    });
    expect(e.subject).toBe("Viewing request cancelled: Chamber and Hall, Madina");
    expect(e.text).toContain("9:00am");
  });
});

describe("password reset email", () => {
  it("contains the link and expiry", () => {
    const e = passwordResetEmail({ name: "Ama Serwaa", resetUrl: "https://efie.example/reset-password?token=abc", minutes: 60 });
    expect(e.text).toContain("https://efie.example/reset-password?token=abc");
    expect(e.html).toContain('href="https://efie.example/reset-password?token=abc"');
    expect(e.text).toContain("60 minutes");
  });
});

describe("hashResetToken", () => {
  it("is a stable SHA-256 hex digest that hides the token", () => {
    const h = hashResetToken("token-123");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetToken("token-123")).toBe(h);
    expect(hashResetToken("token-124")).not.toBe(h);
  });
});

describe("appUrl", () => {
  it("prefers APP_URL, then Vercel's production URL, then localhost", () => {
    vi.stubEnv("APP_URL", "https://efiehomes.com.gh/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "efie-homes.vercel.app");
    expect(appUrl()).toBe("https://efiehomes.com.gh");
    vi.stubEnv("APP_URL", "");
    expect(appUrl()).toBe("https://efie-homes.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(appUrl()).toBe("http://localhost:3000");
  });
});
