# Poster Generator — Family Tree / Friends' Frenzy

A private, internal tool for generating "Family Tree" and "Friends' Frenzy" posters.
Pure client-side app — nothing is uploaded to a server, nothing is stored in a
database. Everything happens in the browser and the final poster is downloaded
directly as a PNG or JPEG.

## What it does

- Two templates: **Family Tree** (Parents → Relatives → Children) and
  **Friends' Frenzy** (up to 8 friends).
- Two orientations: **Portrait** and **Landscape**.
- Editable: main caption, date, secondary caption, promo message (bottom).
- Background image upload with independent **opacity** (faint ↔ solid) and
  **brightness** (dark ↔ bright) controls.
- Per-avatar upload for every role (Father, Mother, Uncle, Aunt, Child #1...,
  Friend #1...). Non-square photos are automatically center-cropped to a
  circle — they never get squished.
- One-click **"Mark all avatars dark"** — fixes the common problem of
  avatars coming out with inconsistent contrast, by applying a uniform
  brightness/contrast filter to every avatar at once.
- Optional **photo frame border** with adjustable color and width.
- Logo upload (falls back to editable text until one is uploaded).
- **Export** to PNG (lossless) or JPEG, downloaded directly — rendered at
  3x resolution so it's print-ready, not just screen-ready.

## Running it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Hot-reloads on save.

## Building for production

```bash
npm run build
```

Outputs a fully static site into `dist/`. This is what you deploy — there is
no server, no API, no environment variables required.

## Project structure

```
src/
├── components/
│   ├── Controls.jsx        # Left sidebar: every form field, upload, and toggle
│   ├── CanvasPreview.jsx    # Right side: the Konva stage, background, export
│   └── AvatarNode.jsx       # One avatar: crop-to-square, circular clip, darken filter
├── utils/
│   ├── gridLayouts.js       # All grid math — positions, max counts, per-orientation tuning
│   └── fileToDataUrl.js     # Converts uploads to base64 (avoids canvas export errors)
├── App.jsx                  # Top-level state shape
├── index.css
└── main.jsx
```

If Anthony ever wants to tweak how many relatives/children/friends are
allowed, or resize the avatars, it's all in one place:
`src/utils/gridLayouts.js` → `GROUP_LIMITS` and the `FAMILY_TUNING` /
`FRIENDS_TUNING` objects. Nothing else needs to change.

## Deploying — Vercel (do this now)

1. Push this folder to a **private** GitHub repo.
2. Go to vercel.com → **Add New Project** → import the repo.
3. Vercel auto-detects Vite. Default build command (`npm run build`) and
   output directory (`dist`) are already correct — no config needed.
4. Once deployed: **Project Settings → Deployment Protection → Password
   Protection**. Turn it on, set one shared password for Anthony and his
   wife. This is the "only for the two of them" requirement from the brief.
5. Share the Vercel URL + password.

Every time you `git push`, Vercel redeploys automatically — there's no
manual redeploy step for future tweaks.

## Deploying — AWS (when you move it to Leimarics' own account)

This app builds to a plain static folder, so the AWS setup is the standard
S3 + CloudFront pattern:

1. **S3 bucket**: create one (e.g. `leimarics-poster-tool`). Run
   `npm run build` locally, then upload the contents of `dist/` (not the
   folder itself — its *contents*) to the bucket root.
2. **CloudFront distribution**: point it at the S3 bucket as an origin
   (use Origin Access Control, not a public bucket). This gets you HTTPS
   and fast global delivery for free-tier-friendly cost.
3. **Route53** (optional): point a subdomain like `tools.leimarics.com` at
   the CloudFront distribution if you want a clean URL instead of the
   default `*.cloudfront.net` one.
4. **Password protection**: S3/CloudFront has no built-in login screen.
   Attach a small **Lambda@Edge** function on the CloudFront *Viewer
   Request* event that checks for an `Authorization: Basic ...` header and
   returns a 401 challenge if it's missing — standard HTTP Basic Auth.
   This is the same effect as Vercel's password protection, just self-hosted.
5. Future redeploys: `npm run build` → `aws s3 sync dist/ s3://your-bucket
   --delete` → CloudFront invalidation (`aws cloudfront
   create-invalidation --distribution-id YOUR_ID --paths "/*"`). Worth
   wrapping in a one-line script once you're on AWS full-time.

## Known limitations (by design, given the 5-day scope)

- No save/load of in-progress posters — it's a single-session tool. If
  Anthony wants drafts saved across sessions later, that's a backend
  add-on (e.g. Supabase), not a rebuild — the frontend doesn't need to
  change for that.
- SVG avatar uploads work, but if an SVG references external assets
  (fonts, images by URL) those won't render on canvas — flag this to
  Anthony if his avatar tool exports linked SVGs rather than embedded ones.
- Relatives are capped at 6 and friends at 8 by `GROUP_LIMITS` — easy to
  raise, just re-check the vertical spacing in `gridLayouts.js` if you do,
  so rows don't start overlapping at high counts.
