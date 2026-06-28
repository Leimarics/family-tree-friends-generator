# Poster Generator — Family Tree / Friends' Frenzy

A premium, interactive web tool for generating "Family Tree" and "Friends' Frenzy" posters. Everything runs client-side inside the browser—drafts persist automatically, and files are exported directly to PNG or JPEG at print-ready 3x resolution.

**Live Demo:** [https://family-tree-friends-generator.vercel.app/](https://family-tree-friends-generator.vercel.app/)

---

## Key Features

- **Double Template & Orientation Support**: Generates **Family Tree** and **Friends' Frenzy** layouts in either **Portrait** or **Landscape** orientations.
- **LocalStorage State Persistence**: Canvas inputs, captions, background options, and uploaded avatars are saved automatically. Refreshes won't lose your work.
- **Collapsible Responsive Sidebar**: Collapses completely on desktop to expand the preview workspace to 100% viewport width, and transforms into a responsive overlay panel on mobile viewports.
- **Draggable & Scalable Logo Node**: Upload a logo image or use custom text, and select it to drag, resize, or scale it dynamically anywhere on the canvas using a Konva Transformer.
- **Smart Orientation Clamping**: Boundary constraints prevent the logo from rendering off-screen or getting lost when switching between templates or orientations.
- **Advanced Interactive Canvas Controls**:
  - **Dynamic Scaling**: Canvas automatically scales to fit available screen space via a `ResizeObserver`.
  - **Zoom controls**: Floating zoom menu with presets, slider, and quick-fit button supporting 10% to 200% zoom.
  - **Drag-to-Pan**: Click and drag to slide around a zoomed-in canvas.
  - **Double-click / Double-tap zoom**: Instantly toggles between fit-to-screen and 100% manual size.
  - **Mobile Touch Gestures**: Supports touchscreen multi-touch pinch-to-zoom (with optimized 3x sensitivity multiplier) and double-tap detection.
  - **Scroll-safe centering**: Uses margin-auto alignment so canvas is centered when small but fully scrollable without clipping when zoomed in.
- **Avatar Fine-Tuning**: Non-square uploaded avatars are center-cropped to circles. Features an editable label system with dynamic placeholders and a "Mark all avatars dark" contrast toggle.
- **Start Fresh Mechanism**: A "Start Fresh (Clear Memory)" option resets all custom inputs, settings, and coordinates back to pristine default center layouts.

---

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

Outputs a fully static site into `dist/`. This is what you deploy — there is no server, no API, no environment variables required.

---

## Project structure

```
src/
├── components/
│   ├── Controls.jsx        # Left sidebar: inputs, layout choices, and export panel
│   ├── CanvasPreview.jsx   # Right side: Konva stage, scaling, panning, zoom, and Transformer
│   └── AvatarNode.jsx      # One avatar slot: crop-to-square, circular clip, contrast filters
├── utils/
│   ├── gridLayouts.js      # Layout mathematics — coordinates, limits, and orientation tuning
│   └── fileToDataUrl.js    # Base64 helper for image uploads
├── App.jsx                 # Central application state & localStorage synchronization
├── index.css               # Core styling and Tailwind customization
└── main.jsx
```

To adjust the spacing parameters or limits of relative, child, or friend avatars, edit `src/utils/gridLayouts.js`.

---

## Deploying to Vercel

1. Push this folder to a **private** GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Vercel auto-detects Vite. Default build command (`npm run build`) and output directory (`dist`) are already correct — no config needed.
4. **Password protection**: Under Vercel project settings, turn on Password Protection to ensure only authorized users (e.g. clients) can access the live generator.

## Deploying to AWS (S3 + CloudFront)

1. **S3 bucket**: Create a bucket and sync the build directory: `aws s3 sync dist/ s3://your-bucket --delete`
2. **CloudFront**: Attach a distribution pointing to S3 using Origin Access Control (OAC) to enable SSL and fast delivery.
3. **Lambda@Edge**: Attach a lightweight function on the *Viewer Request* event to handle HTTP Basic Authentication for password protection.

---

## Known limitations (by design)

- SVG avatar uploads work, but if an SVG references external assets (fonts, images by URL), those won't render on the canvas. Ensure SVGs export with embedded assets rather than linked ones.
- Relatives are capped at 6 and friends at 8 by `GROUP_LIMITS` (adjustable in `gridLayouts.js`).
