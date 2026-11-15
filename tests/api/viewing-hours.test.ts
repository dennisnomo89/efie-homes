import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, as, Client, createListing, DEMO_PASSWORD, uniqueTag } from "./client";

/*
 * A fresh landlord per run, so changing their viewing hours can't affect other tests.
 * The landlord shows homes on Mondays at 10:00 and 11:00 only.
 */
let landlord: Client;
let tenantA: Client;
let tenantB: Client;
let listingId: string;
const tag = uniqueTag();

/** The next Monday (and Tuesday) at least two days away, as YYYY-MM-DD (UTC = Ghana time). */
function nextWeekday(target: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 2);
  while (d.getUTCDay() !== target) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
const monday = nextWeekday(1);
const tuesday = nextWeekday(2);

const register = async (role: "LANDLORD" | "TENANT", name: string) => {
  const c = anon();
  expect((await c.post("/api/auth/register", { name, email: `${uniqueTag()}@efiehomes.test`, password: DEMO_PASSWORD, role })).status).toBe(201);
  return c;
};

const request = (c: Client, date: string, time: string) =>
  c.post("/api/viewings", { propertyId: listingId, preferredDate: date, preferredTime: time, phone: "0241234567", message: "Hello, I'd like to view this place please." });

const slots = async (date: string) =>
  (await anon().get(`/api/properties/${listingId}/slots?date=${date}`)).body as { slots: { time: string; available: boolean; reason: string | null }[]; anyTime: boolean };

beforeAll(async () => {
  [landlord, tenantA, tenantB] = await Promise.all([register("LANDLORD", `Hours Landlord ${tag}`), register("TENANT", "Tenant A"), register("TENANT", "Tenant B")]);
  listingId = await createListing(landlord, `Viewing hours test ${tag}`);
});

afterAll(async () => {
  if (listingId) await landlord.delete(`/api/properties/${listingId}`);
});

describe("viewing hours", () => {
  it("default to any listed time", async () => {
    expect((await landlord.get("/api/profile/viewing-hours")).body).toEqual({ hours: null });
    const s = await slots(tuesday);
    expect(s.anyTime).toBe(true);
    expect(s.slots.every((x) => x.available)).toBe(true);
  });

  it("can only be set by landlords, and must be valid", async () => {
    expect((await tenantA.put("/api/profile/viewing-hours", { hours: null })).status).toBe(403);
    expect((await landlord.put("/api/profile/viewing-hours", { hours: { "1": ["10:15"] } })).status).toBe(422);
    expect((await landlord.put("/api/profile/viewing-hours", { hours: {} })).status).toBe(422);
    const res = await landlord.put("/api/profile/viewing-hours", { hours: { "1": ["11:00", "10:00"] } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ hours: { "1": ["10:00", "11:00"] } });
  });

  it("decide which times tenants are offered", async () => {
    const mon = await slots(monday);
    expect(mon.slots.filter((x) => x.available).map((x) => x.time)).toEqual(["10:00", "11:00"]);
    expect((await slots(tuesday)).slots.some((x) => x.available)).toBe(false);
    expect((await anon().get(`/api/properties/${listingId}/slots?date=soon`)).status).toBe(422);
  });

  it("are enforced when a tenant books", async () => {
    const off = await request(tenantA, tuesday, "10:00");
    expect(off.status).toBe(422);
    expect(off.body.errors.preferredTime).toMatch(/doesn't show homes at that time/);
    expect((await request(tenantA, monday, "10:00")).status).toBe(201);
    // Another tenant may still ask for the same time while it's only pending.
    expect((await request(tenantB, monday, "10:00")).status).toBe(201);
  });

  it("stop a confirmed time being booked or confirmed twice", async () => {
    const viewings = (await landlord.get("/api/viewings")).body.viewings as { id: string; tenant: { name: string } }[];
    const a = viewings.find((v) => v.tenant.name === "Tenant A")!;
    const b = viewings.find((v) => v.tenant.name === "Tenant B")!;

    expect((await landlord.patch(`/api/viewings/${a.id}`, { status: "CONFIRMED" })).status).toBe(200);
    const clash = await landlord.patch(`/api/viewings/${b.id}`, { status: "CONFIRMED" });
    expect(clash.status).toBe(409);
    expect(clash.body.error).toMatch(/already confirmed another viewing/);
    expect((await landlord.patch(`/api/viewings/${b.id}`, { status: "DECLINED" })).status).toBe(200);

    expect((await slots(monday)).slots.find((x) => x.time === "10:00")).toMatchObject({ available: false, reason: "booked" });
    const tenantC = await register("TENANT", "Tenant C");
    const late = await request(tenantC, monday, "10:00");
    expect(late.status).toBe(422);
    expect(late.body.error).toMatch(/already been booked|just been booked/);
  });

  it("can go back to any time", async () => {
    expect((await landlord.put("/api/profile/viewing-hours", { hours: null })).body).toEqual({ hours: null });
    expect((await slots(tuesday)).anyTime).toBe(true);
  });
});
