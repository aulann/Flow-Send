Read `CLAUDE.md` and all 6 context files before starting.

# Feature 02 — Landing Page

Build the static landing page at `/`. No routing logic or functionality — layout and sketch style only. This is the first screen every user sees and sets the visual tone for the whole app.

Replace the current placeholder `app/page.tsx` with the real landing page.

---

## Layout overview

```
┌────────────────────────────────────┐
│  NAVBAR  (logo left, tagline right)│
├────────────────────────────────────┤
│                                    │
│  HERO  (headline + CTAs)           │
│                                    │
├────────────────────────────────────┤
│  JAK TO DZIAŁA  (3 steps)          │
├────────────────────────────────────┤
│  CO MOŻESZ PRZESŁAĆ  (5 tiles)     │
├────────────────────────────────────┤
│  FOOTER                            │
└────────────────────────────────────┘
```

Max-width container: `max-w-3xl mx-auto px-4` for all sections.

---

## Components to create

### `components/landing/landing-navbar.tsx`

- Fixed top bar, `bg-base` background, `border-b-2 border-border-ink`.
- Left: logo mark (pencil SVG icon or Phosphor `PencilLine` Bold, 24px) + text "Flow Send" in `font-bold text-text-primary`.
- Right: a subtle text tag like "beta" styled as a sketch badge (`border border-border-light rounded text-text-muted text-xs px-2 py-0.5`).
- Height: `h-14`.
- No navigation links.

### `components/landing/hero-section.tsx`

- Full-width section, vertically centred, min-height `min-h-[calc(100vh-3.5rem)]` (fills below navbar).
- **Headline**: large, bold, two lines:
  ```
  Prześlij wszystko.
  Jednym skanem.
  ```
  Font size: `text-4xl sm:text-5xl font-bold text-text-primary leading-tight`.
- **Subtext** below headline:
  ```
  Pliki, zdjęcia, linki, tekst — między dowolnymi urządzeniami.
  Bez konta. Bez kabla. Bez tej samej sieci.
  ```
  `text-text-secondary text-base sm:text-lg max-w-md`.
- **CTA buttons** — side by side on desktop, stacked on mobile (`flex flex-col sm:flex-row gap-3`):
  - Primary: "Wyślij →" — `sketch-btn bg-accent text-white font-semibold px-6 py-3`
  - Secondary: "Odbierz" — `sketch-btn bg-card text-text-primary font-semibold px-6 py-3`
  - Buttons link to `/send` and `/receive` (use `<Link>` — pages don't exist yet, that's fine).
- **Decorative element**: a large dashed circle or hand-drawn arrow SVG near the CTAs — simple inline SVG, stroke only, `stroke-border-light`, no fill. Keep it minimal.

### `components/landing/how-it-works-section.tsx`

Section title: "Jak to działa" — `text-2xl font-bold text-text-primary mb-8`.

Three steps as sketch cards side-by-side on desktop, stacked on mobile (`grid grid-cols-1 sm:grid-cols-3 gap-4`):

| Step | Icon (Phosphor Bold) | Title | Description |
|------|---------------------|-------|-------------|
| 1 | `DeviceMobile` | Otwórz na obu urządzeniach | Wejdź na flow-send.vercel.app z telefonu i komputera — bez instalacji. |
| 2 | `QrCode` | Zeskanuj kod QR | Na urządzeniu wysyłającym kliknij "Wyślij" i zeskanuj kod z ekranu odbiorcy. |
| 3 | `CheckCircle` | Gotowe | Pliki pojawiają się od razu. Sesja znika po zamknięciu okna. |

Each card:
- `sketch-card p-5`
- Step number in top-left as small muted badge: `text-text-faint text-xs font-mono`
- Phosphor icon `size={32}` Bold, `text-accent` color
- Title: `font-semibold text-text-primary mt-3 mb-1`
- Description: `text-text-secondary text-sm`

### `components/landing/transfer-types-section.tsx`

Section title: "Co możesz przesłać" — same heading style.

Five tiles in a grid (`grid grid-cols-3 sm:grid-cols-5 gap-3`). On mobile the grid is 3 columns — the 5th tile starts a second row and is centred (use `col-span-3 sm:col-span-1` + flex justify on the row). Simplest approach: just `grid grid-cols-3 sm:grid-cols-5` and accept the natural wrapping.

| Type | Phosphor Icon (Bold) | Label |
|------|---------------------|-------|
| Tekst | `TextT` | Tekst |
| Zdjęcie | `Image` | Zdjęcie |
| Wideo | `FilmStrip` | Wideo |
| Plik | `File` | Plik |
| Link | `Link` | Link |

Each tile:
- `sketch-card p-4 flex flex-col items-center gap-2 cursor-default`
- Icon `size={28}` Bold, `text-text-secondary`
- Label: `text-xs text-text-muted font-medium`
- Smaller shadow variant: `box-shadow: 2px 2px 0 var(--border-ink)` — override inline or add a `.sketch-card-sm` variant to `globals.css`

### `components/landing/landing-footer.tsx`

Simple one-line footer:
- `border-t-2 border-border-subtle py-6 text-center`
- Text: `Flow Send · Pliki między urządzeniami · Bezpłatnie`
- `text-text-faint text-sm`

---

## `app/page.tsx`

Compose the landing page from the sections above:

```tsx
import { LandingNavbar } from "@/components/landing/landing-navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { TransferTypesSection } from "@/components/landing/transfer-types-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <LandingNavbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <TransferTypesSection />
      </main>
      <LandingFooter />
    </div>
  )
}
```

---

## Sketch style rules (mandatory)

- Every card uses `.sketch-card` or the inline equivalent — no plain `rounded` + `shadow` defaults.
- Buttons use `.sketch-btn` with the hover/active shadow collapse.
- No `shadow-*` Tailwind utilities — all shadows are the hard 3px offset from the design system.
- No `rounded-*` Tailwind utilities on bordered elements — use the asymmetric radius values.
- All text colors from CSS variables: `text-text-primary`, `text-text-secondary`, `text-text-muted`.

---

## Add `.sketch-card-sm` to `globals.css`

Add this variant alongside the existing sketch utilities:

```css
/* Smaller sketch card — for tiles, chips */
.sketch-card-sm {
  background: var(--bg-card);
  border: 2px solid var(--border-ink);
  border-radius: 10px 11px 9px 10px;
  box-shadow: 2px 2px 0px 0px var(--border-ink);
}
```

---

## Check when done

- [ ] `npm run build` passes with no errors
- [ ] Landing page renders at `http://localhost:3000`
- [ ] Cause font is visible (rounded, semi-casual character)
- [ ] Background is warm paper white (`#F7F6F1`), not pure white
- [ ] Navbar has ink border bottom
- [ ] Hero headline is large and bold, two CTAs visible
- [ ] "Wyślij" button is blue with hard offset shadow; shadow collapses on hover and press
- [ ] All three "Jak to działa" cards have sketch borders and offset shadow
- [ ] All five transfer type tiles render with icons and labels
- [ ] On mobile (375px): hero is single-column, step cards stack vertically, transfer tiles wrap to 2 rows
- [ ] Footer is visible at bottom
- [ ] No `zinc-*`, `gray-*`, `slate-*`, `shadow-*`, or `rounded-*` Tailwind classes on any custom element
