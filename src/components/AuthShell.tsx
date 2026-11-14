import { BadgeCheck } from "lucide-react";
import { SafeImage } from "./ui/SafeImage";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-stone-600">{subtitle}</p>
        <div className="card mt-8 p-6 sm:p-8">{children}</div>
      </div>
      <div className="relative hidden h-full max-h-[640px] overflow-hidden rounded-3xl lg:block">
        <SafeImage
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=75"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-3xl font-semibold leading-tight">&ldquo;Efie ne efie.&rdquo;</p>
          <p className="mt-1 text-stone-300">There&rsquo;s no place like home.</p>
          <ul className="mt-6 space-y-2 text-sm text-stone-200">
            {["Verified landlords and agents", "Prices in cedis, advance shown upfront", "Book viewings without the back-and-forth"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-gold-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
