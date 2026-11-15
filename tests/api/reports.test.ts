import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, DEMO_PASSWORD, uniqueTag } from "./client";
import { outboxEnabled, waitForEmails } from "./outbox";

let kwame: Client; // landlord of the test listing
let admin: Client;
// A fresh tenant per run, so the per-account daily report limit never carries over between runs.
let reporter: Client;
let listingId: string;
const title = `Report test ${uniqueTag()}`;

const report = (body: Record<string, unknown> = {}) => ({ propertyId: listingId, reason: "WRONG_DETAILS", details: "The rent is higher than listed.", ...body });
const decide = (c: Client, status: string) => c.patch(`/api/admin/properties/${listingId}/reports`, { status });

beforeAll(async () => {
  [kwame, admin] = await Promise.all([as("kwame"), as("admin")]);
  reporter = anon();
  const reg = await reporter.post("/api/auth/register", { name: "Report Tester", email: `${uniqueTag()}@efiehomes.test`, password: DEMO_PASSWORD, role: "TENANT" });
  expect(reg.status).toBe(201);
  listingId = await createListing(kwame, title);
});

afterAll(async () => {
  // Deleting the listing removes its reports.
  if (listingId) await kwame.delete(`/api/properties/${listingId}`);
});

describe("reporting a listing", () => {
  it("needs a signed-in user who doesn't own the listing", async () => {
    expect((await anon().post("/api/reports", report())).status).toBe(401);
    const own = await kwame.post("/api/reports", report());
    expect(own.status).toBe(403);
  });

  it("validates the reason, and needs details for 'Something else'", async () => {
    const bad = await reporter.post("/api/reports", report({ reason: "BORING" }));
    expect(bad.status).toBe(422);
    expect(bad.body.errors).toHaveProperty("reason");

    const other = await reporter.post("/api/reports", report({ reason: "OTHER", details: "   " }));
    expect(other.status).toBe(422);
    expect(other.body.errors).toHaveProperty("details");

    expect((await reporter.post("/api/reports", report({ propertyId: "does-not-exist" }))).status).toBe(404);
  });

  it("files the report, emails admins and refuses a duplicate", async () => {
    const since = new Date();
    const res = await reporter.post("/api/reports", report({ reason: "SCAM", details: "Asked for a viewing fee by MoMo." }));
    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({ reason: "SCAM", status: "OPEN", details: "Asked for a viewing fee by MoMo." });

    expect((await reporter.post("/api/reports", report())).status).toBe(409);

    if (outboxEnabled) {
      const [email] = await waitForEmails("admin@efiehomes.test", since, 1, 10_000, title);
      expect(email.subject).toContain("Looks like a scam");
      expect(email.text).toContain("Asked for a viewing fee by MoMo.");
      expect(email.text).not.toContain("Report Tester"); // the email doesn't name the reporter
    }
  });

  it("tells the reporter on the listing page, and doesn't show the landlord who reported", async () => {
    expect((await reporter.get(`/properties/${listingId}`)).body).toContain("You reported this listing");
    const ownerView = (await kwame.get(`/properties/${listingId}`)).body as string;
    expect(ownerView).not.toContain("Report this listing");
    expect(ownerView).not.toContain("Report Tester");
  });
});

describe("admin queue", () => {
  it("lists the reported listing for admins only", async () => {
    const page = await admin.get("/dashboard/admin");
    expect(page.status).toBe(200);
    expect(page.body).toContain(title);
    expect(page.body).toContain("Asked for a viewing fee by MoMo.");
    expect((await kwame.patch(`/api/admin/properties/${listingId}/reports`, { status: "DISMISSED" })).status).toBe(403);
    expect((await reporter.patch(`/api/admin/properties/${listingId}/reports`, { status: "DISMISSED" })).status).toBe(403);
  });

  it("closes every open report at once", async () => {
    expect((await decide(admin, "MAYBE")).status).toBe(422);
    const res = await decide(admin, "DISMISSED");
    expect(res.status).toBe(200);
    expect(res.body.closed).toBe(1);
    expect((await decide(admin, "RESOLVED")).status).toBe(409);
    expect((await admin.get("/dashboard/admin")).body).not.toContain("Asked for a viewing fee by MoMo.");
  });

  it("lets the person report again once their report was closed", async () => {
    const res = await reporter.post("/api/reports", report({ reason: "NOT_AVAILABLE", details: null }));
    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({ reason: "NOT_AVAILABLE", status: "OPEN", details: null });
  });

  it("can't report a hidden listing", async () => {
    expect((await admin.patch(`/api/admin/properties/${listingId}`, { isHidden: true })).status).toBe(200);
    expect((await (await as("kofi")).post("/api/reports", report())).status).toBe(404);
    expect((await decide(admin, "RESOLVED")).body.closed).toBe(1);
  });
});
