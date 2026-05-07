Read `CLAUDE.md` and all 6 context files before starting.

# Feature 01 — Project Setup & Design System

Bootstrap the Next.js 16 project, install all dependencies, configure Tailwind v4, initialize shadcn/ui, and establish the full design system from `ui-context.md`. Nothing functional yet — this feature is purely foundation.

---

## 1. Create the project

```bash
npx create-next-app@16 flow-send --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"
```

Use the App Router. No `src/` directory.

---

## 2. Install dependencies

```bash
npm install simple-peer @types/simple-peer
npm install react-qr-code
npm install html5-qrcode
npm install @phosphor-icons/react
npm install zustand
npm install partykit
npm install geoip-lite @types/geoip-lite
npm install partysocket
```

shadcn/ui components to add via CLI after init:

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input textarea scroll-area separator badge
```

When prompted by shadcn CLI:
- Style: `base-nova`
- Base color: neutral
- CSS variables: yes

---

## 3. Folder structure

Create these empty directories and placeholder files so the project compiles:

```
app/
  api/
    device/
      route.ts       ← stub: return { deviceType: "desktop", deviceName: "Unknown", location: { city: "", country: "" } }
party/
  server.ts          ← stub: export default class Server {}
lib/
  session.ts         ← stub: export function generateSessionCode(): string { return "" }
  device.ts          ← stub
  geolocation.ts     ← stub
  transfer.ts        ← stub
  qr.ts              ← stub
hooks/
  use-peer-connection.ts   ← stub
  use-session.ts           ← stub
  use-transfer.ts          ← stub
  use-qr-scanner.ts        ← stub
store/
  session.store.ts         ← stub
  transfer.store.ts        ← stub
components/
  ui/               ← shadcn output, do not edit
  landing/          ← empty
  send/             ← empty
  receive/          ← empty
  shared/           ← empty
types/
  transfer.ts       ← stub
  session.ts        ← stub
```

---

## 4. Font — Cause

In `app/layout.tsx`, load the Cause font via `next/font/google`:

```tsx
import { Cause } from "next/font/google"

const cause = Cause({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
})
```

Apply `cause.variable` and `dark` class on `<html>`. Wait — this is light mode only. Apply `cause.variable` class on `<html>`, no dark class.

```tsx
<html lang="pl" className={cause.variable}>
```

---

## 5. globals.css — full design system

Replace the contents of `app/globals.css` with the complete token set. Use Tailwind v4 syntax (`@import "tailwindcss"` and `@theme inline`).

### CSS custom properties (all tokens from `ui-context.md`)

```css
@import "tailwindcss";

:root {
  --bg-base: #F7F6F1;
  --bg-card: #FFFFFF;
  --bg-subtle: #EFEEE8;
  --bg-muted: #E5E4DC;

  --border-ink: #2B2B28;
  --border-light: #C8C7BE;
  --border-subtle: #E0DFD8;

  --text-primary: #1A1917;
  --text-secondary: #4A4845;
  --text-muted: #8A8880;
  --text-faint: #B8B7AF;

  --accent-primary: #1D4ED8;
  --accent-primary-dim: rgba(29, 78, 216, 0.10);
  --accent-warm: #D97706;
  --accent-warm-dim: rgba(217, 119, 6, 0.10);

  --state-success: #16A34A;
  --state-error: #DC2626;
  --state-warning: #D97706;

  --dot-grid: #D1D0C8;
  --dot-spacing: 24px;

  --font-primary: "Cause", sans-serif;
}

@theme inline {
  --color-base: var(--bg-base);
  --color-card: var(--bg-card);
  --color-subtle: var(--bg-subtle);
  --color-muted: var(--bg-muted);

  --color-border-ink: var(--border-ink);
  --color-border-light: var(--border-light);
  --color-border-subtle: var(--border-subtle);

  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-faint: var(--text-faint);

  --color-accent: var(--accent-primary);
  --color-accent-dim: var(--accent-primary-dim);
  --color-accent-warm: var(--accent-warm);
  --color-accent-warm-dim: var(--accent-warm-dim);

  --color-success: var(--state-success);
  --color-error: var(--state-error);
  --color-warning: var(--state-warning);

  --font-sans: var(--font-primary);
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-primary);
  -webkit-font-smoothing: antialiased;
}
```

### Sketch utility classes

Add these reusable sketch-style helpers at the bottom of `globals.css`:

```css
/* Sketch card — use on all card surfaces */
.sketch-card {
  background: var(--bg-card);
  border: 2px solid var(--border-ink);
  border-radius: 12px 13px 11px 12px;
  box-shadow: 3px 3px 0px 0px var(--border-ink);
}

/* Sketch button base */
.sketch-btn {
  border: 2px solid var(--border-ink);
  border-radius: 10px 11px 10px 10px;
  box-shadow: 3px 3px 0px 0px var(--border-ink);
  transition: box-shadow 80ms ease, transform 80ms ease;
  cursor: pointer;
}

.sketch-btn:hover {
  box-shadow: 1px 1px 0px 0px var(--border-ink);
}

.sketch-btn:active {
  box-shadow: none;
  transform: translate(2px, 2px);
}

/* Sketch input */
.sketch-input {
  background: var(--bg-card);
  border: 2px solid var(--border-ink);
  border-radius: 10px 10px 10px 11px;
}

.sketch-input:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Pin board dot grid background */
.dot-grid {
  background-color: var(--bg-subtle);
  background-image: radial-gradient(circle, var(--dot-grid) 1.5px, transparent 1.5px);
  background-size: var(--dot-spacing) var(--dot-spacing);
}
```

---

## 6. Placeholder home page

Replace `app/page.tsx` with a minimal placeholder that uses the design tokens — enough to visually verify the theme is working:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="sketch-card p-8 max-w-sm w-full flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Flow Send</h1>
        <p className="text-text-secondary">Design system working.</p>
        <button className="sketch-btn bg-accent text-white px-4 py-2 font-medium">
          Wyślij
        </button>
        <button className="sketch-btn bg-card text-text-primary px-4 py-2 font-medium">
          Odbierz
        </button>
      </div>
    </main>
  )
}
```

---

## 7. PartyKit config

Create `partykit.json` at the project root:

```json
{
  "name": "flow-send",
  "main": "party/server.ts",
  "compatibilityDate": "2024-01-01"
}
```

Add to `.env.local`:
```
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

---

## Check when done

- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm run dev` starts and the placeholder page renders
- [ ] Background color is `#F7F6F1` (warm paper white), not white or gray
- [ ] The sketch card has the correct ink border and 3px hard offset shadow
- [ ] Cause font loads (check in DevTools → Network → Fonts)
- [ ] Both buttons show the sketch press effect on click (shadow collapses)
- [ ] No Tailwind color classes like `zinc-*`, `gray-*`, or `slate-*` used anywhere
