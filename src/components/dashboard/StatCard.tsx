import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({ icon: Icon, label, value, tone = "forest" }: { icon: LucideIcon; label: string; value: string | number; tone?: "forest" | "gold" | "terracotta" | "stone" }) {
  const tones = {
    forest: "bg-forest-50 text-forest-700",
    gold: "bg-gold-100 text-gold-600",
    terracotta: "bg-terracotta-50 text-terracotta-600",
    stone: "bg-stone-100 text-stone-700",
  };
  return (
    <div className="card p-4 sm:p-5">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{value}</p>
      <p className="text-sm text-stone-600">{label}</p>
    </div>
  );
}
