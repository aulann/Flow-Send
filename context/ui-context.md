# UI Context

## Theme

Light mode only. No dark mode.

The visual language is a **hand-drawn architectural sketch** — warm paper-white backgrounds, ink-dark borders, slightly imperfect organic shapes, and clean typography that feels written rather than rendered. The aesthetic is directly inspired by architect draft paper and pencil sketches: structured layout with tactile, drawn quality. Every surface should feel like it could have been drawn by hand.

Reference aesthetic: pencil illustrations on warm paper, cartoon line-art with a single accent color, slightly "crooked" edges on cards and buttons.

## Color Palette

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind via `@theme inline`. No hardcoded hex values in components.

| Role | CSS Variable | Value |
|------|-------------|-------|
| Page background | `--bg-base` | `#F7F6F1` (warm paper white) |
| Card surface | `--bg-card` | `#FFFFFF` |
| Subtle background | `--bg-subtle` | `#EFEEE8` |
| Muted background | `--bg-muted` | `#E5E4DC` |
| Primary border (ink) | `--border-ink` | `#2B2B28` (dark pencil) |
| Light border | `--border-light` | `#C8C7BE` |
| Subtle border | `--border-subtle` | `#E0DFD8` |
| Primary text | `--text-primary` | `#1A1917` |
| Secondary text | `--text-secondary` | `#4A4845` |
| Muted text | `--text-muted` | `#8A8880` |
| Faint text | `--text-faint` | `#B8B7AF` |
| Accent (primary CTA, links) | `--accent-primary` | `#1D4ED8` (pencil blue) |
| Accent dim | `--accent-primary-dim` | `rgba(29, 78, 216, 0.10)` |
| Accent warm (secondary actions) | `--accent-warm` | `#D97706` (ink amber) |
| Accent warm dim | `--accent-warm-dim` | `rgba(217, 119, 6, 0.10)` |
| Success | `--state-success` | `#16A34A` |
| Error | `--state-error` | `#DC2626` |
| Warning | `--state-warning` | `#D97706` |
| Pin board dots | `--dot-grid` | `#D1D0C8` |
| Dot grid spacing | `--dot-spacing` | `24px` |

## Typography

| Role | Font | Variable |
|------|------|----------|
| UI / body text | Cause (Google Fonts, variable) | `--font-primary` |
| Code / mono | TBD — user-provided | `--font-mono` |

Cause is a semi-casual, optimistic variable sans-serif on Google Fonts (2025). Load via `next/font/google` as a variable font. Its hand-crafted quality directly supports the sketch/pencil aesthetic. If body text at small sizes (≤ 13px) proves hard to read in practice, fall back to Lato for those specific contexts.

## Sketch / Hand-Drawn Style System

The identity of Flow Send comes from simulating hand-drawn elements in CSS. Every component must follow these conventions.

### Sketch Cards
```css
background: var(--bg-card);
border: 2px solid var(--border-ink);
border-radius: 12px 13px 11px 12px;          /* slightly uneven corners */
box-shadow: 3px 3px 0px 0px var(--border-ink); /* hard offset, no blur */
```

### Sketch Buttons — Primary
```css
background: var(--accent-primary);
color: #ffffff;
border: 2px solid var(--border-ink);
border-radius: 10px 11px 10px 10px;
box-shadow: 3px 3px 0px 0px var(--border-ink);
/* hover */ box-shadow: 1px 1px 0px 0px var(--border-ink);
/* active */ box-shadow: none; transform: translate(2px, 2px);
```

### Sketch Buttons — Secondary
Same border/shadow convention, `background: transparent`, `color: var(--text-primary)`.

### Sketch Inputs
```css
background: var(--bg-card);
border: 2px solid var(--border-ink);
border-radius: 10px 10px 10px 11px;
box-shadow: none;
/* focus */ outline: 2px solid var(--accent-primary); outline-offset: 2px;
```

### Uneven Border Radius Scale
Corners are intentionally asymmetric by ±1–2px to simulate pen strokes. Do not use perfect equal values.

| Context | Radius values |
|---------|--------------|
| Tags, badges, chips | `6px 7px 6px 5px` |
| Buttons, inputs | `10px 11px 10px 10px` |
| Cards, panels | `12px 13px 11px 12px` |
| Modals, large surfaces | `16px 15px 16px 14px` |
| QR code container | `14px 13px 14px 15px` |

## Icons

Phosphor Icons (`@phosphor-icons/react`). Use `Regular` weight by default; `Bold` for primary CTAs and transfer type selectors.

| Context | Size |
|---------|------|
| Inline in text | `size={16}` |
| Buttons, inputs | `size={20}` |
| Transfer type grid | `size={32}` weight `Bold` |
| Empty states, hero | `size={48}` |
| Device type indicator | `size={20}` |

Never use filled icon variants — stroke only.

