# MridaCraft — Deployment Guide

Two separate apps, hosted as two separate Render **Web Services**:

- `backend/` — Express + MongoDB API, Google OAuth, Razorpay, ImageKit.
- `frontend/` — TanStack Start storefront (built to run as a plain Node server).

Auth is **Google Sign-In only**. There is no email/password login anywhere.

---

## 0. Before you start — accounts you need

| Service | Why | Link |
|---|---|---|
| MongoDB Atlas (free tier is fine) | Database | https://www.mongodb.com/cloud/atlas/register |
| Google Cloud Console | "Sign in with Google" | https://console.cloud.google.com/apis/credentials |
| ImageKit (free tier) | Product image hosting | https://imagekit.io |
| Razorpay (optional) | Online card/UPI payments — skip this and the store just offers Cash on Delivery | https://dashboard.razorpay.com/app/keys |
| Render | Hosting both services | https://render.com |

---

## 1. MongoDB Atlas

1. Create a free cluster.
2. Database Access → add a user with a username/password.
3. Network Access → add `0.0.0.0/0` (allow from anywhere) so Render can connect.
4. Get your connection string from "Connect → Drivers". It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mridacraft?retryWrites=true&w=majority
   ```
   This is your `MONGO_URI`.

---

## 2. Google OAuth credentials

1. Go to Google Cloud Console → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID → Web application**.
3. You'll need your Render URLs for step 4, so it's fine to do this *after* you've deployed the backend once and know its URL (Render gives you the URL as soon as the service is created, before the first deploy even finishes).
4. Under **Authorized redirect URIs**, add:
   ```
   https://<your-backend-service>.onrender.com/api/auth/google/callback
   ```
5. Copy the **Client ID** and **Client Secret** — these are `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. If prompted, configure the OAuth consent screen (External, add your email as a test user if the app is in "Testing" mode).

---

## 3. ImageKit

1. Sign up, then go to **Developer options**.
2. Copy the **Public key**, **Private key**, and **URL endpoint**.

---

## 4. Razorpay (optional)

1. Sign up, go to **Settings → API Keys**, generate a key pair.
2. If you skip this, leave `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` blank in the backend env — the checkout page will simply show only "Cash on Delivery" (attempting online payment without keys returns a clean error asking the shopper to use COD instead).

---

## 5. Deploy the backend on Render

1. Push the `backend/` folder to its own GitHub repo (or push both folders to one repo and use Render's "Root Directory" setting to point at `backend/`).
2. On Render: **New → Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** `backend` (if using a monorepo)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free is fine to start
4. Add these **Environment Variables** (Render dashboard → Environment):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | from step 1 |
   | `JWT_SECRET` | any long random string (e.g. generate with `openssl rand -hex 32`) |
   | `ADMIN_EMAIL` | the Gmail address that should become an admin automatically the first time it signs in |
   | `FRONTEND_URL` | your frontend's Render URL, e.g. `https://mridacraft-frontend.onrender.com` (**no trailing slash**) |
   | `BACKEND_URL` | this backend's own Render URL, e.g. `https://mridacraft-backend.onrender.com` (**no trailing slash**) |
   | `GOOGLE_CLIENT_ID` | from step 2 |
   | `GOOGLE_CLIENT_SECRET` | from step 2 |
   | `IMAGEKIT_PUBLIC_KEY` | from step 3 |
   | `IMAGEKIT_PRIVATE_KEY` | from step 3 |
   | `IMAGEKIT_URL_ENDPOINT` | from step 3 |
   | `RAZORPAY_KEY_ID` | from step 4 (optional) |
   | `RAZORPAY_KEY_SECRET` | from step 4 (optional) |

   Render sets `PORT` automatically — you don't need to add it.

5. Deploy. Once it's live, go back to Google Cloud Console (step 2) and make sure the redirect URI matches this service's real `.onrender.com` URL exactly.
6. **Optional:** seed a few demo products so the storefront isn't empty. In the Render dashboard, open a **Shell** on the backend service and run:
   ```
   npm run seed
   ```

---

## 6. Deploy the frontend on Render

1. Push `frontend/` the same way (its own repo, or same repo with Root Directory set to `frontend`).
2. On Render: **New → Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** `frontend` (if using a monorepo)
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add this **Environment Variable**:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your backend's Render URL from step 5, e.g. `https://mridacraft-backend.onrender.com` (**no trailing slash**) |

   > `VITE_API_URL` is baked in at **build time**, not read at runtime. If you ever change it, you must trigger a new deploy (not just a restart) for it to take effect.

5. Deploy.

---

## 7. Wire the two together (the part people usually forget)

Both services reference each other's URLs. After both are deployed once and you have their real `.onrender.com` addresses:

1. **Backend → `FRONTEND_URL`**: set to the frontend's real URL. (Used for CORS and for redirecting back after Google login.)
2. **Backend → `BACKEND_URL`**: set to the backend's own real URL. (Used to build the Google OAuth callback link.)
3. **Frontend → `VITE_API_URL`**: set to the backend's real URL.
4. **Google Cloud Console → Authorized redirect URIs**: must contain exactly `https://<backend-url>/api/auth/google/callback`.

If any of these four don't match exactly (including no trailing slash), you'll see either a CORS error in the browser console or a Google "redirect_uri_mismatch" error. After changing any env var, **redeploy** that service (Render → Manual Deploy) rather than just restarting.

---

## 8. Local development

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in the values from steps 1–4, using http://localhost:3000 / :5173
npm run seed             # optional demo products
npm run dev               # http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev               # http://localhost:5173 (or whatever port it prints)
```

For local Google OAuth to work, add `http://localhost:3000/api/auth/google/callback` as an additional Authorized redirect URI in Google Cloud Console, and set `FRONTEND_URL=http://localhost:5173` / `BACKEND_URL=http://localhost:3000` in the backend `.env`.

---

## 9. How to become an admin

Whichever Gmail address you set as `ADMIN_EMAIL` on the backend automatically gets `role: "ADMIN"` the first time it signs in with Google. Admins see an "Admin dashboard" link in the navbar (`/admin`) with:
- **Overview** — revenue, order, product and customer stats
- **Products** — create/edit/delete, multi-image upload
- **Orders** — view every order, update delivery status
- **Customers** — view all registered users and their saved addresses

To promote a second person later, either change `ADMIN_EMAIL` and have them log out/in again, or directly edit their user document in MongoDB Atlas and set `role: "ADMIN"`.

---

## 10. What's intentionally *not* included

- **Email/password login** — removed per your request; Google Sign-In only.
- **Server-side cart persistence** — the cart lives in the browser (`localStorage`) until checkout, same as before. This is standard for most storefronts and keeps guest browsing fast; only checkout requires being signed in.
- **Product reviews UI** — the schema has `rating`/`reviewCount` fields ready, but there's no review-submission flow. Worth adding later if you want it.
- **Email notifications** (order confirmation, shipping updates) — not wired up. Could be added with something like Resend or Nodemailer + Gmail SMTP.

---

## 11. Fixes made to your original backend

- Broken imports and a route-registration typo (`route.get` → `router.get`) that would have crashed on boot.
- Plaintext password comparison — moot now since password auth was removed entirely in favor of Google OAuth.
- Admin order-management routes existed in a controller but were never registered on any router — now wired up under `/api/orders/admin/all`.
- No global error handler / 404 handler — added.
- No CORS credentials handling for cross-origin cookies — added (`credentials: true` + explicit `FRONTEND_URL` origin, required for the auth cookie to work once frontend and backend live on different Render subdomains).
