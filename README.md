# SplitSend

**Split courier costs with someone nearby.**

SplitSend is a Nigerian-focused platform that connects people who need to send physical documents abroad (PEBC, WES, transcripts, embassy documents, etc.) so they can share a DHL/FedEx/UPS shipment and split the cost.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup Guide](#setup-guide)
5. [Environment Variables](#environment-variables)
6. [Supabase Setup](#supabase-setup)
7. [Paystack Setup](#paystack-setup)
8. [Admin Setup](#admin-setup)
9. [Deploying to Vercel](#deploying-to-vercel)
10. [Security Notes](#security-notes)
11. [WhatsApp Support](#whatsapp-support)
12. [Completed Features](#completed-features)

---

## How It Works

1. User posts a request (location, document type, destination, courier preference)
2. Platform matches them with similar requests in the same city
3. User clicks **Connect** → both users pay ₦2,000 each
4. After both payments verified server-side, contact details (WhatsApp, full name) are revealed
5. Users coordinate the shipment themselves and split the courier bill

> **SplitSend only facilitates matching. It is not a courier company and does not handle any shipment.**

---

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- **Paystack** (Nigerian payment gateway)
- **Vercel** (deployment)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Signup pages
│   ├── (protected)/     # Dashboard, Post Request, Browse, Matches, Payment callback
│   ├── admin/           # Admin panel (users, requests, matches, payments, messages, reports)
│   ├── api/             # All API routes (server-side only)
│   ├── support/         # Public contact/support page
│   ├── terms/           # Terms of Service
│   └── privacy/         # Privacy Policy
├── components/
│   ├── shared/          # Navbar, Footer, WhatsAppButton, TrustNotice
│   ├── admin/           # Admin-specific components
│   └── landing/         # Landing page sections
├── lib/
│   ├── supabase/        # client.ts (anon key) + server.ts (anon + admin)
│   ├── paystack.ts      # Server-side Paystack integration
│   ├── validation.ts    # Zod schemas for all inputs
│   ├── rateLimit.ts     # In-memory rate limiter
│   ├── matching.ts      # Scoring algorithm
│   └── logger.ts        # Security-aware logger
├── constants/           # Labels, Nigerian states, config
├── middleware.ts        # Route protection + admin guard
└── types/               # TypeScript types

supabase/
├── schema.sql           # Full DB schema + RLS policies
└── migrations/
    └── 002_support_messages.sql   # Support messages table
```

---

## Setup Guide

### 1. Clone and install

```bash
git clone https://github.com/your-org/splitsend.git
cd splitsend
npm install
```

### 2. Create environment file

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` — see [Environment Variables](#environment-variables).

### 3. Set up Supabase

See [Supabase Setup](#supabase-setup).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description | Exposed to client? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ❌ Server only |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key | ✅ Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | ❌ Server only |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook signature secret | ❌ Server only |
| `NEXT_PUBLIC_APP_URL` | Your app base URL | ✅ Yes |
| `ADMIN_USER_IDS` | Comma-separated admin UUIDs | ❌ Server only |
| `NEXT_PUBLIC_ADMIN_WHATSAPP` | Admin WhatsApp number (no +) | ✅ Yes (display only) |
| `APP_SECRET` | Random 32+ char secret | ❌ Server only |

> ⚠️ **Never commit `.env.local` to git.** It is already in `.gitignore`.

---

## Supabase Setup

### 1. Create a project

Go to [supabase.com](https://supabase.com) → New Project.

### 2. Run migrations

In Supabase Dashboard → **SQL Editor**, run these files in order:

```sql
-- 1. Main schema (tables + RLS + triggers)
-- Paste contents of: supabase/schema.sql

-- 2. Support messages table
-- Paste contents of: supabase/migrations/002_support_messages.sql
```

### 3. Get your keys

Dashboard → Project Settings → API:
- Copy **URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 4. Enable Email Auth

Dashboard → Authentication → Providers → Email → Enable.

### 5. Row Level Security

All tables have RLS enabled automatically via `schema.sql`. Verify in:
Dashboard → Database → Tables → (each table) → RLS should show **Enabled**.

---

## Paystack Setup

1. Sign up at [paystack.com](https://paystack.com)
2. Dashboard → Settings → API Keys:
   - Test public key → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - Test secret key → `PAYSTACK_SECRET_KEY`
3. For webhooks (optional for MVP): Settings → Webhooks → Add your URL:
   `https://yourdomain.com/api/payments/webhook`

> Use **test keys** (`pk_test_`, `sk_test_`) during development. Switch to live keys for production.

---

## Admin Setup

### 1. Create your account

Sign up normally at `/signup` with your email.

### 2. Get your user UUID

In Supabase Dashboard → Authentication → Users → find your email → copy the **UUID**.

### 3. Set admin role in DB

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'your-uuid-here';
```

### 4. Add to env

```
ADMIN_USER_IDS=your-uuid-here
```

For multiple admins:
```
ADMIN_USER_IDS=uuid1,uuid2,uuid3
```

### 5. Access admin panel

Go to `/admin` — you'll now have access.

---

## Deploying to Vercel

### 1. Push to GitHub (private repo recommended)

```bash
git init
git remote add origin https://github.com/your-org/splitsend.git
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import on Vercel

[vercel.com](https://vercel.com) → New Project → Import from GitHub.

### 3. Add environment variables

Vercel Dashboard → Project → Settings → Environment Variables.

Add **all** variables from `.env.example` with real values.

Mark sensitive variables (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `APP_SECRET`) for **Production** only.

Set `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g. `https://splitsend.vercel.app`).

### 4. Deploy

Vercel auto-deploys on every push to `main`.

---

## Security Notes

- **No secrets in code.** All credentials are in environment variables.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) is used only in server-side API routes — never in client components.
- **Row Level Security** is enabled on every Supabase table. Users can only read/write their own records.
- **Contact details** (WhatsApp, full name) are only revealed after both payments are verified server-side — never based on frontend state.
- **Paystack verification** always happens on the server. The frontend only receives an authorization URL; it never controls payment success logic.
- **Admin routes** are protected by both middleware and server-side checks (double enforcement).
- **Input validation** uses Zod on all API routes.
- **Rate limiting** is applied to all sensitive endpoints.
- **Admin WhatsApp number** is stored only in `NEXT_PUBLIC_ADMIN_WHATSAPP` — never in any database table.
- **GitHub:** Enable Dependabot (Security tab) and secret scanning on your private repo.

---

## WhatsApp Support

Admin WhatsApp: `+2348168543901`
Link: `https://wa.me/2348168543901`

The WhatsApp button appears on:
- Footer (all pages)
- `/support` contact page
- User Dashboard
- Match detail page
- Payment screen
- FAQ section

To change the admin number, update `NEXT_PUBLIC_ADMIN_WHATSAPP` in your environment variables — no code change needed.

---

## Completed Features

- ✅ Landing page with all sections
- ✅ Login & Signup (Supabase Auth)
- ✅ Post Request form (full validation)
- ✅ Browse page with smart match scoring + filters
- ✅ Connect flow (creates match record)
- ✅ Payment initialization (Paystack, server-side)
- ✅ Payment verification (server-side, prevents fraud)
- ✅ Contact reveal after both payments verified
- ✅ Payment callback page (auto-verifies on return from Paystack)
- ✅ User Dashboard (requests, matches, notifications)
- ✅ Notifications page
- ✅ Match detail page with report + pay buttons
- ✅ Report Issue modal (5 reason types)
- ✅ Support/Contact page with form + WhatsApp
- ✅ WhatsApp button everywhere (footer, dashboard, match, payment)
- ✅ Trust Notice banners
- ✅ Admin panel: Overview, Users, Requests, Matches, Payments
- ✅ Admin Support Messages inbox (Open/Resolved/Ignored)
- ✅ Admin Reports inbox with WhatsApp reply
- ✅ Terms of Service page
- ✅ Privacy Policy page
- ✅ Full RLS security policies
- ✅ Rate limiting on all API routes
- ✅ Input validation (Zod) on all endpoints
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ `.env.example` and `.gitignore`
