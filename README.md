# Efie Homes 🏡

*Efie* means "home" in Twi. Efie Homes is a rental marketplace for Ghana. Landlords and verified agents list homes, and tenants search, save favourites and book viewings. Prices are shown in Ghana Cedis, and every listing states its rent advance terms.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Lucide icons · Prisma 6 + SQLite · JWT auth (`jose`, httpOnly cookie) · `bcryptjs` · Zod

---

## 1. Quick start

Requirements: **Node.js 18.18+** (tested on Node 24) and npm.

```bash
# 1. Install dependencies
npm install

# npm 11+ blocks dependency install scripts until approved.
# If you see "install scripts not yet covered by allowScripts", run:
npm install-scripts approve esbuild prisma @prisma/engines @prisma/client
npm rebuild

# 2. Configure environment
cp .env.example .env
# then set JWT_SECRET to a long random value, e.g.:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 3. Create the database and load the Ghanaian seed data
npx prisma migrate dev --name init     # also runs the seed automatically
# (re-seed any time with: npm run db:seed)

# 4. Run it
npm run dev                            # http://localhost:3000
```

Production build: `npm run build && npm start`.

### `.env`

```dotenv
DATABASE_URL="file:./dev.db"
JWT_SECRET="at-least-32-random-characters"
```

### Demo accounts (password for all: `Password123`)

| Role | Email | What you'll see |
|---|---|---|
| Tenant | `ama@efiehomes.test` | Saved homes; pending, confirmed and declined viewings |
| Tenant | `kofi@efiehomes.test` | Kumasi-focused wishlist |
| Landlord (agency) | `akosua@efiehomes.test` | Premium Accra listings, incoming requests |
| Landlord | `kwame@efiehomes.test` | Affordable Accra and Tema listings |
| Landlord | `yaw@efiehomes.test` | Kumasi listings |
| Admin | `admin@efiehomes.test` | Manages every listing and request |

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Re-run `prisma/seed.ts` (wipes and reloads demo data) |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Browse data in Prisma Studio |

---

## 2. Project structure

```
efie-homes/
├── prisma/
│   ├── schema.prisma          # User, Property, ViewingRequest, SavedProperty
│   ├── seed.ts                # 8 users, 19 properties (Accra, Tema, Kumasi, Takoradi), viewings, wishlists
│   └── migrations/
├── src/
│   ├── middleware.ts          # Protects /dashboard/*, role routing, bounces signed-in users from /login
│   ├── lib/
│   │   ├── constants.ts       # Regions, neighbourhoods, property types, amenities, advance options
│   │   ├── validations.ts     # Zod schemas shared by client forms and API routes
│   │   ├── jwt.ts             # Edge-safe sign/verify (used by middleware)
│   │   ├── auth.ts            # Session cookie helpers, getCurrentUser, requireUser
│   │   ├── api.ts             # JSON helpers + role guard for route handlers
│   │   ├── properties.ts      # Search filter parsing, Prisma where/orderBy builders
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── utils.ts           # formatCedis (₵ 3,500), dates, JSON helpers
│   ├── app/
│   │   ├── layout.tsx, globals.css, page.tsx (landing), not-found.tsx
│   │   ├── (auth)/login, (auth)/register
│   │   ├── properties/                 # search + filters (+ loading skeleton)
│   │   ├── properties/[id]/            # detail, gallery, advance calculator, viewing modal
│   │   ├── dashboard/tenant            # viewings + wishlist
│   │   ├── dashboard/landlord          # metrics, requests, listings
│   │   ├── dashboard/landlord/properties/new | [id]/edit
│   │   ├── dashboard/profile
│   │   └── api/
│   │       ├── auth/{register,login,logout,me}
│   │       ├── properties            GET (search) · POST (create)
│   │       ├── properties/[id]       GET · PATCH (edit or {status}) · DELETE
│   │       ├── viewings              GET (mine) · POST (tenant request)
│   │       ├── viewings/[id]         PATCH (landlord confirm/decline) · DELETE (tenant cancel)
│   │       ├── favorites             GET · POST
│   │       ├── favorites/[propertyId] DELETE
│   │       └── profile               PATCH
│   └── components/
│       ├── Navbar, Footer, Logo, HeroSearch, FilterSidebar, SortSelect
│       ├── PropertyCard, FavoriteButton, ImageGallery, AdvanceCalculator,
│       │   ScheduleViewingModal, AmenityIcon, AuthForms, AuthShell
│       ├── dashboard/  PropertyForm, ProfileForm, ListingActions, ViewingRequestActions, …
│       └── ui/         Toast, EmptyState, SafeImage, ConfirmButton, Portal
└── tailwind.config.ts         # forest green / terracotta / gold palette
```

