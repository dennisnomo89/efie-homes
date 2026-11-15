import type { Metadata } from "next";

// Log in, sign up and password pages have no value in search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
