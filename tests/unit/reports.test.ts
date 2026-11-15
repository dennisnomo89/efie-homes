import { describe, expect, it } from "vitest";
import { REPORT_REASONS, reportReasonLabel } from "@/lib/constants";
import { listingReportSchema, reportDecisionSchema } from "@/lib/validations";

describe("listingReportSchema", () => {
  const base = { propertyId: "p1", reason: "SCAM" };

  it("accepts every listed reason", () => {
    for (const r of REPORT_REASONS) {
      const details = r.value === "OTHER" ? "Something odd" : undefined;
      expect(listingReportSchema.safeParse({ ...base, reason: r.value, details }).success).toBe(true);
    }
  });

  it("rejects unknown reasons", () => {
    expect(listingReportSchema.safeParse({ ...base, reason: "BORING" }).success).toBe(false);
  });

  it("turns blank or missing details into null and trims the rest", () => {
    expect(listingReportSchema.parse(base).details).toBeNull();
    expect(listingReportSchema.parse({ ...base, details: null }).details).toBeNull();
    expect(listingReportSchema.parse({ ...base, details: "   " }).details).toBeNull();
    expect(listingReportSchema.parse({ ...base, details: "  Fake photos  " }).details).toBe("Fake photos");
  });

  it("needs details when the reason is 'Something else'", () => {
    const res = listingReportSchema.safeParse({ ...base, reason: "OTHER", details: " " });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path).toEqual(["details"]);
  });

  it("limits details to 1000 characters", () => {
    expect(listingReportSchema.safeParse({ ...base, details: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("reportDecisionSchema", () => {
  it("only closes reports (resolved or dismissed)", () => {
    expect(reportDecisionSchema.safeParse({ status: "RESOLVED" }).success).toBe(true);
    expect(reportDecisionSchema.safeParse({ status: "DISMISSED", adminNote: "Checked by phone" }).success).toBe(true);
    expect(reportDecisionSchema.safeParse({ status: "OPEN" }).success).toBe(false);
  });
});

describe("reportReasonLabel", () => {
  it("labels known reasons and passes others through", () => {
    expect(reportReasonLabel("NOT_AVAILABLE")).toBe("No longer available");
    expect(reportReasonLabel("WHATEVER")).toBe("WHATEVER");
  });
});
