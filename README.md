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
│   ├── seed.ts                # 8 users, 19 properties (Accra, Tema, Kumasi, Takoradi), viewings, reviews, reports, wishlists, 60 days of daily views
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
│   │   ├── dashboard/tenant            # viewings (+ reviews) + wishlist
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
| `POST /api/reviews` | Tenant | `{ viewingRequestId, landlordRating: 1-5, accuracyRating: 1-5, comment? }` — confirmed viewings dated today or earlier, once each |
| `PATCH /api/reviews/:id` | Author / reviewed landlord / Admin | Author: `{ landlordRating?, accuracyRating?, comment? }`; landlord: `{ landlordReply }`; admin: `{ isHidden }` |
| `DELETE /api/reviews/:id` | Author/Admin | |
| `POST /api/reports` | Any signed-in user except the owner | `{ propertyId, reason: "SCAM" \| "NOT_AVAILABLE" \| "WRONG_DETAILS" \| "DUPLICATE" \| "OFFENSIVE" \| "OTHER", details? }` (details required for OTHER); one open report per person per listing, 10 per day |
| `PATCH /api/admin/properties/:id/reports` | Admin | `{ status: "RESOLVED" \| "DISMISSED", adminNote? }` closes every open report on the listing |
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

The change applies on the next page load: dashboards check the role in the database, not the login cookie.

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

## Saved searches & alerts

