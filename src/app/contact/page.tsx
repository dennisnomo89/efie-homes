import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { ContentPage } from "@/components/ContentPage";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with Efie Homes by WhatsApp, phone or email.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  { icon: MessageCircle, label: "WhatsApp", value: CONTACT.phoneDisplay, href: `${CONTACT.whatsapp}?text=${encodeURIComponent("Hello Efie Homes, ")}`, note: "Usually the quickest way to reach us", external: true },
  { icon: Phone, label: "Call", value: CONTACT.phoneDisplay, href: `tel:${CONTACT.phoneE164}`, note: "Call or text us" },
  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}`, note: "For anything that needs a written reply" },
];

export default function ContactPage() {
  return (
    <ContentPage eyebrow="Contact" title="We're here to help" intro="Questions about a listing, your account or listing your property? Reach us however suits you.">
      <div className="not-prose grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="card flex flex-col p-5 no-underline transition hover:-translate-y-0.5 hover:border-forest-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
              <c.icon className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-ink">{c.label}</span>
            <span className="break-all font-semibold text-forest-800">{c.value}</span>
            <span className="mt-1 text-xs text-stone-500">{c.note}</span>
          </a>
        ))}
      </div>

      <p className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-terracotta-500" /> Office: {CONTACT.address} (by appointment)
      </p>

      <h2>Common questions</h2>
      <h3>How do I contact a landlord?</h3>
      <p>
        Open the listing and tap <strong>Schedule a viewing</strong>. Once you&rsquo;ve sent a request you can message the landlord from your
        dashboard. The landlord&rsquo;s phone number is shared when they confirm your viewing.
      </p>
      <h3>Does Efie Homes charge tenants?</h3>
      <p>No. Searching, saving homes and booking viewings are free. Any agent commission is shown on the listing before you book.</p>
      <h3>How do I get the verified badge as a landlord?</h3>
      <p>Contact us with your name and the property you&rsquo;re listing. We&rsquo;ll ask for ID and proof that you own or manage it.</p>
      <h3>I forgot my password</h3>
      <p>
        Use <Link href="/forgot-password">Forgot password</Link> on the login page to get a reset link by email.
      </p>

      <div className="not-prose mt-6 flex gap-3 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-4 text-sm text-terracotta-800">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <p>
          <strong>Report a suspicious listing or request for money.</strong> Never pay an advance or &ldquo;viewing fee&rdquo; before seeing a home
          in person. If something feels wrong, message us on WhatsApp with the listing link and we&rsquo;ll look into it straight away.
        </p>
      </div>
    </ContentPage>
  );
}
