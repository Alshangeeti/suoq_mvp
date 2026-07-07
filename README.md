# Souq Mauritania — MVP

Cross-border e-commerce for Mauritania. Shop AliExpress/Taobao/1688/Amazon products, pay in MRU via **Bankily** (auto-detected through an SMS gateway), delivered via the Guangzhou warehouse → Nouakchott office.

## Stack
- **Next.js 14** (App Router) — frontend + API routes (no separate backend needed for MVP)
- **Prisma** ORM — SQLite locally, PostgreSQL in production (change one env var)
- **Tailwind CSS** — Arabic RTL default, French toggle
- Deploys to **Vercel**

## Run locally
```bash
npm install
npm run setup        # creates DB + seeds 8 demo products
npm run dev          # http://localhost:3000
```

## Environment variables (.env)
| Var | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally → Postgres URL on production |
| `SMS_WEBHOOK_SECRET` | Shared secret the SMS gateway app must send |
| `ADMIN_KEY` | Key to open /admin and mark orders paid manually |
| `BANKILY_MERCHANT_CODE` | Your merchant code shown to customers at payment |

**Change all secrets before deploying.**

## The Bankily payment flow
1. Customer checks out → order created with unique ref (e.g. `SM-7K2FQ`), status `PENDING_PAYMENT`.
2. Payment page shows: open Bankily → Pay Merchant → your merchant code → exact amount. Page polls every 4s.
3. Customer pays. Your **Android gateway phone** (Nouakchott office) receives the Bankily confirmation SMS.
4. The SMS-forwarder app on that phone POSTs to `/api/sms-webhook`:
```json
{ "message": "<full SMS text>", "secret": "<SMS_WEBHOOK_SECRET>" }
```
5. The webhook parses the amount (+ payer phone if present), matches the oldest pending order with that amount/phone, marks it `PAID` → customer's screen flips to ✅ automatically.

Test it locally:
```bash
curl -X POST http://localhost:3000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -d '{"secret":"change-me-secret","message":"Vous avez recu 850 MRU de 32112233. Ref TX998877"}'
```

## Admin
Visit `/admin`, enter `ADMIN_KEY`. Lists all orders; you can manually mark one paid (backup for when SMS parsing misses).

## Deploy to Vercel (souqmauritania.com)
1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Create a free Postgres DB (Neon or Vercel Postgres). In `prisma/schema.prisma` change `provider = "sqlite"` → `"postgresql"`, set `DATABASE_URL` env var in Vercel.
4. Add `SMS_WEBHOOK_SECRET`, `ADMIN_KEY`, `BANKILY_MERCHANT_CODE` env vars.
5. Run `npx prisma db push && node prisma/seed.js` once against the production DB.
6. Point the SMS gateway app on the Android phone to `https://souqmauritania.com/api/sms-webhook`.

## Next steps after MVP
- Real product catalog via AliExpress Open Platform API (App Key 535648 — finish the OAuth token exchange)
- Product images instead of emoji placeholders
- Telegram bot notifications to the Guangzhou team on new paid orders
- Customer order history / phone-based login
- Split backend to Express on Railway when volume grows
