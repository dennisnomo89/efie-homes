import { describe, expect, it } from "vitest";
import { anon, as, DEMO_PASSWORD, uniqueTag } from "./client";

describe("authentication", () => {
  it("rejects a wrong password without saying which part was wrong", async () => {
    const res = await anon().post("/api/auth/login", { email: "ama@efiehomes.test", password: "wrong-password1" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Incorrect email or password.");
    const unknown = await anon().post("/api/auth/login", { email: "nobody@efiehomes.test", password: "wrong-password1" });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe(res.body.error);
  });

  it("sets an httpOnly session cookie on login and clears it on logout", async () => {
    const c = anon();
    const login = await c.post("/api/auth/login", { email: "ama@efiehomes.test", password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
    const cookie = login.headers.getSetCookie().find((h) => h.startsWith("efie_token="))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);

    const me = await c.get("/api/auth/me");
    expect(me.body.user).toMatchObject({ email: "ama@efiehomes.test", role: "TENANT" });
    expect(me.body.user.passwordHash).toBeUndefined();

    await c.post("/api/auth/logout");
    expect(c.loggedIn).toBe(false);
    expect((await c.get("/api/auth/me")).body.user).toBeNull();
  });

  it("rejects a forged session cookie", async () => {
    const res = await anon().request("GET", "/api/auth/me", undefined, { headers: { Cookie: "efie_token=not.a.real.token" } });
    expect(res.body.user).toBeNull();
  });

  it("validates registration and blocks duplicate emails", async () => {
    const weak = await anon().post("/api/auth/register", { name: "Test", email: `${uniqueTag()}@efiehomes.test`, password: "short", role: "TENANT" });
    expect(weak.status).toBe(422);
    expect(weak.body.errors.password).toBeTruthy();

    const dup = await anon().post("/api/auth/register", { name: "Ama Again", email: "AMA@efiehomes.test", password: "Password123", role: "TENANT" });
    expect(dup.status).toBe(409);
  });

  it("can't register as an admin", async () => {
    const res = await anon().post("/api/auth/register", { name: "Sneaky", email: `${uniqueTag()}@efiehomes.test`, password: "Password123", role: "ADMIN" });
    expect(res.status).toBe(422);
  });

  it("registers a new landlord and logs them in", async () => {
    const c = anon();
    // Uses the demo email domain so re-seeding or the admin "Remove demo data" button clears it.
    const email = `${uniqueTag()}@efiehomes.test`;
    const res = await c.post("/api/auth/register", { name: "Test Landlord", email, password: "Password123", role: "LANDLORD" });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email, role: "LANDLORD", isVerified: false });
    expect((await c.get("/api/auth/me")).body.user.email).toBe(email);
  });

  it("sends each role to its own dashboard", async () => {
    const tenant = await as("ama");
    const landlord = await as("kwame");
    const admin = await as("admin");
    expect((await tenant.get("/dashboard")).headers.get("location")).toMatch(/\/dashboard\/tenant$/);
    expect((await landlord.get("/dashboard")).headers.get("location")).toMatch(/\/dashboard\/landlord$/);
    expect((await admin.get("/dashboard")).headers.get("location")).toMatch(/\/dashboard\/admin$/);
  });
});
