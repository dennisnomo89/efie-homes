import { CircleCheck, CircleX, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { cls: string; icon: typeof Clock; label: string }> = {
  PENDING: { cls: "bg-gold-100 text-gold-600 ring-gold-300", icon: Clock, label: "Pending" },
  CONFIRMED: { cls: "bg-forest-50 text-forest-700 ring-forest-200", icon: CircleCheck, label: "Confirmed" },
  DECLINED: { cls: "bg-red-50 text-red-700 ring-red-200", icon: CircleX, label: "Declined" },
  AVAILABLE: { cls: "bg-forest-50 text-forest-700 ring-forest-200", icon: CircleCheck, label: "Available" },
  RENTED: { cls: "bg-stone-100 text-stone-700 ring-stone-300", icon: CircleX, label: "Rented" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STYLES[status] ?? STYLES.PENDING;
  return (
    <span className={cn("badge ring-1", s.cls, className)}>
      <s.icon className="h-3.5 w-3.5" /> {s.label}
    </span>
  );
}
