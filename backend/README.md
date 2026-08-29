# Agro Organica — Backend (Express + TypeScript + MongoDB)

Replaces the old browser `localStorage` persistence with a real database +
API, adds validated image/PDF uploads, and adds a single-admin auth system
with SMS OTP (via bulksmsbd.net) for password reset/change and a login
history log.

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

- `MONGODB_URI` — your MongoDB connection string (local or Atlas).
- `JWT_TOKEN` — a long random secret (e.g. `openssl rand -hex 32`).
- `CLIENT_URL` — the URL your Next.js frontend runs on (for CORS + cookies).
- `BULKSMS_API_KEY` / `BULKSMS_SENDER_ID` — your bulksmsbd.net credentials.
  Without these set, OTP SMS is **logged to the console instead of sent**
  (so you can develop/test without real SMS credit) — the flow still works.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_PHONE`, `ADMIN_NAME` — the
  **one** admin account allowed to log in, created by the seed script below.
  `ADMIN_PHONE` is where all OTP codes (password reset / change) are sent —
  make sure it's a real, reachable Bangladeshi number.

## 2. Create the admin account (run once)

```bash
npm run seed
```

This reads `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_PHONE` from `.env`
and creates exactly one `Admin` document. **Only this username + password
can log in** — there is no public registration endpoint anywhere in the
API. Running `npm run seed` again is safe: if the account already exists it
does nothing (it will never silently overwrite a password you've since
changed from the admin panel).

To change the password afterwards, log in and use **Admin → Settings →
Change Password** — this requires the current password AND an OTP sent to
`ADMIN_PHONE`, valid for 5 minutes, with a resend option.

## 3. Run

```bash
npm run dev      # ts-node + nodemon, auto-restarts on change
# or
npm run build && npm start   # compiled JS
```

Server listens on `PORT` (default `5000`). Health check: `GET /api/health`.

## API overview

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/content` | public | Full site content (home grid, brands, company profile, products, investor relation, media, messages) — one document, mirrors the old localStorage blob |
| `PUT /api/content` | admin | Save changes from the admin panel |
| `POST /api/content/messages` | public | Contact form submission |
| `DELETE /api/content/messages/:id` | admin | Delete a message |
| `GET /api/footer` | public | Dynamic footer social links |
| `PUT /api/footer` | admin | Update social links (icon + URL); Quick Links stay static in the frontend |
| `GET /api/assets?usage=product` | admin | List uploaded files for the shared Image Library (filterable by usage) |
| `POST /api/upload/image?usage=...` | admin | Validated image upload (see below) |
| `POST /api/upload/pdf` | admin | Validated PDF upload (investor relation) |
| `DELETE /api/upload?url=...` | admin | Delete one uploaded file from disk |
| `POST /api/upload/bulk-delete` | admin | Delete many uploaded files at once (e.g. clearing demo images) |
| `POST /api/auth/login` | public | `{ username, password }` → sets httpOnly cookie |
| `POST /api/auth/logout` | admin | Clears session cookie |
| `GET /api/auth/me` | admin | Current admin profile (masked phone) |
| `POST /api/auth/forgot-password` | public | `{ username }` → sends OTP to that admin's phone |
| `POST /api/auth/forgot-password/resend` | public | Resend OTP (30s cooldown) |
| `POST /api/auth/forgot-password/verify` | public | `{ username, otp, newPassword }` |
| `POST /api/auth/change-password/start` | admin | `{ currentPassword }` → sends OTP |
| `POST /api/auth/change-password/resend` | admin | Resend OTP |
| `POST /api/auth/change-password/verify` | admin | `{ otp, newPassword }` |
| `GET /api/auth/login-history` | admin | Last 100 logins: IP, browser, OS, device model, success/fail |
| `GET /api/sms/balance` | admin | Remaining bulksmsbd.net SMS credit |

Auth uses an **httpOnly cookie** (not localStorage/sessionStorage) so the
JWT is never reachable from client-side JS.

## Image upload validation

Every image slot has a size/dimension/aspect-ratio preset in
`src/config/uploadPresets.ts`, enforced server-side with `sharp` (real pixel
dimensions are checked, not just the filename/extension):

| Usage | Recommended | Max size |
|---|---|---|
| `home-grid` | 1600×1067px (3:2) | 5MB |
| `brand-logo` | 800×400px PNG (2:1) | 2MB |
| `product` | 1000×1000px (1:1) | 5MB |
| `media-gallery` | 1920×1200px (16:10) | 8MB |
| `profile` | 600×600px (1:1) | 3MB |
| `achievement` | 1200×840px | 5MB |
| `navbar-logo` | 300×80px (~3.75:1 wide) | 1MB |

## Image Library & bulk Excel import

`GET /api/assets` backs a shared **Image Library** in the admin panel
(`/admin/image-library`): upload images there once, filter by usage, and
copy each file's URL. Every image uploaded through `/api/upload/image` is
also recorded in an `Asset` document (see `src/models/Asset.ts`), so the
library always reflects what's actually on disk — deleting a file (via
`DELETE /api/upload` or `POST /api/upload/bulk-delete`) removes its `Asset`
record too.

This library exists specifically to support **bulk-adding Products and
Brands from Excel**: the admin panel's "Bulk Add" panels let you download
an `.xlsx` template, fill in rows (including an Image URL column), and
upload it back — the frontend parses it client-side (via the `xlsx`
package) and calls `PUT /api/content` with the new items. Paste URLs
copied from the Image Library into that column so each row points at a
real, already-validated image.

These same numbers are shown to the admin in the upload UI before they pick
a file, and re-validated here — so nothing under-sized or oddly-cropped
that would look broken/blurry on phones ever gets saved.

## Notes

- Demo/seed images ship as inline SVG `data:` URIs (not real files) so a
  fresh database has no orphan files — deleting/replacing them in the admin
  panel just removes them from the content document. Real uploaded images
  live under `backend/uploads/` and are served at `/uploads/...`.
- The `bulksmsbd` SMS controller you shared originally is preserved as-is
  in spirit — see `src/utils/sms.ts` — and is reused for both admin OTPs
  and the `/api/sms/balance` check.
