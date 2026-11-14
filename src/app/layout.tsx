import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentUser } from "@/lib/auth";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Efie Homes — Find your next home in Ghana",
    template: "%s · Efie Homes",
  },
  description:
    "Rent apartments, chamber and halls, townhouses and executive homes across Accra, Kumasi, Takoradi and beyond. Transparent prices in Ghana Cedis and clear rent advance terms.",
};

export const viewport: Viewport = {
  themeColor: "#174e3c",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en-GH" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <Navbar user={user ? { name: user.name, role: user.role, avatarUrl: user.avatarUrl } : null} />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
