# YatraCab 🛕

A **trust-first cab-booking platform for temple / pilgrimage travel** across the Rajasthan temple circuit (Khatu Shyam Ji, Salasar Balaji, Sawariya Seth, Mehandipur Balaji, Rani Sati Dadi).

Two booking modes in one app:

- **Fixed-Route** — the platform publishes a set fare per route & vehicle. No negotiation.
- **Ride Alert (reverse bidding)** — the customer posts a trip, verified drivers submit **blind** quotes, and the customer picks on price, rating & vehicle.

Revenue = a transparent **~10% Booking & Safety Fee** collected online in advance and retained by the platform; the ride fare is paid in cash to the driver (keeping YatraCab out of heavy payment-aggregator regulation).

Built with **MongoDB · Express · React · Node.js · Socket.io**, per the YatraCab TRD & PRD.

---

## Architecture

A single npm-workspaces monorepo with **two backend services**, a **shared core**, a **shared design system**, and **three React portals**.

```
YatraCab/
├─ core/                     @yatracab/core — shared models, auth, services, utils
│  └─ src/{config,models,middleware,services,utils}
├─ server-app/              Customer + Driver API (modular monolith + Socket.io) :5000
│  └─ src/modules/{auth,shared,customer,driver}
├─ server-admin/            Independent, HARDENED Admin/Ops API :5100
│  └─ src/modules/{auth,dashboard,drivers,customers,bookings,routes,reports}
├─ apps/
│  ├─ design-system/        @yatracab/ui — Tailwind preset + UI kit + API/auth client
│  ├─ customer/             Customer portal (Vite/React) :5173  (teal accent)
│  ├─ driver/               Driver portal    (Vite/React) :5174  (indigo accent)
│  └─ admin/                Admin dashboard  (Vite/React) :5175  (blue accent)
├─ scripts/{dev-db.js, seed.js}
└─ docker-compose.yml       MongoDB (+ mongo-express)
```

**Why this split** — customer & driver share live state (a driver's bid must reach a customer in real time), so they run as one process with one Socket.io server. The **admin** service is deliberately separate and hardened (its own process, stricter rate limits, its own CORS allowlist, admin-only auth) so ops tooling is isolated from the public apps.

- **Auth:** phone + OTP, JWT **access (in-memory) + refresh (httpOnly cookie)**, role-based access control (`customer` / `driver` / `admin`) enforced by shared middleware and on the Socket.io handshake.
- **OTP delivery:** Gmail SMTP (nodemailer + App Password) behind a pluggable channel — falls back to logging/returning the code in dev so it runs with **zero credentials**. (Future: WhatsApp / SMS text OTP.)
- **Payments:** a **mock gateway** by default (auto-verifiable, no keys) with a real **Razorpay** adapter that activates when you add keys.
- **Number masking, notifications, maps:** mocked services behind clean interfaces, ready to wire to Exotel / FCM / Google Maps.

---

## Quick start

**Prerequisites:** Node.js 18+ (tested on 24). MongoDB is optional — a zero-install dev DB is included.

```bash
# 1. install everything (one command — npm workspaces)
npm install

# 2. create your env file
cp .env.example .env        # sensible dev defaults already filled in

# 3. start a database  (choose ONE)
npm run db                  # zero-install: a real mongod via mongodb-memory-server on :27017
#   …or run your own MongoDB / set MONGODB_URI to Atlas in .env, then skip this.

# 4. seed demo data (routes, accounts, sample rides) — in a new terminal
npm run seed

# 5. run everything (2 APIs + 3 portals) — in a new terminal
npm run dev
```

Then open:

| Portal | URL | Demo login (OTP `123456`) |
| --- | --- | --- |
| **Customer** | http://localhost:5173 | phone `9000000010` (Radha) |
| **Driver**   | http://localhost:5174 | `9000000020` (approved) · `9000000023` (pending) |
| **Admin**    | http://localhost:5175 | phone `9000000001` |

> All seeded accounts accept the fixed dev OTP `123456`. New sign-ups get a one-time code shown in the server console (and in the UI in dev). Set `GMAIL_USER` + `GMAIL_APP_PASSWORD` in `.env` to email real OTPs.

> **Testing multiple portals at once:** the refresh cookie is shared across `localhost` ports, so use separate browser profiles / incognito windows for each portal (or just log out before switching). Each portal already rejects sessions that don't match its role. In production the portals live on separate domains and never collide.

### Handy scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | All 2 APIs + 3 portals together (via `concurrently`) |
| `npm run dev:backend` | Just `server-app` + `server-admin` |
| `npm run dev:frontend` | Just the three portals |
| `npm run dev:app` / `dev:admin-api` | A single backend |
| `npm run dev:customer` / `dev:driver` / `dev:admin` | A single portal |
| `npm run db` | Shared zero-install dev MongoDB |
| `npm run seed` | Reset + seed the database |
| `npm run build` | Production build of all three portals |

---

## Core flows (all working end to end)

- **Fixed booking:** pick route + vehicle → see fare + fee breakdown → pay advance (mock) → ride **confirmed**, a nearby approved driver is auto-assigned.
- **Reverse bidding:** post a Ride Alert → drivers get it live on their route → blind quotes stream to the customer → accept one → pay fee → confirmed with that driver.
- **Driver:** onboard (vehicle + routes + KYC docs) → admin approves → go online → bid / accept assignments → start → share live location → complete (collect cash) → rate.
- **Admin:** verify drivers (doc-by-doc), manage the route × vehicle fare matrix + floor / fair-range / fee / surge, monitor bookings, force-cancel + refund + penalise, and read revenue / rides / leaderboard reports.
- **Cancellation & refunds:** server-side refund policy (free-cancel window minus ₹50, else forfeit; driver no-show = full refund).
- **Real-time:** Socket.io rooms per ride / route / user for live bids, assignments, and driver location.

## Data model (MongoDB)

`User` (role-based) · `Driver` (1:1, KYC + geo + stats) · `Route` (fare matrix + bidding guardrails) · `Ride` (both modes, status state machine) · `Bid` (blind, unique per driver/ride) · `Payment` (advance fee only) · `Rating` (two-way) · `Otp` (TTL store).

## Going to production

- Point `MONGODB_URI` at MongoDB Atlas.
- Set `PAYMENT_PROVIDER=razorpay` + Razorpay keys.
- Set `GMAIL_USER` / `GMAIL_APP_PASSWORD` (or swap in the OTP channel of your choice).
- Give each service its own env / secret manager; host the portals on separate domains.
- Wire the Exotel / FCM / Google Maps adapters in `core/src/services/`.

---

_Prepared for Lalit · threely.io. Companion to the YatraCab PRD & TRD._
