import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const cedisFormatter = new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 });

/** Formats a whole-cedi amount, e.g. 3500 → "₵ 3,500" */
export function formatCedis(amount: number): string {
  return `₵ ${cedisFormatter.format(Math.round(amount))}`;
}

/** Compact amounts for tight spaces, e.g. 85000 → "₵85k" */
export function formatCedisCompact(amount: number): string {
  if (amount >= 1_000_000) return `₵${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}m`;
  if (amount >= 1000) return `₵${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₵${amount}`;
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Normalises Ghanaian phone numbers by removing whitespace and dashes. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

/** Decides how the heart button behaves for the current viewer. */
export function favoriteModeFor(role: string | undefined | null): "tenant" | "unauth" | "landlord" {
  if (!role) return "unauth";
  return role === "LANDLORD" ? "landlord" : "tenant";
}

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70";
