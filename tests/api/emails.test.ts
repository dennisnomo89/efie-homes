import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, isoDay, uniqueTag } from "./client";
import { outboxEnabled, waitForEmails } from "./outbox";

/*
 * These tests need the server started with EMAIL_OUTBOX_DIR (and without RESEND_API_KEY),
 * and the same EMAIL_OUTBOX_DIR set when running the tests. CI does this automatically.
 */
const KWAME = "kwame@efiehomes.test";
const ABENA = "abena@efiehomes.test";

describe.skipIf(!outboxEnabled)("viewing request emails", () => {
  let kwame: Client;
  let abena: Client;
  let listingId: string;
  const title = `Email flow ${uniqueTag()}`;

  beforeAll(async () => {
    [kwame, abena] = await Promise.all([as("kwame"), as("abena")]);
    listingId = await createListing(kwame, title);
  });

  afterAll(async () => {
    if (listingId) await kwame.delete(`/api/properties/${listingId}`);
  });

  const request = (message: string, preferredTime = "15:00") => ({
    propertyId: listingId,
    preferredDate: isoDay(3),
    preferredTime,
    phone: "0501234567",
    message,
  });

  it("emails the landlord about a new request, then the tenant when confirmed", async () => {
    const start = new Date();
    const created = await abena.post("/api/viewings", request("Hello! <b>Can I bring my sister?</b>"));
    expect(created.status).toBe(201);

    const [toLandlord] = await waitForEmails(KWAME, start, 1, 10_000, "New viewing request");
    expect(toLandlord, "landlord should get an email").toBeDefined();
    expect(toLandlord.subject).toBe(`New viewing request: ${title}`);
    expect(toLandlord.replyTo).toBe(ABENA);
    expect(toLandlord.text).toContain("Can I bring my sister?");
    expect(toLandlord.text).toContain("0501234567");
    expect(toLandlord.html).not.toContain("<b>Can I bring");

    const answeredAt = new Date();
    await kwame.patch(`/api/viewings/${created.body.viewing.id}`, { status: "CONFIRMED", landlordNote: "Yes, both welcome." });
    const [toTenant] = await waitForEmails(ABENA, answeredAt, 1, 10_000, "Viewing confirmed");
    expect(toTenant.subject).toBe(`Viewing confirmed: ${title}`);
    expect(toTenant.text).toContain("Yes, both welcome.");
    expect(toTenant.text).toMatch(/\/properties\//);

    // Saving the same answer again doesn't email the tenant twice.
    const againAt = new Date();
    await kwame.patch(`/api/viewings/${created.body.viewing.id}`, { status: "CONFIRMED" });
    expect(await waitForEmails(ABENA, againAt, 1, 2_000)).toHaveLength(0);
  });

  it("emails the landlord when a tenant cancels", async () => {
    const kofi = await as("kofi");
    // 15:00 that day is already confirmed for Abena (above), so ask for another time.
    const created = await kofi.post("/api/viewings", request("Please, I would like to come and see it.", "16:00"));
    expect(created.status).toBe(201);
    const start = new Date();
    expect((await kofi.delete(`/api/viewings/${created.body.viewing.id}`)).status).toBe(200);
    const emails = await waitForEmails(KWAME, start, 1, 10_000, "cancelled");
    expect(emails.map((e) => e.subject)).toEqual([`Viewing request cancelled: ${title}`]);
  });
});

describe.skipIf(!outboxEnabled)("password reset", () => {
  const email = `${uniqueTag()}@efiehomes.test`;
  const oldPassword = "Original123";
  const newPassword = "BrandNew456";
  let token = "";

  beforeAll(async () => {
    const res = await anon().post("/api/auth/register", { name: "Reset Tester", email, password: oldPassword, role: "TENANT" });
    expect(res.status).toBe(201);
  });

  it("gives the same reply whether or not the account exists", async () => {
    const known = await anon().post("/api/auth/forgot-password", { email });
    const unknown = await anon().post("/api/auth/forgot-password", { email: `nobody-${uniqueTag()}@efiehomes.test` });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
  });

  it("emails a one-time link", async () => {
    const [mail] = await waitForEmails(email, new Date(Date.now() - 60_000));
    expect(mail.subject).toBe("Reset your Efie Homes password");
    const match = mail.text.match(/\/reset-password\?token=([A-Za-z0-9_%-]+)/);
    expect(match).not.toBeNull();
    token = decodeURIComponent(match![1]);
  });

  it("rejects a weak new password and a made-up token", async () => {
    expect((await anon().post("/api/auth/reset-password", { token, password: "weak" })).status).toBe(422);
    const fake = await anon().post("/api/auth/reset-password", { token: "x".repeat(43), password: newPassword });
    expect(fake.status).toBe(400);
    expect(fake.body.error).toMatch(/invalid/);
  });

  it("sets the new password once", async () => {
    expect((await anon().post("/api/auth/reset-password", { token, password: newPassword })).status).toBe(200);
    expect((await anon().post("/api/auth/login", { email, password: oldPassword })).status).toBe(401);
    expect((await anon().post("/api/auth/login", { email, password: newPassword })).status).toBe(200);

    const reused = await anon().post("/api/auth/reset-password", { token, password: "Another789" });
    expect(reused.status).toBe(400);
    expect(reused.body.error).toMatch(/already been used/);
  });

  it("limits reset emails to 3 per hour per account", async () => {
    const start = new Date();
    // Fire them simultaneously: the limit must hold even when requests race each other.
    await Promise.all(Array.from({ length: 4 }, () => anon().post("/api/auth/forgot-password", { email })));
    // One request was already made above, so only 2 more emails may be sent this hour.
    // Wait generously for those two (emails go out after the response, slower on a busy machine),
    // then a little longer to make sure no third one follows.
    expect(await waitForEmails(email, start, 2, 15_000)).toHaveLength(2);
    expect(await waitForEmails(email, start, 3, 3_000)).toHaveLength(2);
  });
});

describe.skipIf(outboxEnabled)("email tests", () => {
  it.skip("skipped: set EMAIL_OUTBOX_DIR for both the server and the tests to run them", () => {});
});
