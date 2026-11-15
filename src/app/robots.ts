import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** /robots.txt — keep private and utility areas out of search engines. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/login", "/register", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
