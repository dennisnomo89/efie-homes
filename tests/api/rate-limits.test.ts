import { describe, expect, it } from "vitest";

// These tests make dozens of real login/sign-up requests (bcrypt + database), so they need longer than the default.
const SLOW = 120_000;
import { anon, Client, uniqueTag } from "./client";

const PASSWORD = "RightPass123";

async function register(c: Client = anon()) {
  const email = `${uniqueTag()}@efiehomes.test`;
  const res = await c.post("/api/auth/register", { name: "Limit Tester", email, password: PASSWORD, role: "TENANT" });
  return { email, status: res.status };
}

const login = (email: string, password: string, c: Client = anon()) => c.post("/api/auth/login", { email, password });

describe("login limits", () => {
  it("locks an account after 10 wrong passwords, even from different networks", async () => {
    const { email } = await register();
    for (let i = 0; i < 10; i++) expect((await login(email, `Wrong${i}pass`)).status).toBe(401);

    const blocked = await login(email, PASSWORD); // even the right password waits
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many login attempts/);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);

    // Other accounts are unaffected.
    const other = await register();
    expect((await login(other.email, PASSWORD)).status).toBe(200);
  }, SLOW);

  it("forgets earlier failures after a successful login", async () => {
    const { email } = await register();
    for (let i = 0; i < 9; i++) await login(email, `Wrong${i}pass`);
    expect((await login(email, PASSWORD)).status).toBe(200);
    for (let i = 0; i < 9; i++) expect((await login(email, `Again${i}pass`)).status).toBe(401);
    expect((await login(email, PASSWORD)).status).toBe(200);
  }, SLOW);

  it("blocks one network after 30 failed logins across many accounts", async () => {
    const attacker = anon(); // one fixed network address for all attempts
    for (let i = 0; i < 30; i++) {
      expect((await login(`nobody-${uniqueTag()}@efiehomes.test`, "Guess1234", attacker)).status).toBe(401);
    }
    expect((await login(`nobody-${uniqueTag()}@efiehomes.test`, "Guess1234", attacker)).status).toBe(429);
    // Someone on a different network can still log in.
    const { email } = await register();
    expect((await login(email, PASSWORD)).status).toBe(200);
  }, SLOW);
});

describe("sign-up and password reset limits", () => {
  it("allows 10 new accounts per network per hour", async () => {
    const net = anon().ip;
    for (let i = 0; i < 10; i++) expect((await register(new Client(net))).status).toBe(201);
    const res = await new Client(net).post("/api/auth/register", {
      name: "One Too Many",
      email: `${uniqueTag()}@efiehomes.test`,
      password: PASSWORD,
      role: "TENANT",
    });
    expect(res.status).toBe(429);
  }, SLOW);

  it("allows 10 'forgot password' requests per network per hour", async () => {
    const c = anon();
    for (let i = 0; i < 10; i++) expect((await c.post("/api/auth/forgot-password", { email: `x${i}-${uniqueTag()}@efiehomes.test` })).status).toBe(200);
    expect((await c.post("/api/auth/forgot-password", { email: `x-${uniqueTag()}@efiehomes.test` })).status).toBe(429);
  }, SLOW);

  it("slows down reset-token guessing from one network", async () => {
    const c = anon();
    for (let i = 0; i < 20; i++) {
      expect((await c.post("/api/auth/reset-password", { token: `guess-${i}-${"x".repeat(30)}`, password: "NewPass123" })).status).toBe(400);
    }
    expect((await c.post("/api/auth/reset-password", { token: `guess-final-${"x".repeat(30)}`, password: "NewPass123" })).status).toBe(429);
  }, SLOW);
});
