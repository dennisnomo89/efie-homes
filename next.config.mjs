/**
 * Security headers sent with every response.
 * - frame-ancestors / X-Frame-Options: other sites can't embed Efie Homes in a frame (clickjacking/phishing)
 * - HSTS: browsers only use HTTPS for the site from now on (ignored on http://localhost)
 * - nosniff: browsers don't guess file types (protects uploaded images)
 * - Referrer-Policy: other sites only see our domain, never full URLs (which can contain reset links)
 * - Permissions-Policy: no camera/microphone/payment APIs; geolocation only for our own pages
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Always put <title>, description and share tags in <head> (not streamed later), for every crawler
  // and preview tool, not just the ones Next.js recognises. Our metadata is a single fast query.
  htmlLimitedBots: /.*/,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
