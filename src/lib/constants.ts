export const ROLES = ["TENANT", "LANDLORD", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROPERTY_STATUSES = ["AVAILABLE", "RENTED"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const VIEWING_STATUSES = ["PENDING", "CONFIRMED", "DECLINED"] as const;
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];

export const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Northern",
  "Volta",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North",
] as const;
export type Region = (typeof REGIONS)[number];

/** Popular suburbs grouped by region. Landlords may still type any neighbourhood. */
export const NEIGHBORHOODS: Partial<Record<Region, string[]>> = {
  "Greater Accra": [
    "East Legon",
    "Osu",
    "Cantonments",
    "Airport Residential",
    "Labone",
    "Dzorwulu",
    "Spintex",
    "Tema",
    "Adenta",
    "Madina",
    "Haatso",
    "Achimota",
    "Dansoman",
    "Trasacco Valley",
    "North Legon",
  ],
  Ashanti: [
    "Kumasi - Ahodwo",
    "Kumasi - Nhyiaeso",
    "Kumasi - Danyame",
    "Kumasi - Asokwa",
    "Kumasi - Bantama",
    "Kumasi - Atasomanso",
    "Kumasi - Kwadaso",
  ],
  Western: ["Takoradi", "Anaji", "Sekondi", "Beach Road"],
  Central: ["Cape Coast", "Kasoa", "Winneba"],
  Eastern: ["Koforidua", "Aburi", "Nkawkaw"],
  Northern: ["Tamale", "Kalpohin"],
  Volta: ["Ho", "Hohoe"],
};

export const POPULAR_NEIGHBORHOODS = [
  { name: "East Legon", region: "Greater Accra", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=70" },
  { name: "Osu", region: "Greater Accra", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70" },
  { name: "Cantonments", region: "Greater Accra", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=70" },
  { name: "Spintex", region: "Greater Accra", image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=70" },
  { name: "Tema", region: "Greater Accra", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=70" },
  { name: "Kumasi - Ahodwo", region: "Ashanti", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=70" },
  { name: "Takoradi", region: "Western", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=70" },
  { name: "Airport Residential", region: "Greater Accra", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=70" },
] as const;

export const PROPERTY_TYPES = [
  { value: "CHAMBER_HALL", label: "Chamber and Hall" },
  { value: "SINGLE_ROOM_SC", label: "Single Room Self-Contained" },
  { value: "APARTMENT_1BR", label: "1 Bedroom Apartment" },
  { value: "APARTMENT_2BR", label: "2 Bedroom Apartment" },
  { value: "APARTMENT_3BR", label: "3 Bedroom Apartment" },
  { value: "APARTMENT_4BR", label: "4+ Bedroom Apartment" },
  { value: "DETACHED", label: "Detached House" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "EXECUTIVE_MANSION", label: "Executive Mansion" },
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];
export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((t) => t.value) as [PropertyType, ...PropertyType[]];

export const AMENITIES = [
  { value: "ECG_PREPAID", label: "ECG Prepaid Meter", essential: true },
  { value: "GWCL_WATER", label: "Ghana Water (GWCL) Flow", essential: true },
  { value: "BOREHOLE_POLYTANK", label: "Borehole/Polytank Backup", essential: true },
  { value: "GENERATOR_SOLAR", label: "Standby Generator/Solar", essential: true },
  { value: "WALLED_GATED", label: "Walled & Gated", essential: true },
  { value: "SECURITY_24_7", label: "24/7 Security", essential: false },
  { value: "POP_CEILING", label: "POP Ceiling", essential: false },
  { value: "AIR_CONDITIONING", label: "Air Conditioning", essential: false },
  { value: "PARKING", label: "Parking Space", essential: false },
] as const;
export type Amenity = (typeof AMENITIES)[number]["value"];
export const AMENITY_VALUES = AMENITIES.map((a) => a.value) as [Amenity, ...Amenity[]];

export const ADVANCE_OPTIONS = [
  { months: 6, label: "6 Months Advance" },
  { months: 12, label: "1 Year Advance" },
  { months: 24, label: "2 Years Advance" },
] as const;
export const ADVANCE_MONTH_VALUES = ADVANCE_OPTIONS.map((a) => a.months);

export const BUDGET_OPTIONS = [1000, 2000, 3500, 5000, 8000, 12000, 20000, 50000, 100000];

export const VIEWING_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most viewed" },
] as const;

export const PAGE_SIZE = 9;

export function propertyTypeLabel(value: string): string {
  return PROPERTY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function amenityLabel(value: string): string {
  return AMENITIES.find((a) => a.value === value)?.label ?? value;
}

export function advanceLabel(months: number): string {
  return ADVANCE_OPTIONS.find((a) => a.months === months)?.label ?? `${months} Months Advance`;
}

/** Seeded demo accounts all use this email domain (see prisma/seed.ts). */
export const DEMO_EMAIL_DOMAIN = "@efiehomes.test";
