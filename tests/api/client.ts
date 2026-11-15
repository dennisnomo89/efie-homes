/* Tiny HTTP client for API tests: keeps the session cookie between requests. */

export const BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const DEMO_PASSWORD = "Password123";

export type Res<T = any> = { status: number; body: T; headers: Headers };

export class Client {
  private cookie = "";

  async request<T = any>(method: string, path: string, body?: unknown, init: RequestInit = {}): Promise<Res<T>> {
    const res = await fetch(BASE_URL + path, {
      method,
      redirect: "manual",
      ...init,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...(init.headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [name, value] = pair.split("=");
      if (name === "efie_token") this.cookie = value ? `efie_token=${value}` : "";
    }
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* HTML or empty */
    }
    return { status: res.status, body: parsed as T, headers: res.headers };
  }

  get<T = any>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T = any>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body ?? {});
  }
  patch<T = any>(path: string, body: unknown) {
    return this.request<T>("PATCH", path, body);
  }
  delete<T = any>(path: string) {
    return this.request<T>("DELETE", path);
  }

  get loggedIn() {
    return Boolean(this.cookie);
  }
}

/** Logs in as a seeded demo account, e.g. as("ama"). */
export async function as(name: "ama" | "kofi" | "abena" | "kwame" | "akosua" | "yaw" | "efua" | "admin"): Promise<Client> {
  const c = new Client();
  const res = await c.post("/api/auth/login", { email: `${name}@efiehomes.test`, password: DEMO_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login as ${name} failed (${res.status}). Is the server running at ${BASE_URL} with the demo seed loaded?`);
  }
  return c;
}

export const anon = () => new Client();

/** YYYY-MM-DD, offset from today (UTC). */
export function isoDay(offsetDays: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const uniqueTag = () => `apitest${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function listingPayload(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title,
    description: "Automated test listing created by the API test suite. It is deleted when the tests finish.",
    propertyType: "APARTMENT_2BR",
    region: "Greater Accra",
    neighborhood: "Haatso",
    address: "Atomic Road, Haatso",
    monthlyRent: 2500,
    advanceMonths: 12,
    securityDeposit: 0,
    agentFeePercent: 10,
    bedrooms: 2,
    bathrooms: 1,
    sizeSqm: null,
    furnished: false,
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
    amenities: ["ECG_PREPAID", "WALLED_GATED"],
    ...overrides,
  };
}

/** Creates a listing as the given landlord and returns its id. */
export async function createListing(landlord: Client, title: string, overrides: Record<string, unknown> = {}) {
  const res = await landlord.post("/api/properties", listingPayload(title, overrides));
  if (res.status !== 201) throw new Error(`Could not create test listing (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body.property.id as string;
}

export async function search(query: string) {
  const res = await anon().get(`/api/properties?${query}`);
  return res.body as { total: number; properties: { id: string }[] };
}
