# Flatify

A small, private flatmate-coordination web app for **two people**. Four modules:

- **Shopping list** — shared, check-off, suggestion chips from your buying history
- **Chores** — recurring tasks with points, auto-rotation between flatmates, overdue tracking
- **Expenses** — log shared costs, 50/50 or custom split, live "who owes whom" balance, settle-up
- **Pinboard** — shared notes between the two of you, with pinning

Built as a Next.js PWA so you both install it to your phone home screen. Hardcoded to a two-email allowlist — no public signup.

---

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Prisma · Postgres · Auth.js v5 (shared-password credentials, JWT sessions) · Serwist (PWA)

---

## Setup

### 1. Create a Neon Postgres database

1. Sign up at https://neon.tech (free tier).
2. Create a project, copy the **pooled** connection string.

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Generate `AUTH_SECRET`:

```bash
npx auth secret
```

Set `AUTH_ALLOWED_USERNAMES` to exactly two usernames (yours and your flatmate's), comma-separated, and pick a `AUTH_SHARED_PASSWORD` you'll both use to sign in.

### 3. Install + push schema

```bash
npm install
npm run db:push       # creates all tables in Neon
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Type one of the allowed usernames and your shared password to sign in.

To test on your phone over the same Wi-Fi: find your laptop's LAN IP (`ipconfig` on Windows) and visit `http://<that-ip>:3000` on your phone.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. On https://vercel.com → **Add New → Project**, import the repo.
3. Under **Environment Variables**, paste everything from your `.env` (use the **pooled** Neon URL for `DATABASE_URL`).
4. Set `AUTH_URL` to your Vercel domain (e.g. `https://flatify-yours.vercel.app`).
5. Deploy. After the first deploy, run `npm run db:push` once locally against the production URL, or use Neon's SQL editor.

To install the PWA: open the deployed URL in mobile Safari/Chrome → Share → **Add to Home Screen**.

---

## Project layout

```
prisma/schema.prisma           Data model
src/
  auth.ts                      Auth.js config + requireUser()
  proxy.ts                     Route protection (Next.js 16)
  lib/
    db.ts                      Prisma singleton
    money.ts                   cents <-> euro, equal-split math
    users.ts                   allowlist, color assignment, partner lookup
    utils.ts                   cn() helper
  server/
    balance.ts                 computeBalance(meId, partnerId)
    actions/
      shopping.ts              add / toggle / delete / clear / suggestions
      chores.ts                create / complete (rotation) / delete / points
      expenses.ts              create / delete / settleUp
      pinboard.ts              create / update / delete / togglePin
  app/
    (auth)/signin/             Magic-link sign-in page
    (app)/
      layout.tsx               Bottom tab bar
      page.tsx                 Home dashboard
      shopping/                Shopping list
      chores/                  Chores + points
      expenses/                Expenses + balance
      pinboard/                Notes
      settings/                Sign out
    manifest.ts                PWA manifest
    api/auth/[...nextauth]/    Auth.js handler
```

---

## How the money math works

- Amounts are integer cents — never floats.
- `equalSplit(total, payer, other)` gives the payer the larger half on an odd-cent total, so they "eat" the extra cent.
- `computeBalance(meId, partnerId)` = `(total I paid)` − `(sum of my shares)` − `(settlements partner→me)` + `(settlements me→partner)`. Positive means partner owes me; negative means I owe partner. **Settle up** records a settlement of exactly the current balance, zeroing it.

---

## Notes / out of scope for now

- No push notifications yet — Pinboard refreshes on navigation.
- No multi-household / 3+ flatmate support; the schema and split math are deliberately 2-user only.
- No photo attachments on shopping items or expenses (deferred — would use Vercel Blob).
