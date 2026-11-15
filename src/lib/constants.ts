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

/** Rough bounding box of Ghana, used to validate map pins. */
export const GHANA_BOUNDS = { minLat: 4.5, maxLat: 11.25, minLng: -3.3, maxLng: 1.3 } as const;

/** Approximate centres of the suggested neighbourhoods (for map defaults and demo data). */
export const NEIGHBORHOOD_CENTERS: Record<string, [number, number]> = {
  "East Legon": [5.637, -0.161],
  Osu: [5.556, -0.182],
  Cantonments: [5.579, -0.173],
  "Airport Residential": [5.603, -0.18],
  Labone: [5.566, -0.17],
  Dzorwulu: [5.607, -0.201],
  Spintex: [5.63, -0.118],
  Tema: [5.73, -0.01],
  Adenta: [5.709, -0.155],
  Madina: [5.683, -0.165],
  Haatso: [5.672, -0.205],
  Achimota: [5.62, -0.231],
  Dansoman: [5.548, -0.264],
  "Trasacco Valley": [5.662, -0.134],
  "North Legon": [5.675, -0.198],
  "Kumasi - Ahodwo": [6.661, -1.623],
  "Kumasi - Nhyiaeso": [6.68, -1.637],
  "Kumasi - Danyame": [6.672, -1.632],
  "Kumasi - Asokwa": [6.674, -1.596],
  "Kumasi - Bantama": [6.705, -1.638],
  "Kumasi - Atasomanso": [6.636, -1.639],
  "Kumasi - Kwadaso": [6.693, -1.668],
  Takoradi: [4.893, -1.75],
  Anaji: [4.93, -1.78],
  Sekondi: [4.938, -1.706],
  "Cape Coast": [5.106, -1.247],
  Kasoa: [5.534, -0.418],
  Koforidua: [6.094, -0.257],
  Tamale: [9.403, -0.843],
  Ho: [6.601, 0.47],
};

/** Map centre per region when a listing has no neighbourhood match. */
export const REGION_CENTERS: Partial<Record<string, [number, number]>> = {
  "Greater Accra": [5.614, -0.205],
  Ashanti: [6.688, -1.624],
  Western: [4.9, -1.76],
  Central: [5.106, -1.247],
  Eastern: [6.094, -0.257],
  Northern: [9.403, -0.843],
  Volta: [6.601, 0.47],
};

/** Why someone reports a listing. "hint" is shown under the option in the report form. */
export const REPORT_REASONS = [
  { value: "SCAM", label: "Looks like a scam", hint: "Asked for money before a viewing, fake photos, or the \"landlord\" isn't the owner" },
  { value: "NOT_AVAILABLE", label: "No longer available", hint: "Already rented, or the landlord says it isn't for rent" },
  { value: "WRONG_DETAILS", label: "Wrong details", hint: "Price, advance, photos or location don't match" },
  { value: "DUPLICATE", label: "Duplicate listing", hint: "The same home is listed more than once" },
  { value: "OFFENSIVE", label: "Offensive or inappropriate", hint: "Discriminatory, abusive or unrelated content" },
  { value: "OTHER", label: "Something else", hint: "Tell us what's wrong" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
export const REPORT_REASON_VALUES = REPORT_REASONS.map((r) => r.value) as [ReportReason, ...ReportReason[]];
export const REPORT_STATUSES = ["OPEN", "RESOLVED", "DISMISSED"] as const;

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}