- Tenants tap **Save search** on the listings page to save the current filters (page, sort and map view are ignored). Up to 10 per tenant; saving the same search twice is a no-op. Names are generated, e.g. "2 Bedroom Apartment · 2+ beds · East Legon · up to ₵ 4,000".
- When a landlord publishes a listing, every saved search with alerts on is checked (`listingMatches` in `src/lib/saved-searches.ts`, kept in step with the search page's `buildWhere` by a unit test). Matching tenants get an email, **at most one per saved search every 3 hours**; the dashboard shows every new match ("3 new"), counted since the tenant last opened that search.
- Each alert includes a signed one-click unsubscribe link (no login needed) and `List-Unsubscribe` headers, so Gmail/Outlook show their own unsubscribe button.
- API: `GET/POST /api/saved-searches`, `PATCH/DELETE /api/saved-searches/:id`, `GET /api/saved-searches/:id/open`, `GET|POST /api/saved-searches/:id/unsubscribe?token=…`.
- Scale note: matching loads all searches with alerts on each time a listing is published. That's fine for thousands of saved searches; beyond that, move matching to a background job.

## Reviews & ratings

- After a **confirmed** viewing has taken place (its date is today or earlier), the tenant can rate the landlord (1–5) and how accurate the listing was (1–5), with an optional comment, from their dashboard. One review per viewing; the author can edit or delete it.
- The landlord gets an email, sees every review in the **Reviews of you** section of their dashboard and can post one public reply.
- Every landlord has a public profile at `/landlords/:id` (linked from each listing) with their average rating, a star breakdown, their homes and the reviews. Reviewers are shown as first name + initial ("Ama S.").
- Listing pages show the landlord's rating and how accurate *that* listing was rated.
- Admins can hide abusive reviews from the admin view of the landlord dashboard or the profile page; hidden reviews don't count towards averages.
- The review keeps a copy of the listing title, so it survives the listing being deleted.

## Listing insights (landlords)

- **Insights** on each listing in the landlord dashboard opens `/dashboard/landlord/properties/:id/insights`: views, saves and viewing requests for the last 30 days (with the change in views against the 30 days before), a daily views chart with a hover / arrow-key tooltip and a table view, all-time totals, and plain suggestions based on where tenants drop off.
- Views are counted per day in `PropertyViewDay` (UTC, which is Ghana time) by `recordListingView` in `src/lib/insights.ts`, with one `INSERT … ON CONFLICT` so simultaneous first views can't collide. The owner, admins and robots (search engines, WhatsApp/Facebook link previews, Lighthouse, curl…) aren't counted.
- Saves and requests per day come from the existing `SavedProperty` and `ViewingRequest` dates, so they cover the full history.
- Only the listing's landlord and admins can open it; anyone else gets the not-found page.

## Price drops & wishlist emails

- When a landlord lowers the rent, the listing shows **"Price dropped N%"** with the old rent struck through for 30 days (`src/lib/price-drop.ts`). Several cuts in a row keep the original price as "was"; raising the rent back clears it.
- Tenants who saved the home get an email when its rent drops, or when a rented home is marked available again: at most one email per saved home per day, never for hidden or rented listings.
- Tenants switch these emails on or off from **Saved homes** on their dashboard, or with the signed one-click link in each email (also sent as `List-Unsubscribe` headers).
- API: `PATCH /api/wishlist-alerts` `{ wishlistAlerts }` (tenants), `GET|POST /api/wishlist-alerts/unsubscribe?u=…&token=…`.

## Comparing homes

- Every listing card and listing page has a **Compare** button. Up to 3 homes can be picked; a tray at the bottom of the screen shows how many are picked and opens the comparison.
- `/compare?ids=a,b,c` shows the homes side by side: rent, advance, **move-in cost** (advance + agent fee + deposit, from `calculateUpfront` in `src/lib/pricing.ts`) with the lowest marked, size, rooms, furnishing, every amenity any of them has, the landlord's rating and the listing's accuracy rating.
- No account needed: the selection is kept in the browser (`localStorage`) and in the link, so a comparison can be shared. Hidden or deleted listings are left out with a note. The page is not indexed by search engines.

## Reporting listings

- Any signed-in user can report a listing (not their own) from the link under the landlord card: looks like a scam, no longer available, wrong details, duplicate, offensive, or something else (with details). The form also reminds renters never to pay before seeing a home.
- Every admin gets an email, and the listing appears in **Reported listings** at the top of the admin dashboard, most-reported first, with each reason, note and reporter.
- Admins hide the listing if needed and mark the reports **Resolved**, or **Dismiss** them. Landlords never see who reported them. After a report is closed, the same person can report the listing again.
- Listings aren't hidden automatically, so a rival can't take a listing down just by reporting it.

## Search engines & sharing

- **`/sitemap.xml`** (`src/app/sitemap.ts`): home, listings page, region and property-type landing pages that currently have homes, and every public, available listing. Hidden and rented listings are left out. Built on request, so new listings appear without a redeploy.
- **`/robots.txt`** (`src/app/robots.ts`): keeps `/dashboard`, `/api/`, and the sign-in and password pages out of search engines.
- **Share previews:** listing pages set Open Graph and Twitter/X tags with the listing's first photo, price, size, area and advance, so links shared on WhatsApp, Facebook or X show a rich card. Other pages use a branded image generated by `src/app/opengraph-image.tsx`.
- **Structured data** (`src/lib/seo.ts`): listing pages include schema.org `RealEstateListing` JSON-LD (monthly rent as an `Offer` in GHS, rooms, size, approximate location); the home page includes `Organization` and `WebSite` with a site search box.
- **Indexing rules:** simple searches (location, region, type) are indexable with descriptive titles; filtered, sorted, paginated or map views are `noindex, follow` with a canonical link to the simple search; rented listings are `noindex`; dashboards and sign-in pages are `noindex, nofollow`.
- **Share button** on listing pages: the phone's share sheet where supported, otherwise WhatsApp, Facebook and "copy link".
- **Custom domain:** set `APP_URL` (e.g. `https://efiehomes.com.gh`) so links in previews, the sitemap and emails use it; otherwise Vercel's production domain is used. After the site has its final domain, submit `/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

## Accessibility & speed

- **Audited with Lighthouse** (mobile, slow 4G). Accessibility is 100 on the home, listings, listing, login and dashboard pages, and 97 on the map view (remaining items are Leaflet's own tiles and overlapping pins). Best practices are 100.
- **Contrast:** the palette's `stone-500`, `terracotta-600` and `gold-600` are darkened so small text meets WCAG AA (4.5:1) on the cream backgrounds. Use `terracotta-600`, not `500`, for text and for backgrounds behind white text.
- **Dialogs and drawers** use `useDialogFocus` (`src/components/ui/useDialogFocus.ts`): focus moves in on open, Tab stays inside, and focus returns to the opening button on close. All close with Escape.
- **Images:** `SafeImage` adds a `srcset` for Unsplash photos so phones download small versions; pass `sizes`, and `priority` for the main above-the-fold image. This cut page weight by 27–39%.
- **Metadata in `<head>`:** `htmlLimitedBots: /.*/` in `next.config.mjs` makes Next.js put titles, descriptions and share tags in `<head>` for every visitor, not only recognised crawlers.
- **Server region:** `vercel.json` runs functions in Frankfurt (`fra1`), next to the Neon database (also Frankfurt). If your live Neon database is in another region, change `regions` to match: every page makes several database queries, so a cross-continent hop adds up quickly.

## Security

- **Passwords:** bcrypt (cost 12); login gives the same answer for a wrong email or a wrong password.
- **Sessions:** httpOnly, SameSite=Lax JWT cookie (7 days). Each request re-checks the account and its `sessionVersion`, so password changes/resets and "Sign out everywhere" revoke old sessions, and role changes apply immediately.
- **Rate limits** (`src/lib/rate-limit.ts`, stored in the `RateLimitHit` table so they hold across serverless instances):

  | What | Limit |
  |---|---|
  | Failed logins per account | 10 per 15 min (cleared by a successful login) |
  | Failed logins per network | 30 per 15 min |
  | New accounts per network | 10 per hour |
  | "Forgot password" per network / per account | 10 per hour / 3 per hour |
  | Failed reset-link attempts per network | 20 per 15 min |
  | Messages per person per thread | 30 per 10 min |

  Blocked requests get `429` with a `Retry-After` header. The network address comes from `X-Real-IP` / `X-Forwarded-For`, which Vercel sets itself. If you host somewhere else, make sure your proxy overwrites these headers.
- **Headers** (`next.config.mjs`): `frame-ancestors 'none'` + `X-Frame-Options: DENY`, HSTS, `nosniff`, `strict-origin-when-cross-origin` referrer policy, a restrictive `Permissions-Policy`, and no `X-Powered-By`.
- **Uploads:** file type is checked from the bytes, not the name; uploaded files are served with `nosniff`.

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
