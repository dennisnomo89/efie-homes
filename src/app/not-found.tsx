import { HousePlus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="container py-20">
      <EmptyState
        icon={HousePlus}
        title="We couldn't find that page"
        description="The listing may have been removed by the landlord, or the link might be incorrect. Let's get you back to browsing."
        action={{ label: "Browse homes", href: "/properties" }}
      />
    </div>
  );
}
