/** Site-wide identity used in metadata, share previews, the sitemap and emails. */

export const SITE_NAME = "Efie Homes";
export const SITE_TAGLINE = "Find your next home in Ghana";
export const SITE_DESCRIPTION =
  "Rent apartments, chamber and halls, townhouses and executive homes across Accra, Kumasi, Takoradi and beyond. Transparent prices in Ghana Cedis and clear rent advance terms.";

/**
 * Public base URL, without a trailing slash.
 * APP_URL wins (custom domain); on Vercel the production domain is used; otherwise localhost.
 */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

/** Absolute URL for a path on this site. */
export function absoluteUrl(path = "/"): string {
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
