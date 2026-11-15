/* Efie Homes — seed script
 * Run with: npx prisma db seed
 * Every seeded account uses the password: Password123
 * WARNING: deletes all existing data first. It refuses to run if the database
 * contains real (non-@efiehomes.test) accounts unless SEED_FORCE=true.
 */
import type { Property } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { NEIGHBORHOOD_CENTERS } from "../src/lib/constants";
import bcrypt from "bcryptjs";


const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=75`;

const PHOTOS = {
  modernHouse: img("photo-1600596542815-ffad4c1539a9"),
  whiteHouse: img("photo-1600585154340-be6161a56a0c"),
  poolVilla: img("photo-1613490493576-7fde63acd811"),
  luxury: img("photo-1512917774080-9991f1c4c750"),
  suburban: img("photo-1568605114967-8130f3a36994"),
  familyHome: img("photo-1570129477492-45c003edd2be"),
  bungalow: img("photo-1564013799919-ab600027ffc6"),
  twoStorey: img("photo-1580587771525-78b9dba3b914"),
  apartmentLiving: img("photo-1502672260266-1c1ef2d93688"),
  brightLounge: img("photo-1522708323590-d24dbb6b0267"),
  cozyLounge: img("photo-1493809842364-78817add7ffb"),
  openPlan: img("photo-1560448204-e02f11c3d0e2"),
  kitchen: img("photo-1484154218962-a197022b5858"),
  sofa: img("photo-1586023492125-27b2c045efd7"),
  bedroom: img("photo-1505691938895-1758d7feb511"),
  interior: img("photo-1600607687939-ce8a6c25118c"),
  diningRoom: img("photo-1600210492486-724fe5c67fb0"),
  bathroom: img("photo-1552321554-5fefe8c9ef14"),
};

type SeedProperty = {
  title: string;
  description: string;
  propertyType: string;
  region: string;
  neighborhood: string;
  address: string;
  monthlyRent: number;
  advanceMonths: number;
  securityDeposit: number;
  agentFeePercent: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number;
  furnished?: boolean;
  images: string[];
  amenities: string[];
  status?: string;
  isFeatured?: boolean;
  views: number;
  landlord: "kwame" | "akosua" | "yaw" | "efua";
  daysAgo: number;
};

const properties: SeedProperty[] = [
  {
    title: "Modern 3-Bedroom Townhouse with Pool Access, East Legon",
    description:
      "A bright, contemporary townhouse in a quiet gated community off the American House road. All three bedrooms are en-suite with built-in wardrobes, and the open-plan living and dining area leads onto a private patio. Residents share a swimming pool and children's play area. Minutes from A&C Mall, Lancaster University and the airport.",
    propertyType: "TOWNHOUSE",
    region: "Greater Accra",
    neighborhood: "East Legon",
    address: "Mensah Wood Street, off American House, East Legon",
    monthlyRent: 14500,
    advanceMonths: 12,
    securityDeposit: 14500,
    agentFeePercent: 10,
    bedrooms: 3,
    bathrooms: 4,
    sizeSqm: 220,
    furnished: false,
    images: [PHOTOS.modernHouse, PHOTOS.openPlan, PHOTOS.kitchen, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "WALLED_GATED", "SECURITY_24_7", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    isFeatured: true,
    views: 482,
    landlord: "akosua",
    daysAgo: 2,
  },
  {
    title: "Executive 5-Bedroom Mansion with Boys' Quarters, Trasacco Valley",
    description:
      "An exceptional executive residence in the prestigious Trasacco Valley estate. Features a grand double-volume entrance, five en-suite bedrooms, a home office, family lounge, fitted kitchen with pantry, two-bedroom boys' quarters, landscaped garden and a private swimming pool. Fully backed up by a 60kVA standby generator and solar inverter system.",
    propertyType: "EXECUTIVE_MANSION",
    region: "Greater Accra",
    neighborhood: "Trasacco Valley",
    address: "Trasacco Valley Estate, East Legon Hills",
    monthlyRent: 95000,
    advanceMonths: 24,
    securityDeposit: 95000,
    agentFeePercent: 10,
    bedrooms: 5,
    bathrooms: 6,
    sizeSqm: 650,
    furnished: true,
    images: [PHOTOS.poolVilla, PHOTOS.luxury, PHOTOS.interior, PHOTOS.diningRoom, PHOTOS.bathroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "WALLED_GATED", "SECURITY_24_7", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    isFeatured: true,
    views: 1210,
    landlord: "akosua",
    daysAgo: 5,
  },
  {
    title: "Furnished 2-Bedroom Apartment near Oxford Street, Osu",
    description:
      "Stylish, fully furnished apartment on the 3rd floor of a well-kept block, a short walk from Oxford Street's restaurants and nightlife. Comes with a smart TV, fitted kitchen, washing machine and fast fibre internet ready. Ideal for young professionals and expats wanting to be in the heart of Accra.",
    propertyType: "APARTMENT_2BR",
    region: "Greater Accra",
    neighborhood: "Osu",
    address: "Cantonments Road (Oxford Street), Osu",
    monthlyRent: 9500,
    advanceMonths: 6,
    securityDeposit: 9500,
    agentFeePercent: 0,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 110,
    furnished: true,
    images: [PHOTOS.apartmentLiving, PHOTOS.sofa, PHOTOS.bedroom, PHOTOS.kitchen],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "SECURITY_24_7", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    isFeatured: true,
    views: 655,
    landlord: "kwame",
    daysAgo: 1,
  },
  {
    title: "Spacious 4-Bedroom Detached House, Cantonments",
    description:
      "A classic detached family home on a large, leafy plot close to embassies and international schools. Four bedrooms (master en-suite), separate living and dining rooms, a study, outdoor kitchen and parking for four cars. Recently repainted with new POP ceilings throughout.",
    propertyType: "DETACHED",
    region: "Greater Accra",
    neighborhood: "Cantonments",
    address: "Senchi Street, Cantonments",
    monthlyRent: 38000,
    advanceMonths: 12,
    securityDeposit: 38000,
    agentFeePercent: 10,
    bedrooms: 4,
    bathrooms: 4,
    sizeSqm: 380,
    furnished: false,
    images: [PHOTOS.suburban, PHOTOS.interior, PHOTOS.diningRoom, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "WALLED_GATED", "SECURITY_24_7", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    isFeatured: true,
    views: 391,
    landlord: "akosua",
    daysAgo: 9,
  },
  {
    title: "Neat 2-Bedroom Apartment, Spintex Road (Coca-Cola Area)",
    description:
      "Newly built two-bedroom apartment in a walled compound of six units, close to the Coca-Cola roundabout and Palace Mall. Both rooms have wardrobes, the master is en-suite, and there's a dedicated parking space per unit. Separate ECG prepaid meter for each tenant.",
    propertyType: "APARTMENT_2BR",
    region: "Greater Accra",
    neighborhood: "Spintex",
    address: "Coca-Cola Road, Spintex",
    monthlyRent: 3800,
    advanceMonths: 12,
    securityDeposit: 0,
    agentFeePercent: 10,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 95,
    images: [PHOTOS.familyHome, PHOTOS.brightLounge, PHOTOS.kitchen],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "WALLED_GATED", "POP_CEILING", "PARKING"],
    views: 288,
    landlord: "kwame",
    daysAgo: 3,
  },
  {
    title: "Chamber and Hall Self-Contained, Madina Zongo Junction",
    description:
      "Affordable chamber and hall self-contained with its own kitchenette, bathroom and toilet. Located in a quiet, walled house two minutes from the main Madina–Adenta road, with easy access to trotro and Uber. Water flows regularly and there's a polytank backup.",
    propertyType: "CHAMBER_HALL",
    region: "Greater Accra",
    neighborhood: "Madina",
    address: "Zongo Junction, Madina",
    monthlyRent: 1200,
    advanceMonths: 12,
    securityDeposit: 0,
    agentFeePercent: 10,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 40,
    images: [PHOTOS.cozyLounge, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "WALLED_GATED"],
    views: 734,
    landlord: "kwame",
    daysAgo: 4,
  },
  {
    title: "Single Room Self-Contained, Adenta Housing Down",
    description:
      "Clean single room self-contained with tiled floors, wardrobe, private bathroom and a small porch for cooking. Perfect for students and young workers. Two minutes' walk to the Adenta–Dodowa road and the Adenta barrier station.",
    propertyType: "SINGLE_ROOM_SC",
    region: "Greater Accra",
    neighborhood: "Adenta",
    address: "Housing Down, Adenta",
    monthlyRent: 850,
    advanceMonths: 12,
    securityDeposit: 0,
    agentFeePercent: 10,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 25,
    images: [PHOTOS.bedroom, PHOTOS.bathroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "WALLED_GATED"],
    views: 512,
    landlord: "kwame",
    daysAgo: 6,
  },
  {
    title: "Luxury 3-Bedroom Apartment with Gym, Airport Residential",
    description:
      "High-end apartment in a serviced tower with 24-hour concierge, gym, rooftop pool and underground parking. Floor-to-ceiling windows, Italian kitchen, central air conditioning and three en-suite bedrooms. Walking distance to the Airport City business district.",
    propertyType: "APARTMENT_3BR",
    region: "Greater Accra",
    neighborhood: "Airport Residential",
    address: "Ridge Close, Airport Residential Area",
    monthlyRent: 42000,
    advanceMonths: 12,
    securityDeposit: 42000,
    agentFeePercent: 0,
    bedrooms: 3,
    bathrooms: 3,
    sizeSqm: 210,
    furnished: true,
    images: [PHOTOS.luxury, PHOTOS.interior, PHOTOS.openPlan, PHOTOS.bathroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "WALLED_GATED", "SECURITY_24_7", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    isFeatured: true,
    views: 902,
    landlord: "akosua",
    daysAgo: 7,
  },
  {
    title: "2-Bedroom Semi-Detached House, Tema Community 25",
    description:
      "Family-friendly two-bedroom semi-detached house in the Devtraco Courts area of Community 25. Comes with a fitted kitchen, a small garden and a carport. Close to the Accra–Tema motorway, schools and Junction Mall.",
    propertyType: "APARTMENT_2BR",
    region: "Greater Accra",
    neighborhood: "Tema",
    address: "Devtraco Courts, Community 25, Tema",
    monthlyRent: 3000,
    advanceMonths: 12,
    securityDeposit: 3000,
    agentFeePercent: 10,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 100,
    images: [PHOTOS.bungalow, PHOTOS.cozyLounge, PHOTOS.kitchen],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "WALLED_GATED", "SECURITY_24_7", "PARKING"],
    views: 214,
    landlord: "kwame",
    daysAgo: 11,
  },
  {
    title: "Cosy 1-Bedroom Apartment, Labone",
    description:
      "A charming one-bedroom apartment in a quiet Labone side street, ideal for a single professional or couple. Includes a fitted kitchen, a balcony, an inverter backup and a shared compound with lush greenery. Close to Labone Junction and La beach.",
    propertyType: "APARTMENT_1BR",
    region: "Greater Accra",
    neighborhood: "Labone",
    address: "4th Norla Street, Labone",
    monthlyRent: 6500,
    advanceMonths: 12,
    securityDeposit: 6500,
    agentFeePercent: 0,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 65,
    furnished: true,
    images: [PHOTOS.brightLounge, PHOTOS.bedroom, PHOTOS.kitchen],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "GENERATOR_SOLAR", "WALLED_GATED", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    views: 307,
    landlord: "akosua",
    daysAgo: 12,
  },
  {
    title: "1-Bedroom Apartment, North Legon (Agbogba)",
    description:
      "Newly completed one-bedroom apartment with a spacious hall, modern kitchen cabinets and wardrobes. Secure walled compound with a caretaker on site. Easy access to the University of Ghana, Haatso and the N1 via Agbogba.",
    propertyType: "APARTMENT_1BR",
    region: "Greater Accra",
    neighborhood: "North Legon",
    address: "Agbogba Junction, North Legon",
    monthlyRent: 2200,
    advanceMonths: 12,
    securityDeposit: 0,
    agentFeePercent: 10,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 55,
    images: [PHOTOS.openPlan, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "BOREHOLE_POLYTANK", "WALLED_GATED", "POP_CEILING", "PARKING"],
    views: 168,
    landlord: "kwame",
    daysAgo: 15,
  },
  {
    title: "Executive 3-Bedroom Townhouse, Dzorwulu",
    description:
      "Elegant townhouse in a boutique development of four units in Dzorwulu, close to Fiesta Royale and the Accra Mall. Three en-suite bedrooms, guest washroom, family lounge upstairs and a private courtyard.",
    propertyType: "TOWNHOUSE",
    region: "Greater Accra",
    neighborhood: "Dzorwulu",
    address: "Blohum Street, Dzorwulu",
    monthlyRent: 18500,
    advanceMonths: 12,
    securityDeposit: 18500,
    agentFeePercent: 10,
    bedrooms: 3,
    bathrooms: 4,
    sizeSqm: 240,
    images: [PHOTOS.whiteHouse, PHOTOS.interior, PHOTOS.diningRoom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "WALLED_GATED", "SECURITY_24_7", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    status: "RENTED",
    views: 276,
    landlord: "akosua",
    daysAgo: 30,
  },
  // ---------------- Kumasi ----------------
  {
    title: "3-Bedroom Detached House with Garden, Kumasi - Ahodwo",
    description:
      "A well-maintained detached house in the serene Ahodwo residential area, close to the Golden Tulip hotel and Ahodwo roundabout. Three bedrooms (two en-suite), spacious hall, fitted kitchen, outdoor garden and a gated compound with parking for three cars.",
    propertyType: "DETACHED",
    region: "Ashanti",
    neighborhood: "Kumasi - Ahodwo",
    address: "Ahodwo Daban Road, Kumasi",
    monthlyRent: 6500,
    advanceMonths: 24,
    securityDeposit: 6500,
    agentFeePercent: 10,
    bedrooms: 3,
    bathrooms: 3,
    sizeSqm: 260,
    images: [PHOTOS.twoStorey, PHOTOS.cozyLounge, PHOTOS.kitchen, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "WALLED_GATED", "POP_CEILING", "PARKING"],
    isFeatured: true,
    views: 344,
    landlord: "yaw",
    daysAgo: 3,
  },
  {
    title: "Executive 4-Bedroom Home, Kumasi - Nhyiaeso",
    description:
      "Prestigious executive home a short drive from the Manhyia area and Kumasi city centre. Four en-suite bedrooms, a large living room with POP ceiling and chandeliers, separate dining, fully air-conditioned with a standby generator and borehole.",
    propertyType: "APARTMENT_4BR",
    region: "Ashanti",
    neighborhood: "Kumasi - Nhyiaeso",
    address: "Nhyiaeso Residential Area, Kumasi",
    monthlyRent: 12000,
    advanceMonths: 12,
    securityDeposit: 12000,
    agentFeePercent: 10,
    bedrooms: 4,
    bathrooms: 5,
    sizeSqm: 320,
    furnished: true,
    images: [PHOTOS.luxury, PHOTOS.diningRoom, PHOTOS.interior],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "WALLED_GATED", "SECURITY_24_7", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    isFeatured: true,
    views: 219,
    landlord: "yaw",
    daysAgo: 8,
  },
  {
    title: "Chamber and Hall, Kumasi - Asokwa (near Asokwa Interchange)",
    description:
      "Affordable chamber and hall with a private washroom and kitchen space. Situated in a quiet compound just off the Asokwa interchange with quick access to Adum and KNUST.",
    propertyType: "CHAMBER_HALL",
    region: "Ashanti",
    neighborhood: "Kumasi - Asokwa",
    address: "Asokwa, Kumasi",
    monthlyRent: 800,
    advanceMonths: 12,
    securityDeposit: 0,
    agentFeePercent: 10,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 38,
    images: [PHOTOS.cozyLounge, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "WALLED_GATED"],
    views: 401,
    landlord: "yaw",
    daysAgo: 2,
  },
  {
    title: "2-Bedroom Apartment, Kumasi - Danyame",
    description:
      "Modern two-bedroom apartment in a secure Danyame compound near the Kumasi Children's Park. Tiled throughout with POP ceilings, fitted kitchen and a balcony overlooking the street.",
    propertyType: "APARTMENT_2BR",
    region: "Ashanti",
    neighborhood: "Kumasi - Danyame",
    address: "Danyame, Kumasi",
    monthlyRent: 3200,
    advanceMonths: 12,
    securityDeposit: 3200,
    agentFeePercent: 0,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 90,
    images: [PHOTOS.brightLounge, PHOTOS.kitchen, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "WALLED_GATED", "POP_CEILING", "PARKING"],
    views: 152,
    landlord: "yaw",
    daysAgo: 10,
  },
  {
    title: "Single Room Self-Contained, Kumasi - Bantama",
    description:
      "Budget-friendly single room self-contained near Komfo Anokye Teaching Hospital — ideal for nurses, students and young workers. Private washroom, wardrobe and a shared compound with water storage.",
    propertyType: "SINGLE_ROOM_SC",
    region: "Ashanti",
    neighborhood: "Kumasi - Bantama",
    address: "Bantama High Street, Kumasi",
    monthlyRent: 600,
    advanceMonths: 6,
    securityDeposit: 0,
    agentFeePercent: 10,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 22,
    images: [PHOTOS.bedroom, PHOTOS.bathroom],
    amenities: ["ECG_PREPAID", "BOREHOLE_POLYTANK"],
    views: 289,
    landlord: "yaw",
    daysAgo: 1,
  },
  // ---------------- Takoradi ----------------
  {
    title: "3-Bedroom House with Boys' Quarters, Takoradi - Anaji",
    description:
      "Spacious three-bedroom house in the fast-growing Anaji estate, popular with oil and gas professionals. Comes with a one-room boys' quarters, large compound, standby generator and borehole. Ten minutes to Takoradi Harbour and the Mall.",
    propertyType: "DETACHED",
    region: "Western",
    neighborhood: "Anaji",
    address: "Anaji Estate, Takoradi",
    monthlyRent: 5500,
    advanceMonths: 12,
    securityDeposit: 5500,
    agentFeePercent: 10,
    bedrooms: 3,
    bathrooms: 3,
    sizeSqm: 240,
    images: [PHOTOS.familyHome, PHOTOS.interior, PHOTOS.kitchen],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "BOREHOLE_POLYTANK", "GENERATOR_SOLAR", "WALLED_GATED", "POP_CEILING", "AIR_CONDITIONING", "PARKING"],
    views: 133,
    landlord: "efua",
    daysAgo: 14,
  },
  {
    title: "Furnished 2-Bedroom Apartment near Beach Road, Takoradi",
    description:
      "Breezy two-bedroom apartment a few minutes from the beach. Fully furnished with air conditioning in every room, a modern kitchen and secure parking. Suitable for short-term contract workers on a 6-month advance.",
    propertyType: "APARTMENT_2BR",
    region: "Western",
    neighborhood: "Takoradi",
    address: "Beach Road, Takoradi",
    monthlyRent: 4800,
    advanceMonths: 6,
    securityDeposit: 4800,
    agentFeePercent: 0,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 105,
    furnished: true,
    images: [PHOTOS.apartmentLiving, PHOTOS.sofa, PHOTOS.bedroom],
    amenities: ["ECG_PREPAID", "GWCL_WATER", "GENERATOR_SOLAR", "WALLED_GATED", "SECURITY_24_7", "AIR_CONDITIONING", "PARKING"],
    views: 97,
    landlord: "efua",
    daysAgo: 4,
  },
];

/** Demo pin: the neighbourhood centre plus a small fixed offset so nearby listings don't overlap. */
function pinFor(neighborhood: string, index: number) {
  const centre = NEIGHBORHOOD_CENTERS[neighborhood];
  if (!centre) return {};
  const angle = (index * 137.5 * Math.PI) / 180; // golden-angle spread
  const r = 0.002 + (index % 3) * 0.0015; // ~200-500 m
  return {
    latitude: Number((centre[0] + r * Math.sin(angle)).toFixed(6)),
    longitude: Number((centre[1] + r * Math.cos(angle)).toFixed(6)),
  };
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  console.log("🌱 Seeding Efie Homes…");

  // The seed wipes every table. Refuse to run on a database that already has
  // real (non-demo) accounts unless SEED_FORCE=true is set explicitly.
  const realUsers = await prisma.user.count({ where: { NOT: { email: { endsWith: "@efiehomes.test" } } } });
  if (realUsers > 0 && process.env.SEED_FORCE !== "true") {
    console.error(
      `✋ Found ${realUsers} non-demo account(s). Seeding would delete ALL data.\n` +
        "   If you really want to reset this database, re-run with SEED_FORCE=true.",
    );
    process.exit(1);
  }

  await prisma.listingReport.deleteMany();
  await prisma.review.deleteMany();
  await prisma.savedProperty.deleteMany();
  await prisma.viewingRequest.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123", 12);

  const [admin, kwame, akosua, yaw, efua, ama, kofi, abena] = await Promise.all([
    prisma.user.create({ data: { name: "Efie Admin", email: "admin@efiehomes.test", phone: "0302000000", role: "ADMIN", isVerified: true, passwordHash } }),
    prisma.user.create({ data: { name: "Kwame Mensah", email: "kwame@efiehomes.test", phone: "0244123456", role: "LANDLORD", isVerified: true, passwordHash } }),
    prisma.user.create({ data: { name: "Akosua Boateng Realty", email: "akosua@efiehomes.test", phone: "0207654321", role: "LANDLORD", isVerified: true, passwordHash } }),
    prisma.user.create({ data: { name: "Yaw Owusu", email: "yaw@efiehomes.test", phone: "0541239876", role: "LANDLORD", isVerified: true, passwordHash } }),
    prisma.user.create({ data: { name: "Efua Quayson", email: "efua@efiehomes.test", phone: "0263334455", role: "LANDLORD", isVerified: false, passwordHash } }),
    prisma.user.create({ data: { name: "Ama Serwaa", email: "ama@efiehomes.test", phone: "0559876543", role: "TENANT", passwordHash } }),
    prisma.user.create({ data: { name: "Kofi Adjei", email: "kofi@efiehomes.test", phone: "0271112233", role: "TENANT", passwordHash } }),
    prisma.user.create({ data: { name: "Abena Darko", email: "abena@efiehomes.test", phone: "0501234567", role: "TENANT", passwordHash } }),
  ]);
  void admin;

  const landlords = { kwame, akosua, yaw, efua };

  const created: Property[] = [];
  for (const p of properties) {
    const { landlord, daysAgo, images, amenities, ...data } = p;
    const createdAt = daysFromNow(-daysAgo);
    created.push(
      await prisma.property.create({
        data: {
          ...data,
          images: JSON.stringify(images),
          amenities: JSON.stringify(amenities),
          landlordId: landlords[landlord].id,
          ...pinFor(data.neighborhood, created.length),
          createdAt,
        },
      }),
    );
  }

  const byTitle = (needle: string) => {
    const found = created.find((p) => p.title.includes(needle));
    if (!found) throw new Error(`Seed property not found: ${needle}`);
    return found;
  };

  // A recent rent cut on a home Ama saved, so the "Price dropped" badge shows in the demo.
  const labone = byTitle("Labone");
  await prisma.property.update({
    where: { id: labone.id },
    data: { previousRent: Math.round((labone.monthlyRent * 1.15) / 100) * 100, rentReducedAt: daysFromNow(-4) },
  });

  // Wishlists
  const saves: [string, string][] = [
    [ama.id, byTitle("East Legon").id],
    [ama.id, byTitle("Osu").id],
    [ama.id, byTitle("Labone").id],
    [kofi.id, byTitle("Ahodwo").id],
    [kofi.id, byTitle("Danyame").id],
    [abena.id, byTitle("Madina").id],
    [abena.id, byTitle("Spintex").id],
  ];
  await prisma.savedProperty.createMany({ data: saves.map(([userId, propertyId]) => ({ userId, propertyId })) });

  // Viewing requests in a mix of statuses
  await prisma.viewingRequest.createMany({
    data: [
      {
        propertyId: byTitle("Osu").id,
        tenantId: ama.id,
        preferredDate: daysFromNow(3),
        preferredTime: "10:00",
        phone: "0559876543",
        message: "Hello, I'm relocating to Accra for work next month and would love to view the apartment. Is the 6-month advance negotiable?",
        status: "PENDING",
      },
      {
        propertyId: byTitle("East Legon").id,
        tenantId: ama.id,
        preferredDate: daysFromNow(5),
        preferredTime: "14:00",
        phone: "0559876543",
        message: "Good afternoon. My family of four is interested in the townhouse. Could we see it on Saturday afternoon?",
        status: "CONFIRMED",
        landlordNote: "Confirmed. Please call when you reach the American House junction.",
      },
      {
        propertyId: byTitle("Dzorwulu").id,
        tenantId: ama.id,
        preferredDate: daysFromNow(-6),
        preferredTime: "11:00",
        phone: "0559876543",
        message: "Is this townhouse still available? I'd like to view it this week.",
        status: "DECLINED",
        landlordNote: "Sorry, the unit has just been rented out.",
      },
      {
        propertyId: byTitle("Ahodwo").id,
        tenantId: kofi.id,
        preferredDate: daysFromNow(2),
        preferredTime: "09:00",
        phone: "0271112233",
        message: "I work at KATH and need a 3-bedroom close to Ahodwo. Can I view this on Monday morning?",
        status: "PENDING",
      },
      {
        propertyId: byTitle("Spintex").id,
        tenantId: abena.id,
        preferredDate: daysFromNow(4),
        preferredTime: "16:00",
        phone: "0501234567",
        message: "Hi, I'd like to view the Spintex apartment after work. Is there a separate meter for each unit?",
        status: "PENDING",
      },
      {
        propertyId: byTitle("Madina").id,
        tenantId: kofi.id,
        preferredDate: daysFromNow(1),
        preferredTime: "12:00",
        phone: "0271112233",
        message: "Please, is the chamber and hall still available? I can come tomorrow afternoon.",
        status: "CONFIRMED",
        landlordNote: "Yes, still available. The caretaker Mr. Tetteh will show you around.",
      },
    ],
  });

  // Past confirmed viewings, most with a review (and some with the landlord's reply).
  type PastViewing = {
    tenant: { id: string; phone: string | null };
    property: string;
    daysAgo: number;
    review?: { landlordRating: number; accuracyRating: number; comment?: string; reply?: string };
  };
  const pastViewings: PastViewing[] = [
    {
      tenant: abena,
      property: "Tema Community 25",
      daysAgo: 20,
      review: {
        landlordRating: 5,
        accuracyRating: 4,
        comment: "Kwame was on time and answered all my questions about water and the ECG meter. The house is as shown, just the garden is smaller than the photos suggest.",
        reply: "Thank you Abena! Glad the viewing went well.",
      },
    },
    {
      tenant: kofi,
      property: "Adenta",
      daysAgo: 35,
      review: { landlordRating: 4, accuracyRating: 3, comment: "Friendly landlord. The room is clean but smaller than I expected from the pictures." },
    },
    {
      tenant: ama,
      property: "Labone",
      daysAgo: 12,
      review: { landlordRating: 5, accuracyRating: 5, comment: "Very professional. The apartment looked exactly like the listing and the rent and advance were clearly explained." },
    },
    {
      tenant: abena,
      property: "Cantonments",
      daysAgo: 40,
      review: {
        landlordRating: 3,
        accuracyRating: 4,
        comment: "Nice house, but the agent arrived 40 minutes late and I had to wait at the gate.",
        reply: "Sorry about the wait, Abena. There was heavy traffic on the Spintex Road that day. We now confirm the time by phone the morning of every viewing.",
      },
    },
    {
      tenant: kofi,
      property: "Nhyiaeso",
      daysAgo: 15,
      review: { landlordRating: 5, accuracyRating: 5, comment: "Yaw showed me round himself and was very patient. Highly recommended in Kumasi." },
    },
    // No review yet, so Ama's dashboard shows "Leave a review".
    { tenant: ama, property: "Airport Residential", daysAgo: 3 },
  ];
  for (const v of pastViewings) {
    const property = byTitle(v.property);
    await prisma.viewingRequest.create({
      data: {
        propertyId: property.id,
        tenantId: v.tenant.id,
        preferredDate: daysFromNow(-v.daysAgo),
        preferredTime: "11:00",
        phone: v.tenant.phone ?? "0000000000",
        message: "Hello, I'd like to come and see this place. Is it still available?",
        status: "CONFIRMED",
        landlordNote: "Yes, see you then.",
        createdAt: daysFromNow(-v.daysAgo - 3),
        ...(v.review && {
          review: {
            create: {
              propertyId: property.id,
              propertyTitle: property.title,
              tenantId: v.tenant.id,
              landlordId: property.landlordId,
              landlordRating: v.review.landlordRating,
              accuracyRating: v.review.accuracyRating,
              comment: v.review.comment ?? null,
              landlordReply: v.review.reply ?? null,
              repliedAt: v.review.reply ? daysFromNow(-v.daysAgo + 2) : null,
              createdAt: daysFromNow(-v.daysAgo + 1),
            },
          },
        }),
      },
    });
  }

  // Open reports, so the admin queue has something in it.
  await prisma.listingReport.createMany({
    data: [
      {
        propertyId: byTitle("Bantama").id,
        reporterId: abena.id,
        reason: "NOT_AVAILABLE",
        details: "I called the number and was told the room was rented last month.",
        createdAt: daysFromNow(-2),
      },
      {
        propertyId: byTitle("Trasacco").id,
        reporterId: kofi.id,
        reason: "SCAM",
        details: "Someone claiming to be the agent asked me to send a GHS 500 viewing fee by MoMo before showing me the house.",
        createdAt: daysFromNow(-1),
      },
    ],
  });

  console.log(
    `✅ Seeded ${await prisma.user.count()} users, ${created.length} properties, ${await prisma.review.count()} reviews, ${await prisma.listingReport.count()} reports.`,
  );
  console.log("   All accounts use the password: Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
