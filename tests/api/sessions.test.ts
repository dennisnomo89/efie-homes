import { describe, expect, it } from "vitest";
import { anon, Client, uniqueTag } from "./client";
import { outboxEnabled, waitForEmails } from "./outbox";

/** Registers a fresh tenant (demo domain) and returns its email and a logged-in client. */
async function freshUser(password: string) {
  const email = `${uniqueTag()}@efiehomes.test`;
  const c = anon();
  const res = await c.post("/api/auth/register", { name: "Session Tester", email, password, role: "TENANT" });
  expect(res.status).toBe(201);
  return { email, c };
}

async function loginAs(email: string, password: string) {
  const c = anon();
  expect((await c.post("/api/auth/login", { email, password })).status).toBe(200);
  return c;
}

const isLoggedIn = async (c: Client) => (await c.get("/api/auth/me")).body.user !== null;

describe("signing out other devices", () => {
  it("changing the password keeps this device and signs out the others", async () => {
    const { email, c: laptop } = await freshUser("FirstPass123");
    const phone = await loginAs(email, "FirstPass123");
    expect(await isLoggedIn(phone)).toBe(true);

    const res = await laptop.patch("/api/profile", { name: "Session Tester", currentPassword: "FirstPass123", newPassword: "SecondPass456" });
    expect(res.status).toBe(200);
    expect(res.body.signedOutOtherDevices).toBe(true);

    expect(await isLoggedIn(laptop)).toBe(true);
    expect(await isLoggedIn(phone)).toBe(false);
    expect((await phone.get("/api/favorites")).status).toBe(401);
  });

  it("updating only the name keeps every device signed in", async () => {
    const { email, c: laptop } = await freshUser("FirstPass123");
    const phone = await loginAs(email, "FirstPass123");
    expect((await laptop.patch("/api/profile", { name: "Renamed Tester" })).body.signedOutOtherDevices).toBe(false);
    expect(await isLoggedIn(phone)).toBe(true);
    expect((await phone.get("/api/auth/me")).body.user.name).toBe("Renamed Tester");
  });

  it("'sign out everywhere' ends every session, including this one", async () => {
    const { email, c: laptop } = await freshUser("FirstPass123");
    const phone = await loginAs(email, "FirstPass123");
    expect((await laptop.post("/api/auth/logout-all")).status).toBe(200);
    expect(await isLoggedIn(laptop)).toBe(false);
    expect(await isLoggedIn(phone)).toBe(false);
    // Logging in again works normally.
    expect(await isLoggedIn(await loginAs(email, "FirstPass123"))).toBe(true);
  });

  it("sends a revoked session from a dashboard to log in, clearing the cookie", async () => {
    const { email, c: laptop } = await freshUser("FirstPass123");
    const phone = await loginAs(email, "FirstPass123");
    await laptop.post("/api/auth/logout-all");

    const page = await phone.get("/dashboard/tenant");
    expect(page.status).toBe(307);
    // The dashboard layout sends people back to /dashboard, which routes them to their own dashboard.
    expect(page.headers.get("location")).toMatch(/\/api\/auth\/session-expired\?next=%2Fdashboard/);

    const expired = await phone.get("/api/auth/session-expired?next=%2Fdashboard%2Ftenant");
    expect(expired.headers.get("location")).toMatch(/\/login\?next=%2Fdashboard%2Ftenant$/);
    expect(phone.loggedIn).toBe(false);
  });

  it("won't redirect off-site after a revoked session", async () => {
    const res = await anon().get("/api/auth/session-expired?next=%2F%2Fevil.example");
    expect(res.headers.get("location")).toMatch(/\/login\?next=%2Fdashboard$/);
  });

  it.skipIf(!outboxEnabled)("a password reset signs out every device", async () => {
    const { email, c: laptop } = await freshUser("FirstPass123");
    const start = new Date();
    await anon().post("/api/auth/forgot-password", { email });
    const [mail] = await waitForEmails(email, start);
    const token = decodeURIComponent(mail.text.match(/token=([A-Za-z0-9_%-]+)/)![1]);
    expect((await anon().post("/api/auth/reset-password", { token, password: "AfterReset789" })).status).toBe(200);
    expect(await isLoggedIn(laptop)).toBe(false);
  });
});