## Layout Patterns

**Landing page** (`/`):
- Centered single-column hero. Max-width 600px.
- Large headline, short subtext, two CTA buttons side-by-side: "Wyślij" + "Odbierz".
- Decorative hand-drawn illustration(s) around the hero area.
- No navigation bar — logo + tagline only.

**Send flow** (`/send`):
- Centered card. Max-width 440px on desktop, full-width on mobile.
- Pre-connection: QR scanner fills most of the card; code input below.
- Post-connection: device info banner at top, 5 transfer type tiles below, session list at bottom.

**Receive flow** (`/receive`):
- Centered card before connection. QR code dominates the card. Code text + countdown ring below.
- Post-connection: transitions to full-viewport receive board.

**Receive board**:
- Full-viewport. Dot-grid background (see Receive Board section).
- Cards float on the surface, no sidebar or nav.
- Disconnect button fixed in the bottom-right corner.

**Modals / dialogs**:
- Centered overlay. Max-width 480px. Dark semi-transparent backdrop.
- Sketch card style with the largest border-radius variant.

## Receive Board (Pin Board)

The receive board is the signature screen of Flow Send.

**Background**: CSS dot grid:
```css
background-color: var(--bg-subtle);
background-image: radial-gradient(circle, var(--dot-grid) 1.5px, transparent 1.5px);
background-size: var(--dot-spacing) var(--dot-spacing);
```

**Item cards**: Each received item is a sketch card with a subtle rotation to simulate being pinned:
- Odd-indexed cards: `rotate(-0.8deg)`
- Even-indexed cards: `rotate(0.6deg)`
- Rotation is deterministic by index — not random on each render.
- Cards have a slightly larger hard shadow (`4px 4px 0 var(--border-ink)`) on the board.

**Card layout** (each item):
```
┌──────────────────────────┐
│  [preview area]          │
│  filename.ext            │
│  [device icon] DeviceName│
│  [Download] [Copy] [✕]   │
└──────────────────────────┘
```

**Card widths**: 220px on desktop, full-width on mobile (single column).

## Transfer Type Selector

Five tiles arranged in a 2+3 grid on mobile, 5×1 row on desktop.

Each tile:
- Sketch card style (smaller shadow: `2px 2px 0 var(--border-ink)`)
- Phosphor icon 32px Bold, centered
- Label below in `--text-secondary`
- Selected state: `background: var(--accent-primary-dim)`, blue border

Transfer types and icons:
| Type | Phosphor Icon |
|------|--------------|
| Tekst | `TextT` |
| Zdjęcie | `Image` |
| Wideo | `FilmStrip` |
| Plik | `File` |
| Link | `Link` |

## QR Code Display

- QR rendered as SVG via `react-qr-code`. Dark modules: `var(--border-ink)`. Light modules: `var(--bg-card)`.
- Contained in a sketch-style card with generous padding.
- Below the QR: the 6-character code in large monospace text (spaced out, easy to read).
- A circular countdown ring (SVG) shows time remaining to the next code refresh.
- Countdown ring animates `stroke-dashoffset` from full to 0 over 30 seconds.

## Animations

All animations are simple and short. Nothing that feels "AI-generated smooth" — prefer mechanical, deliberate.

| Element | Animation |
|---------|-----------|
| Loading state | SVG circle stroke draws itself (pencil-draw feel), 1.2s loop |
| Card appear on board | `scale(0.94) opacity(0)` → `scale(1) opacity(1)`, 180ms ease-out |
| Button press | Hard shadow collapses + `translate(2px, 2px)`, 80ms |
| Connection success | Brief green flash on the device info banner, 400ms |
| Transfer progress bar | Thin `4px` bar at top of card, fills like ink spreading, linear |
| QR countdown ring | SVG stroke-dashoffset, 30s linear, no easing |
| Board entry transition | `translateY(16px) opacity(0)` → `translateY(0) opacity(1)`, 260ms |

No heavy page transitions. No parallax. No spring physics. Keep total animation budget under 300ms per interaction.

## Responsive Strategy

Mobile-first. The primary use case is someone holding a phone scanning a QR code.

- **Mobile (< 640px)**: full-width single column, all touch targets ≥ 48px, QR scanner fills the screen.
- **Tablet (640px–1024px)**: same as mobile layout with slightly more padding.
- **Desktop (> 1024px)**: centered containers with max-width constraints.

The QR scanner view must be effectively full-screen on mobile to maximize camera area.

## Component Library

shadcn/ui on top of Tailwind v4. Components live in `components/ui/`. Use the `shadcn` CLI to add new primitives. Never hand-edit shadcn components — override styles at the app layer.

The sketch style (asymmetric borders, hard shadows) is applied via wrapper classes or CSS custom properties on top of shadcn primitives — not by modifying the primitives themselves.
