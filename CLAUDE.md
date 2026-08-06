# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VerifiCARLO is a full-stack Next.js 14 (App Router) platform for vehicle inspection services in Lima, Peru. Originally a vanilla JS landing page, it has evolved into a multi-role platform with booking, payments, inspection reports, blog, and admin/inspector dashboards. All UI text is in Spanish (es-PE).

## Setup

Copy `.env.example` to `.env` and fill in values. Key services: PostgreSQL (DATABASE_URL), NextAuth (NEXTAUTH_SECRET), Google OAuth, Cloudinary, Resend, Culqi, Google Maps, Firebase (push notifications).

## Commands

```bash
npm run dev              # Dev server on http://localhost:3000
npm run build            # prisma generate && next build
npm run lint             # ESLint
npx prisma migrate dev   # Run pending migrations
npx prisma studio        # Visual DB browser
npx tsx prisma/seed.ts   # Seed database
```

No test framework is configured.

## Architecture

### Route Groups & Roles

The app uses Next.js route groups to separate concerns by user role:

- **`app/page.tsx`** — Public landing page. Redirects authenticated users by role (ADMIN → `/admin`, INSPECTOR → `/inspector`, CLIENT → `/perfil`).
- **`app/(auth)/`** — Login, register, forgot/reset password, email verification.
- **`app/(booking)/`** — Booking flow: scheduling (`/agendar`) and payment result pages.
- **`app/(platform)/`** — Client-facing pages: inspections, vehicles, profile, settings.
- **`app/(dashboard)/admin/`** — Admin dashboard: manage users, inspections, bookings, reports, blog, reels, newsletter, legal reviews.
- **`app/(dashboard)/inspector/`** — Inspector dashboard: assigned inspections, schedule config.
- **`app/(dashboard)/mis-inspecciones/`** — Client's own inspection history.
- **`app/(legal)/`** — Terms, privacy policy, refund policy (standalone layouts).
- **`app/blog/`** — Public blog with categories.

### Layout System

`app/layout.tsx` wraps everything in `<Providers>` (NextAuth session + Toast) and `<LayoutShell>`.

`app/layout/LayoutShell.tsx` is the smart layout router — it checks the pathname and session role to decide which chrome to show:
- Admin/inspector routes → no shell (they have their own layouts)
- Client platform routes → no shell (route group layout handles it)
- Logged-in client on public pages → minimal header
- Visitors → full landing layout (banner, navbar, footer, WhatsApp button)

### Data Layer

- **Prisma** with PostgreSQL (`lib/db.ts` exports the singleton client)
- Schema at `prisma/schema.prisma` — key models: User, Booking, Vehicle, VehicleInspection, InspectionReport, BlogPost, Reel
- Three roles: `CLIENT`, `INSPECTOR`, `ADMIN`
- Booking statuses flow: `PENDING_PAYMENT → PENDING_VERIFICATION → PAID → COMPLETED`
- All dates/times use `America/Lima` timezone (UTC-5). Date logic uses `date-fns` and `date-fns-tz`.

### Auth

- **NextAuth v4** with Google OAuth + credentials (email/password with bcrypt)
- Config in `lib/auth.ts`, API route at `app/api/auth/[...nextauth]/`
- Email verification flow via Resend

### Payments

- **Culqi** (Peruvian payment gateway) for card payments and Yape
- Alternative payments: bank transfer, Yape/Plin (manual verification by admin)
- Webhook at `app/api/webhooks/culqi/`

### API Routes

All API routes are in `app/api/`. Admin-only endpoints live under `app/api/admin/`. Auth is checked via `getServerSession(authOptions)` from `lib/auth.ts` — there is no middleware-level auth. Rate limiting uses an in-memory store (`lib/rate-limit.ts`). Input validation uses **Zod** (v4).

### Key Integrations

- **Cloudinary** — image/PDF uploads (reports, blog, reels)
- **Resend** — transactional emails (`lib/email/`)
- **Google Maps API** — inspection location display
- **Culqi** — payment processing (webhook signature verified via RSA)
- **Firebase Admin** — push notifications (`lib/push-notifications.ts`)

### Component Organization

Components live in `app/components/ComponentName/` with co-located `.module.css`. Landing-specific sections live in `app/landing/`.

### Key Dependencies

`next-auth` v4, `prisma` v5, `zod` v4, `date-fns` v4, `zustand` (client state), `react-quill-new` (rich text editor), `@phosphor-icons/react` + `lucide-react` (icons), `framer-motion` (animations), `@splidejs/splide` (carousels).

### Shared Libraries

- `lib/scheduling/` — Availability calculation, inspector assignment, booking constants
- `lib/vehicle-inspection/` — State machine for inspection flow, mechanic assignment, notifications
- `lib/pdf/` — PDF generation for inspection/legal reports (uses `@react-pdf/renderer`)
- `lib/email/` — Email templates via Resend
- `lib/rate-limit.ts` — In-memory rate limiter for sensitive endpoints
- `lib/auth-jwt.ts` — JWT utilities for external API auth (Flutter app)

### Styling

- **Tailwind CSS** + **CSS Modules** co-located with components
- Legacy `/styles1.css` still referenced — some component styles come from there

### Middleware

`middleware.ts` blocks known scraper bots (saves serverless invocations) and adds security headers. It does NOT handle auth — NextAuth manages that separately.

### Analytics

Layout includes Google Tag Manager, Meta Pixel, and TikTok Pixel via `next/script`.

### Path Aliases

`@/*` maps to project root (tsconfig.json).
