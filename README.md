# Efie Homes 🏡

*Efie* means "home" in Twi. Efie Homes is a rental marketplace for Ghana. Landlords and verified agents list homes, and tenants search, save favourites and book viewings. Prices are shown in Ghana Cedis, and every listing states its rent advance terms.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS · Lucide icons · Prisma 7 (`@prisma/adapter-pg`) + PostgreSQL (Neon) · JWT auth (`jose`, httpOnly cookie) · `bcryptjs` · Zod

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
# Paste your PostgreSQL connection strings (a free Neon database works well),
# and set JWT_SECRET to a long random value, e.g.:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 3. Create the tables and load the Ghanaian seed data
npx prisma migrate deploy
npx prisma db seed                     # wipes data first; refuses if real accounts exist

# 4. Run it
npm run dev                            # http://localhost:3000
```

Production build: `npm run build && npm start`.

### `.env`

```dotenv
DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require"   # pooled, used at runtime
DATABASE_URL_UNPOOLED="postgresql://…/neondb?sslmode=require"   # direct, used by migrations
JWT_SECRET="at-least-32-random-characters"
```

Tip: in Neon, create a separate **branch** (e.g. `dev`) for local development so you never touch production data.

---

## Deploying to Vercel + Neon

1. **Import the repo:** at [vercel.com/new](https://vercel.com/new), sign in with GitHub and import `efie-homes`. Keep the defaults (Framework: Next.js).
2. **Add the database:** in the Vercel project, open **Storage → Create Database → Neon** and connect it to the project. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically.
3. **Add the secret:** under **Settings → Environment Variables**, add `JWT_SECRET` with a new random value (don't reuse your local one).
4. **Deploy:** go to **Deployments** and redeploy. The `vercel-build` script runs `prisma migrate deploy` before `next build`, so the tables are created on every deploy.
5. **(Optional) Demo data:** copy the two Neon URLs into your local `.env` and run `npx prisma db seed`. Only do this on a fresh database: it deletes all data.

Every push to `main` then redeploys automatically.

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
| `npm test` | Unit tests (no database needed) |
| `npm run test:api` | API tests against a running app (see Testing) |
| `npm run make-admin -- <email>` | Promote an account to admin in the `.env` database |
| `npm run db:migrate -- --name <change>` | `prisma migrate dev`, then `prisma generate` (create a migration after schema changes) |
| `npm run db:deploy` | `prisma migrate deploy` (apply migrations) |
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
│   ├── proxy.ts               # (Next 16 "proxy", formerly middleware) Protects /dashboard/*, role routing, bounces signed-in users from /login
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
| `POST /api/auth/forgot-password` | — | `{ email }` → always the same reply; emails a one-time link if the account exists (max 3 per hour) |
| `POST /api/auth/reset-password` | — | `{ token, password }` → sets the new password; the link works once and expires after 60 minutes |
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
| `PATCH /api/admin/users/:id` | Admin | `{ isVerified }` (landlord/agent accounts only) |
| `PATCH /api/admin/properties/:id` | Admin | `{ isHidden?, isFeatured? }` (hiding also unfeatures) |
| `GET /api/admin/demo-data` | Admin | Counts of demo accounts, listings and viewings |
| `DELETE /api/admin/demo-data` | Admin | Permanently deletes all `@efiehomes.test` accounts except your own, with their listings |

---

## Admin dashboard

Admins land on `/dashboard/admin`, where they can:

- **Verify landlords and agents:** verified landlords get a trust badge on every listing.
- **Moderate listings:** feature on the home page, hide from the public (the landlord still sees it, marked "Hidden by admin"), or delete.
- **Remove demo data:** a one-click cleanup appears while any `@efiehomes.test` accounts remain.

**Becoming an admin.** Register a normal account on the site first, then promote it:

- *On your PC (dev database):* `npm run make-admin -- you@example.com`
- *On the live site:* in the Neon console for the live database, open **SQL Editor** and run
  `UPDATE "User" SET role = 'ADMIN', "isVerified" = true WHERE email = 'you@example.com';`

Then log out and back in: the role is stored in the session cookie.

---

## 4. Ghana-specific details

- **Currency:** whole cedis, shown as `₵ 3,500 / month` (`formatCedis`).
- **Rent advance:** each listing sets a minimum advance of 6, 12 or 24 months. The **upfront cost calculator** on the detail page adds rent × months, the agent commission (a percentage of the advance) and the refundable security deposit. The tenant can compare any advance period at or above the landlord's minimum.
- **"Advance I can pay" filter:** shows homes whose minimum advance is no more than the tenant can afford.
- **Locations:** all 16 regions, plus suggested neighbourhoods (East Legon, Osu, Cantonments, Spintex, Tema, Kumasi – Ahodwo, Takoradi, …). The free-text location search matches region, neighbourhood, address and title.
- **Amenities:** ECG Prepaid Meter, Ghana Water (GWCL) Flow, Borehole/Polytank Backup, Standby Generator/Solar, Walled & Gated, 24/7 Security, POP Ceiling, Air Conditioning, Parking Space.
- **Phone validation:** Ghanaian numbers such as `024 123 4567` or `+233 24 123 4567`.

## Email notifications

Efie Homes sends these emails:

| When | To |
|---|---|
| A tenant requests a viewing | The landlord (reply-to: the tenant) |
| A tenant cancels a pending request | The landlord |
| The landlord confirms or declines | The tenant (reply-to: the landlord; includes the landlord's phone only when confirmed) |
| Someone uses "Forgot password?" | The account's email, with a one-time link valid for 60 minutes |

Emails are sent after the response (`after()` from `next/server`), so a slow or failing email service never breaks a request.

**How sending is chosen** (`src/lib/email.ts`):

1. `RESEND_API_KEY` set → sent through [Resend](https://resend.com).
2. Otherwise, `EMAIL_OUTBOX_DIR` set → saved as JSON files in that folder (good for local development; the API tests read them).
3. Otherwise → only logged. In production the body is not logged, because it can contain reset links.

**Turning on real email (Resend):**

1. Create a free account at [resend.com](https://resend.com) and create an API key with "Sending access".
2. In Vercel → your project → **Settings → Environment Variables**, add `RESEND_API_KEY`, then redeploy.
3. Until you verify a domain in Resend, emails come from `onboarding@resend.dev` and Resend only delivers them **to your own Resend account email**. To email real users, add and verify your domain in Resend (it gives you DNS records to add), then set `EMAIL_FROM`, e.g. `Efie Homes <notifications@yourdomain.com>`.
4. Optional: set `APP_URL` if the site has its own domain; otherwise links use Vercel's production domain.

Known limitation: resetting a password doesn't sign out sessions that are already logged in elsewhere (sessions are stateless 7-day tokens).

## Map view

- **Listings page:** a **List / Map** switch (`?view=map`). The map shows matching homes as price tags with a preview card; all filters apply. Data comes from `GET /api/properties/map` (up to 300 pins).
- **Listing page:** an "approximate area" map (300 m circle).
- **Listing form:** landlords can drop and drag a pin (optional, must be inside Ghana).
- **Privacy:** the exact pin is stored, but every public page and API response rounds it to 3 decimal places (about 110 m). Only the landlord's edit form shows the exact spot.
- **Maps:** [Leaflet](https://leafletjs.com) with OpenStreetMap tiles (attribution shown on the map). OpenStreetMap's free tiles are fine for modest traffic; if Efie Homes grows large, switch the tile URL in `src/components/map/ListingsMap.tsx` to a hosted provider (e.g. MapTiler, Stadia or Carto) per [OSM's tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Messages and photo uploads

**Messages.** Each viewing request has a private thread between the tenant and that listing's landlord (`/api/viewings/:id/messages`). Admins can read threads for moderation but not post. The other person gets an email for a new message, at most one per burst while earlier messages are unread. Limits: 2,000 characters per message, 30 messages per person per thread per 10 minutes.

**Photo uploads.** Landlords can upload JPEG, PNG or WebP photos from the listing form. The browser shrinks them (longest side 1,600 px) before upload; the server checks the file's actual contents and caps uploads at 4 MB.

Where photos are stored (`src/lib/uploads.ts`):

1. `BLOB_READ_WRITE_TOKEN` set → [Vercel Blob](https://vercel.com/docs/vercel-blob).
2. Otherwise, `UPLOADS_DIR` set → a local folder, served from `/api/uploads/:name` (development and tests only).
3. Otherwise → uploads are off and the button is hidden; pasting image links still works.

**Turning on uploads on Vercel:** in your Vercel project open **Storage → Create Database → Blob**, create the store and connect it to the project (all environments). Vercel adds `BLOB_READ_WRITE_TOKEN` automatically; redeploy. The free tier is enough to start.

## Testing

Tests use [Vitest](https://vitest.dev) and live in `tests/`.

- **Unit tests** (`tests/unit`): validation rules, search filters, the upfront-cost calculator (`src/lib/pricing.ts`), session tokens and formatting. They need no database:
  ```bash
  npm test            # or: npm run test:watch
  ```
- **API tests** (`tests/api`): log in as the demo accounts over HTTP and check sign-in, who-can-do-what, the listing lifecycle, viewing requests, wishlists and admin moderation. They need a running app whose database has the demo seed loaded:
  ```bash
  npm run build && npm start        # in one terminal
  npm run test:api                  # in another
  ```
  To include the email and upload tests, start the server and run the tests with `EMAIL_OUTBOX_DIR=.email-outbox UPLOADS_DIR=.uploads` (and without `RESEND_API_KEY` or `BLOB_READ_WRITE_TOKEN`); otherwise they're skipped. Set `API_BASE_URL` to test a different address. Listings the tests create are deleted afterwards. Registration tests leave a few `@efiehomes.test` accounts behind; re-seeding removes them. **Never point the API tests at the live site.**

**On GitHub:** `.github/workflows/ci.yml` runs on every push to `main` and on pull requests. It starts a throwaway PostgreSQL database, then typechecks, runs the unit tests, migrates and seeds, builds, starts the app and runs the API tests. Results appear on the repository's **Actions** tab and as ✓ / ✗ next to each commit.

## 5. Notes

- Role, type and status are stored as strings and checked by Zod. Images and amenities are stored as JSON strings. (This dates from the original SQLite version and works fine on PostgreSQL.)
- Location search is case-insensitive (`mode: "insensitive"` in `src/lib/properties.ts`).
- Listing photos can be uploaded (see above) or entered as image URLs; `<SafeImage>` shows a placeholder if an image fails to load.
- On the login page, demo account hints appear only outside production (`NODE_ENV !== "production"`).
- **Prisma 7 specifics:** connection settings for the CLI live in `prisma.config.ts` (it loads `.env` via `dotenv`); the app connects through `@prisma/adapter-pg` in `src/lib/prisma.ts`. The client is generated into `src/generated/prisma` (git-ignored; `npm install` regenerates it). `prisma migrate dev`/`reset` no longer seed or generate on their own; the `db:migrate` and `db:reset` scripts do it for you.
- `npm audit` reports no known vulnerabilities as of the Next 16 / Prisma 7 upgrade. An npm `overrides` entry pins Zod for `@vercel/blob`'s dependencies to the patched version.
