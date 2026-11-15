import { UserRound } from "lucide-react";
import { renterFacts, type RenterProfileData } from "@/lib/renter";

/** On a landlord's request card: what the tenant shared about themselves. */
export function RenterSummary({ name, profile }: { name: string; profile: RenterProfileData | null }) {
  const facts = renterFacts(profile);
  if (facts.length === 0 && !profile?.about) {
    return <p className="mt-2 text-xs text-stone-500">{name.split(" ")[0]} hasn&rsquo;t filled in a renter profile yet.</p>;
  }
  return (
    <div className="mt-3 rounded-xl border border-stone-200 p-3 text-sm">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
        <UserRound className="h-3.5 w-3.5" /> About {name.split(" ")[0]}
      </p>
      {facts.length > 0 && <p className="mt-1 font-medium">{facts.join(" · ")}</p>}
      {profile?.about && <p className="mt-1 whitespace-pre-line text-stone-700">{profile.about}</p>}
    </div>
  );
}
