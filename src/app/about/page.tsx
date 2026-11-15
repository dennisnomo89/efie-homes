import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Calculator, MessageCircle, ShieldCheck } from "lucide-react";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "About us",
  description: "Efie Homes connects tenants in Ghana directly with landlords and verified agents, with prices in cedis and the full rent advance shown upfront.",
  alternates: { canonical: "/about" },
};

const PROMISES = [
  { icon: Calculator, title: "No surprises on cost", text: "Every listing shows the rent in cedis, the minimum advance, any agent commission and the deposit, plus the total you'll pay to move in." },
  { icon: BadgeCheck, title: "Verified landlords", text: "Landlords and agents who have shown us who they are get a verified badge, so you know who you're dealing with." },
  { icon: MessageCircle, title: "Direct contact", text: "Request viewings and message landlords on Efie Homes, without passing your number around before you're ready." },
  { icon: ShieldCheck, title: "Safety first", text: "We hide listings that look wrong and remind everyone: always inspect a home in person before paying any advance." },
];

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About Efie Homes"
      title="Finding a home in Ghana shouldn't be a gamble"
      intro={
        <>
          <em className="not-italic text-terracotta-600">Efie</em> means &ldquo;home&rdquo; in Twi. We built Efie Homes to make renting fairer and
          clearer for tenants and landlords alike.
        </>
      }
    >
      <p>
        Anyone who has searched for a room in Accra or Kumasi knows the story: listings with no price, surprise agent fees, two years&rsquo;
        advance mentioned only at the viewing, and hours spent travelling to homes that were already taken. Efie Homes puts the important
        facts up front, so tenants can decide quickly and landlords meet people who are genuinely ready to rent.
      </p>

      <div className="not-prose grid gap-4 py-2 sm:grid-cols-2">
        {PROMISES.map((p) => (
          <div key={p.title} className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
              <p.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-base font-semibold text-ink">{p.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{p.text}</p>
          </div>
        ))}
      </div>

      <h2>For tenants</h2>
      <p>
        Search by area, budget, number of rooms, advance period and the things that matter day to day: ECG prepaid meters, water flow,
        borehole or polytank backup, generators and security. Save searches to get an email when something new matches, and book viewings
        at a time that suits you. Searching and booking are free.
      </p>

      <h2>For landlords and agents</h2>
      <p>
        List a property in a few minutes with photos, your terms and a map pin. Tenants send viewing requests with their preferred date
        and time; you confirm or decline from your dashboard and chat with them in one place. Listing is free.
      </p>

      <h2>Talk to us</h2>
      <p>
        Questions, feedback or a listing that doesn&rsquo;t look right? <Link href="/contact">Get in touch</Link>. We read every message.
      </p>
    </ContentPage>
  );
}
