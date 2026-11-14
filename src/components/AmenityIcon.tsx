import { AirVent, Car, Container, Droplets, Fence, PanelTop, ShieldCheck, Sun, Zap, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  ECG_PREPAID: Zap,
  GWCL_WATER: Droplets,
  BOREHOLE_POLYTANK: Container,
  GENERATOR_SOLAR: Sun,
  WALLED_GATED: Fence,
  SECURITY_24_7: ShieldCheck,
  POP_CEILING: PanelTop,
  AIR_CONDITIONING: AirVent,
  PARKING: Car,
};

export function AmenityIcon({ amenity, className }: { amenity: string; className?: string }) {
  const Icon = ICONS[amenity] ?? ShieldCheck;
  return <Icon className={className} />;
}
