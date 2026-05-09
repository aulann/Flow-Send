Read `CLAUDE.md` and all 6 context files before starting.

# Feature 13 — PWA Manifest

Make the app installable as a Progressive Web App on Android (Chrome, Edge) and iOS (Safari). No service worker or offline support — just the manifest, icons, and meta tags needed for "Add to Home Screen".

---

## Scope

- `public/manifest.json` — web app manifest
- `public/icons/` — PNG icons in required sizes
- `app/layout.tsx` — `<link rel="manifest">`, iOS meta tags, theme-color

No service worker. No offline mode. No caching strategy. Just installability.

---

## Manifest

`public/manifest.json`:

```json
{
  "name": "Flow Send",
  "short_name": "FlowSend",
  "description": "Szybkie przesyłanie plików między urządzeniami bez konta.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F7F6F1",
  "theme_color": "#2B2B28",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- `background_color` — matches `--bg-base`
- `theme_color` — matches `--border-ink` (darkens the browser chrome)
- `display: standalone` — hides browser UI after install
- `maskable` icons — safe zone at center, padding ~20% all sides

---

## Icons

Generate 4 PNGs and place in `public/icons/`:

| File | Size | Purpose |
|------|------|---------|
| `icon-192.png` | 192×192 | Standard Android |
| `icon-192-maskable.png` | 192×192 | Maskable (safe-zone padding) |
| `icon-512.png` | 512×512 | Splash screen / store |
| `icon-512-maskable.png` | 512×512 | Maskable large |

**Design**: simple "FS" logotype on `#F7F6F1` background, `#1A1917` text, using the Cause-style thick sans-serif feel. Or a minimal arrow-up-from-box icon. The exact design is up to the user — placeholder solid-color squares work for testing.

For quick placeholder generation without Figma, use a Node script (see below).

---

## `app/layout.tsx` changes

Add inside `<head>` (via Next.js metadata or direct tags):

### Option A — Next.js Metadata API (recommended)

```tsx
export const metadata: Metadata = {
  // existing fields...
  manifest: "/manifest.json",
  themeColor: "#2B2B28",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FlowSend",
  },
  icons: {
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};
```

### Option B — explicit `<head>` tags (fallback)

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2B2B28" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="FlowSend" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

Use whichever works with the current Next.js 16 version. Check `node_modules/next/dist/docs/` if unsure.

---

## Icon generation script

If no design tool is available, generate placeholder icons with Node + `canvas`:

```js
// scripts/gen-icons.mjs
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function makeIcon(size, maskable, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const pad = maskable ? size * 0.2 : 0;

  ctx.fillStyle = "#F7F6F1";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#1A1917";
  ctx.font = `bold ${size * 0.32}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FS", size / 2, size / 2);

  writeFileSync(outPath, canvas.toBuffer("image/png"));
  console.log("wrote", outPath);
}

makeIcon(192, false, "public/icons/icon-192.png");
makeIcon(192, true,  "public/icons/icon-192-maskable.png");
makeIcon(512, false, "public/icons/icon-512.png");
makeIcon(512, true,  "public/icons/icon-512-maskable.png");
```

Install `canvas` only as devDependency: `npm i -D canvas`. Run once: `node scripts/gen-icons.mjs`. Do NOT commit `canvas` to production deps.

Alternatively, create the PNGs manually in any image editor and drop them into `public/icons/`.

---

## Files to create/update

| File | Action |
|------|--------|
| `public/manifest.json` | Create |
| `public/icons/icon-192.png` | Create (placeholder or real) |
| `public/icons/icon-192-maskable.png` | Create |
| `public/icons/icon-512.png` | Create |
| `public/icons/icon-512-maskable.png` | Create |
| `app/layout.tsx` | Add manifest link + iOS meta tags |

---

## Check when done

- [ ] Chrome DevTools → Application → Manifest — shows name, icons, no errors
- [ ] Chrome DevTools → Lighthouse → PWA — "Installable" passes
- [ ] Android Chrome: "Add to Home Screen" prompt appears (or three-dot menu → Install)
- [ ] iOS Safari: Share → "Add to Home Screen" works, shows correct icon and title
- [ ] After install: opens in standalone mode (no browser bar)
- [ ] `npm run build` passes
