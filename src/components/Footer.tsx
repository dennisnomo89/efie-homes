import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";

const cols = [
  {
    title: "Explore",
    links: [
      { href: "/properties", label: "All rentals" },
      { href: "/properties?location=East+Legon", label: "East Legon" },
      { href: "/properties?location=Osu", label: "Osu" },
      { href: "/properties?location=Spintex", label: "Spintex" },
      { href: "/properties?region=Ashanti", label: "Kumasi" },
      { href: "/properties?location=Takoradi", label: "Takoradi" },
    ],
  },
  {
    title: "Property types",
    links: [
      { href: "/properties?type=CHAMBER_HALL", label: "Chamber and Hall" },
      { href: "/properties?type=SINGLE_ROOM_SC", label: "Single Room S/C" },
      { href: "/properties?type=APARTMENT_2BR", label: "2 Bedroom Apartments" },
      { href: "/properties?type=TOWNHOUSE", label: "Townhouses" },
      { href: "/properties?type=EXECUTIVE_MANSION", label: "Executive Mansions" },
    ],
  },
  {
    title: "Efie Homes",
    links: [
      { href: "/register?role=LANDLORD", label: "List your property" },
      { href: "/register", label: "Create an account" },
      { href: "/login", label: "Log in" },
      { href: "/#advance", label: "How rent advance works" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-forest-950 text-stone-300">
      <div className="kente-stripe h-1.5" />
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400">
            <em className="not-italic text-gold-400">Efie</em> means &ldquo;home&rdquo; in Twi. We connect tenants with verified landlords and
            agents across Ghana — with transparent prices in cedis and no surprises about advance payments.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-400" /> Oxford Street, Osu, Accra
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold-400" /> +233 30 200 0000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold-400" /> hello@efiehomes.test
            </li>
          </ul>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-stone-400 transition hover:text-gold-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Efie Homes. Made with care in Accra.</p>
          <p>Always inspect a property in person before paying any advance.</p>
        </div>
      </div>
    </footer>
  );
}
