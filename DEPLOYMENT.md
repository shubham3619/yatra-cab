# Deploying YatraCab

Two Node APIs → **Render**. Three React apps → **Netlify**. Database → **MongoDB Atlas**.

Because the frontends (netlify.app) and the APIs (onrender.com) are on different
domains, the app is already configured for cross-site auth (the refresh cookie is
`SameSite=None; Secure` in production, CORS runs off an allow-list, and the API
binds to the host's `PORT`).

Deploy in this order (the URLs feed each other):
**1) Atlas → 2) Render (both APIs) → 3) Netlify (3 sites) → 4) set the APIs' CORS to the Netlify URLs → redeploy the APIs.**

---

## 1. MongoDB Atlas (free)
1. Create a free **M0 cluster** at https://cloud.mongodb.com.
2. **Database Access** → add a user (username + password).
3. **Network Access** → allow `0.0.0.0/0` (Render has dynamic IPs).
4. Copy the connection string:
   `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/yatracab?retryWrites=true&w=majority`
   (keep the `/yatracab` database name).

## 2. Render — the two APIs (free)
Easiest is the included **Blueprint** (`render.yaml`):
1. Render Dashboard → **New → Blueprint** → connect `github.com/shubham3619/yatra-cab`.
2. It creates **yatracab-server-app** and **yatracab-server-admin**. JWT secrets auto-generate; fill the `sync:false` vars:
   - Both services: `MONGODB_URI` = your Atlas string.
   - `yatracab-server-app`: `APP_CLIENT_URLS` (fill after step 3 — the customer + driver Netlify URLs, comma-separated), optional `GMAIL_USER`/`GMAIL_APP_PASSWORD` for real OTP emails.
   - `yatracab-server-admin`: `ADMIN_CLIENT_URLS` (the admin Netlify URL, after step 3).
3. Deploy. Note the two service URLs, e.g.
   - API: `https://yatracab-server-app.onrender.com`
   - Admin API: `https://yatracab-server-admin.onrender.com`

> Manual alternative (no blueprint): New → **Web Service** → root dir `/` →
> Build `npm install` → Start `npm run start --workspace server-app` (and again
> with `server-admin`). Set the same env vars.

**Seed production data once** (optional): locally run
`MONGODB_URI="<your Atlas uri>" npm run seed` to load demo routes/accounts.

## 3. Netlify — three sites (free)
Create **three** sites, all from the same repo, each with a different build.
For each: **Add new site → Import from GitHub → yatra-cab**, leave *base directory* empty (repo root), then:

| Site | Build command | Publish directory |
| --- | --- | --- |
| Customer | `npm install && npm run build --workspace @yatracab/customer` | `apps/customer/dist` |
| Driver | `npm install && npm run build --workspace @yatracab/driver` | `apps/driver/dist` |
| Admin | `npm install && npm run build --workspace @yatracab/admin` | `apps/admin/dist` |

SPA routing is handled (each app ships a `public/_redirects`).

**Environment variables** (Site → Settings → Environment) per site:
- Customer **and** Driver sites:
  - `VITE_APP_API_URL = https://yatracab-server-app.onrender.com/api`
  - `VITE_SOCKET_URL  = https://yatracab-server-app.onrender.com`
- Admin site:
  - `VITE_ADMIN_API_URL = https://yatracab-server-admin.onrender.com/api`

Deploy each. Note the three URLs (e.g. `https://yatracab-rider.netlify.app`, `…-driver…`, `…-ops…`).

## 4. Point the APIs' CORS at Netlify, then redeploy
Back in Render:
- `yatracab-server-app` → `APP_CLIENT_URLS = https://<customer>.netlify.app,https://<driver>.netlify.app`
- `yatracab-server-admin` → `ADMIN_CLIENT_URLS = https://<admin>.netlify.app`

Save → both services redeploy. Done.

---

## What I need from you to finish (if you want me to fill values)
- The **MongoDB Atlas** connection string.
- Once created, the **Render** service URLs and **Netlify** site URLs (so CORS + `VITE_*` line up).
- Optional: **Gmail address + App Password** to send real OTP emails (otherwise dev/log OTP + the seeded `123456` demo OTP are used — turn that off for production by removing `DEV_OTP`).

## Notes / gotchas
- **Render free tier sleeps** after inactivity; the first request (and the initial Socket.io handshake) can take ~30s to wake. Fine for a demo; upgrade for always-on.
- **Payments** are the mock gateway (`PAYMENT_PROVIDER=mock`). Set `PAYMENT_PROVIDER=razorpay` + keys to go live.
- **Same-browser logins:** in production the three portals are separate domains, so the customer/driver/admin sessions no longer collide (that was only a localhost thing).
- Do **not** commit a real `.env` — it's git-ignored; all secrets go in the Render/Netlify dashboards.