---

## 3. API reference

All endpoints take and return JSON. Validation failures return `422` with `{ error, errors: { field: message } }`.

| Method & path | Auth | Notes |
|---|---|---|
| `POST /api/auth/register` | — | `{ name, email, phone?, password, role: "TENANT" \| "LANDLORD" }` |
| `POST /api/auth/login` | — | `{ email, password }` → sets the `efie_token` cookie |
| `POST /api/auth/logout` | — | Clears the cookie |
| `GET /api/auth/me` | optional | Current user or `null` |
| `GET /api/properties` | — | Query: `location, region, type, minPrice, maxPrice, advance, bedrooms, bathrooms, amenities=A,B, furnished, sort, page` |
| `POST /api/properties` | Landlord/Admin | Full property payload |
| `GET /api/properties/:id` | — | |
| `PATCH /api/properties/:id` | Owner/Admin | Full payload, or `{ status: "RENTED" \| "AVAILABLE" }` |
| `DELETE /api/properties/:id` | Owner/Admin | Cascades to viewings and saves |
| `GET /api/viewings` | Any | Tenants get requests they sent; landlords get requests on their listings |
| `POST /api/viewings` | Tenant | `{ propertyId, preferredDate: "YYYY-MM-DD", preferredTime: "HH:MM", phone, message }` |
| `PATCH /api/viewings/:id` | Owner/Admin | `{ status: "CONFIRMED" \| "DECLINED", landlordNote? }` |
| `DELETE /api/viewings/:id` | Tenant (own) | Pending requests only |
| `GET/POST /api/favorites`, `DELETE /api/favorites/:propertyId` | Tenant | Wishlist |
| `PATCH /api/profile` | Any | `{ name, phone?, avatarUrl?, currentPassword?, newPassword? }` |

---

## 4. Ghana-specific details

- **Currency:** whole cedis, shown as `₵ 3,500 / month` (`formatCedis`).
- **Rent advance:** each listing sets a minimum advance of 6, 12 or 24 months. The **upfront cost calculator** on the detail page adds rent × months, the agent commission (a percentage of the advance) and the refundable security deposit. The tenant can compare any advance period at or above the landlord's minimum.
- **"Advance I can pay" filter:** shows homes whose minimum advance is no more than the tenant can afford.
- **Locations:** all 16 regions, plus suggested neighbourhoods (East Legon, Osu, Cantonments, Spintex, Tema, Kumasi – Ahodwo, Takoradi, …). The free-text location search matches region, neighbourhood, address and title.
- **Amenities:** ECG Prepaid Meter, Ghana Water (GWCL) Flow, Borehole/Polytank Backup, Standby Generator/Solar, Walled & Gated, 24/7 Security, POP Ceiling, Air Conditioning, Parking Space.
- **Phone validation:** Ghanaian numbers such as `024 123 4567` or `+233 24 123 4567`.

## 5. Notes and switching to PostgreSQL

- SQLite has no enum or array column types. So role, type and status are stored as strings, checked by Zod. Images and amenities are stored as JSON strings.
- To use PostgreSQL: set `provider = "postgresql"` in `schema.prisma`, point `DATABASE_URL` at your server, delete `prisma/migrations`, then run `npx prisma migrate dev --name init`. Free-text search is case-sensitive on Postgres unless you add `mode: "insensitive"` in `src/lib/properties.ts`.
- Listing photos are entered as image URLs, and `<SafeImage>` shows a placeholder if a URL fails. To support file uploads, add a storage provider such as S3, Cloudinary or UploadThing.
- On the login page, demo account hints appear only outside production (`NODE_ENV !== "production"`).
