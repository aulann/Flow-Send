Read `CLAUDE.md` and all 6 context files before starting.

# Feature 11 — Receive Board (Chalkboard UI)

Full redesign of the receiver's connected state. Replace the minimal list with a **chalkboard** scene: a light, smudged, chalk-marked board where received items appear as pinned paper cards scattered in random positions.

Desktop: cards placed at random (x, y) coordinates with random rotation.
Mobile (< 640 px): cards in a single column with random rotation only — no absolute positioning.

---

## Visual concept

| Layer | Description |
|-------|-------------|
| Board background | Off-white/cream (#F0EDE4) base, CSS noise texture via SVG `feTurbulence`, subtle chalk smudge gradients, decorative chalk scribbles (SVG lines) baked into the background |
| Card | White/ivory paper card, `box-shadow` with slight smear, `border-radius` slightly irregular, `rotate` random ±8°, `translate` random offset so it looks hand-placed |
| Pin | Red circle (12×12 px) centred at the top of each card, hard drop shadow below |
| Hover | Card lifts: `translateY(-6px)`, shadow deepens — no rotation change |

---

## Layout rules

### Desktop (≥ 640 px)

- Board is a `position: relative` container, `min-height: 100vh`, full width.
- Each card is `position: absolute`. Coordinates computed once per card from `id` (deterministic pseudo-random so cards don't jump on re-render):

```
x = hash(id, 0) % (boardWidth  - CARD_W - 40) + 20   // px from left
y = hash(id, 1) % (boardHeight - CARD_H - 40) + 20   // px from top
rotate = (hash(id, 2) % 17) - 8                        // –8° … +8°
```

Use a simple `djb2`-style hash on the string `id + seed`.

Card minimum size: 200 × auto. Cards do **not** overlap detection — simple hash spread is enough for v1.

### Mobile (< 640 px)

- Board is `position: relative`, normal flow.
- Cards are `position: relative`, stacked in a column with `margin: 12px auto`, `max-width: 320px`.
- Random rotation ±8° still applied (same hash formula).
- Board background + pin still rendered.

---

## Board background (CSS only — no image files)

```css
.chalkboard {
  background-color: #EDE8DC;
  background-image:
    url("data:image/svg+xml,..."), /* SVG noise filter */
    radial-gradient(ellipse 60% 40% at 30% 60%, rgba(255,255,255,0.18) 0%, transparent 70%),
    radial-gradient(ellipse 50% 30% at 75% 25%, rgba(255,255,255,0.12) 0%, transparent 65%);
}
```

The SVG noise uses `feTurbulence` + `feColorMatrix` to produce a fine chalky grain.

Decorative chalk scribbles: an absolutely-positioned `<svg>` layer behind all cards, full board size, containing 6–8 faint white polylines (opacity 0.08–0.12) that look like random chalk strokes/doodles — a loose circle, a wavy line, a star outline, some hatching. These are **hardcoded** SVG paths, not generated at runtime.

---

## Card anatomy

```
┌──────────────────┐
│        🔴        │  ← red pin (absolute, top: -8px, centered)
│                  │
│  [icon] content  │
│                  │
│  [actions row]   │
└──────────────────┘
```

Card styles:
```css
.chalk-card {
  background: #FFFEF7;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 3px 4px 3px 2px;
  box-shadow: 2px 3px 0 rgba(0,0,0,0.15), 4px 6px 12px rgba(0,0,0,0.1);
  padding: 20px 16px 14px;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  width: 220px;
}

.chalk-card:hover {
  transform: rotate(var(--card-rotate)) translateY(-6px) !important;
  box-shadow: 3px 8px 4px rgba(0,0,0,0.18), 6px 14px 20px rgba(0,0,0,0.12);
}

.chalk-pin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #E53E3E;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(0,0,0,0.2);
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}
```

Apply `--card-rotate` as a CSS variable per card so hover can reference it.

---

## In-progress transfer card

While a file is being received, show a special card on the board:
- Same card style, pinned in the same way
- Content: file icon + filename (truncated) + progress bar (4 px, fills left-to-right)
- Progress % text
- Position: bottom-right area of board on desktop, top of column on mobile

---

## Files to create or update

| File | Action |
|------|--------|
| `components/receive/receive-board.tsx` | Full replacement — chalkboard layout, scattered cards |
| `app/globals.css` | Add `.chalkboard` background class and chalk noise SVG |

No other files need changes — store and hooks are unchanged.

---

## `app/globals.css` additions

Add to the end of the file:

```css
/* ── Chalkboard ─────────────────────────────────────────── */

.chalkboard {
  position: relative;
  background-color: #EDE8DC;
  background-image:
    radial-gradient(ellipse 65% 45% at 28% 62%, rgba(255,255,255,0.16) 0%, transparent 70%),
    radial-gradient(ellipse 45% 35% at 72% 22%, rgba(255,255,255,0.10) 0%, transparent 65%),
    radial-gradient(ellipse 30% 50% at 85% 75%, rgba(255,255,255,0.08) 0%, transparent 60%);
  min-height: 100dvh;
  overflow: hidden;
}

/* SVG grain overlay — injected via <div className="chalk-grain" /> */
.chalk-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.55;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

.chalk-card {
  background: #FFFEF7;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 3px 4px 3px 2px;
  box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.14), 4px 6px 14px rgba(0, 0, 0, 0.09);
  padding: 20px 14px 12px;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  width: 220px;
}

.chalk-card:hover {
  box-shadow: 3px 8px 4px rgba(0, 0, 0, 0.16), 6px 16px 22px rgba(0, 0, 0, 0.11);
}

.chalk-pin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #FC8181, #C53030);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.45), inset 0 -1px 2px rgba(0, 0, 0, 0.15);
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
}
```

---

## `components/receive/receive-board.tsx`

Full replacement:

```tsx
"use client"
import { ArrowDownIcon, CopyIcon, TrashIcon, FileIcon, ImageIcon, FilmStripIcon, LinkIcon, TextTIcon } from "@phosphor-icons/react"
import { useTransferStore } from "@/store/transfer.store"
import { formatFileSize } from "@/lib/transfer"
import type { TransferItem } from "@/types/transfer"

// Deterministic pseudo-random from string id + numeric seed
function hash(id: string, seed: number): number {
  let h = seed * 2654435761
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x9e3779b9)
    h ^= h >>> 15
  }
  return Math.abs(h)
}

function cardTransform(id: string, boardW: number, boardH: number, cardW = 220, cardH = 200) {
  const x = (hash(id, 0) % Math.max(boardW - cardW - 40, 1)) + 20
  const y = (hash(id, 1) % Math.max(boardH - cardH - 60, 1)) + 60
  const rotate = (hash(id, 2) % 17) - 8
  return { x, y, rotate }
}

// Decorative chalk scribbles — static SVG paths
function ChalkScribbles() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.09 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="60,80 120,60 180,90 240,70" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polyline points="300,200 340,170 380,210 420,185 460,215" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="80%" cy="30%" r="40" stroke="white" strokeWidth="2" fill="none" />
      <polyline points="70,300 100,260 130,300 160,260 190,300" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="50%" y1="85%" x2="65%" y2="82%" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="50%" y1="89%" x2="68%" y2="87%" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <polyline points="500,350 540,320 560,360 600,330" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Pin() {
  return <div className="chalk-pin" />
}

function CardActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-1.5 justify-end mt-3 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      {children}
    </div>
  )
}

function ActionBtn({ onClick, href, download, children }: {
  onClick?: () => void
  href?: string
  download?: string
  children: React.ReactNode
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 500,
    background: "rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: "4px 5px 4px 3px",
    color: "#444",
    textDecoration: "none",
    cursor: "pointer",
  }
  if (href) return <a href={href} download={download} style={style}>{children}</a>
  return <button onClick={onClick} style={style}>{children}</button>
}

function TextCard({ item, style, onRemove }: {
  item: Extract<TransferItem, { kind: "text" }>
  style: React.CSSProperties
  onRemove: (id: string) => void
}) {
  const isLink = item.subtype === "link"
  return (
    <div className="chalk-card" style={style}>
      <Pin />
      <div className="flex items-start gap-2 mb-1">
        {isLink
          ? <LinkIcon size={14} style={{ color: "#4A6FA5", flexShrink: 0, marginTop: 2 }} />
          : <TextTIcon size={14} style={{ color: "#888", flexShrink: 0, marginTop: 2 }} />
        }
        {isLink ? (
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs break-all"
            style={{ color: "#4A6FA5" }}
          >
            {item.content}
          </a>
        ) : (
          <p className="text-xs break-words whitespace-pre-wrap leading-relaxed" style={{ color: "#333" }}>
            {item.content}
          </p>
        )}
      </div>
      <CardActions>
        <ActionBtn onClick={() => navigator.clipboard.writeText(item.content).catch(() => {})}>
          <CopyIcon size={11} /> Kopiuj
        </ActionBtn>
        <ActionBtn onClick={() => onRemove(item.id)}>
          <TrashIcon size={11} />
        </ActionBtn>
      </CardActions>
    </div>
  )
}

function FileCard({ item, style, onRemove }: {
  item: Extract<TransferItem, { kind: "file" }>
  style: React.CSSProperties
  onRemove: (id: string) => void
}) {
  const Icon = item.subtype === "image" ? ImageIcon : item.subtype === "video" ? FilmStripIcon : FileIcon
  return (
    <div className="chalk-card" style={{ ...style, width: item.subtype === "image" ? 240 : 220 }}>
      <Pin />
      {item.subtype === "image" && (
        <img
          src={item.blobUrl}
          alt={item.name}
          style={{
            width: "100%",
            height: 140,
            objectFit: "cover",
            borderRadius: 2,
            marginBottom: 10,
            display: "block",
          }}
        />
      )}
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: "#888", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <p className="text-xs font-medium truncate" style={{ color: "#333" }}>{item.name}</p>
          <p style={{ fontSize: 10, color: "#999" }}>{formatFileSize(item.size)}</p>
        </div>
      </div>
      <CardActions>
        <ActionBtn href={item.blobUrl} download={item.name}>
          <ArrowDownIcon size={11} /> Pobierz
        </ActionBtn>
        <ActionBtn onClick={() => onRemove(item.id)}>
          <TrashIcon size={11} />
        </ActionBtn>
      </CardActions>
    </div>
  )
}

function InProgressCard({ style }: { style: React.CSSProperties }) {
  const inProgress = useTransferStore((s) => s.inProgress)
  if (!inProgress) return null
  const pct = Math.round((inProgress.receivedBytes / inProgress.size) * 100)
  return (
    <div className="chalk-card" style={style}>
      <Pin />
      <div className="flex items-center gap-2 mb-3">
        <FileIcon size={14} style={{ color: "#888" }} />
        <p className="text-xs truncate flex-1" style={{ color: "#333" }}>{inProgress.name}</p>
        <span style={{ fontSize: 10, color: "#999" }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "#4A6FA5",
          transition: "width 0.1s ease",
        }} />
      </div>
    </div>
  )
}

// ── Board ────────────────────────────────────────────────────────────

export function ReceiveBoard() {
  const { items, removeItem, inProgress } = useTransferStore()
  const isEmpty = items.length === 0 && !inProgress

  // Board dimensions for desktop layout — measured via ref
  const boardRef = React.useRef<HTMLDivElement>(null)
  const [boardSize, setBoardSize] = React.useState({ w: 800, h: 600 })
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640

  React.useEffect(() => {
    if (!boardRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setBoardSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(boardRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={boardRef} className="chalkboard w-full" style={{ minHeight: "100dvh" }}>
      <div className="chalk-grain" />
      <ChalkScribbles />

      {isEmpty && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: "none" }}
        >
          <p
            style={{
              fontFamily: "var(--font-cause, sans-serif)",
              fontSize: 18,
              color: "rgba(0,0,0,0.18)",
              letterSpacing: "0.04em",
              userSelect: "none",
            }}
          >
            Czekam na pliki…
          </p>
        </div>
      )}

      {/* In-progress card */}
      {inProgress && (() => {
        const { x, y, rotate } = isMobile
          ? { x: 0, y: 0, rotate: (hash(inProgress.id + "ip", 2) % 11) - 5 }
          : cardTransform(inProgress.id + "ip", boardSize.w, boardSize.h)
        const cardStyle: React.CSSProperties = isMobile
          ? { transform: `rotate(${rotate}deg)`, margin: "40px auto 0", display: "block" }
          : { position: "absolute", left: x, top: y, transform: `rotate(${rotate}deg)` }
        return <InProgressCard style={cardStyle} />
      })()}

      {/* Received cards */}
      {items.map((item) => {
        const { x, y, rotate } = isMobile
          ? { x: 0, y: 0, rotate: (hash(item.id, 2) % 17) - 8 }
          : cardTransform(item.id, boardSize.w, boardSize.h)

        const cardStyle: React.CSSProperties = isMobile
          ? { transform: `rotate(${rotate}deg)`, margin: "32px auto 0", display: "block" }
          : {
              position: "absolute",
              left: x,
              top: y,
              transform: `rotate(${rotate}deg)`,
              ["--card-rotate" as string]: `${rotate}deg`,
            }

        return item.kind === "text"
          ? <TextCard key={item.id} item={item} style={cardStyle} onRemove={removeItem} />
          : <FileCard key={item.id} item={item} style={cardStyle} onRemove={removeItem} />
      })}

      {/* Mobile bottom padding */}
      {isMobile && <div style={{ height: 60 }} />}
    </div>
  )
}
```

Add `import React from "react"` at the top of the file.

---

## Update `components/receive/receive-waiting.tsx`

The connected state's outer wrapper currently uses `bg-subtle`. Remove it — `ReceiveBoard` now fills the full viewport itself. The connected block should just render:

```tsx
if (status === "connected") {
  return (
    <div className="relative">
      {deviceInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
          <DeviceBadge device={deviceInfo} label="Połączono z" />
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={disconnect}
          className="sketch-btn px-5 py-2 text-sm font-medium"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
        >
          Rozłącz
        </button>
      </div>
      <ReceiveBoard />
    </div>
  )
}
```

`DeviceBadge` and "Rozłącz" float as absolutely positioned overlays above the board.

---

## Check when done

- [ ] Board has cream/off-white chalky background with grain and smudge gradients
- [ ] Faint chalk scribbles visible in the background
- [ ] Each card has a red pin centred at the top
- [ ] Cards have slight random rotation (different for each card, consistent on re-render)
- [ ] Desktop: cards appear at random absolute positions across the board
- [ ] Mobile: cards stack in a column with rotation only, no overflow
- [ ] Hover: card lifts slightly (shadow deepens)
- [ ] In-progress transfer shows its own pinned card with progress bar
- [ ] Empty state shows faint "Czekam na pliki…" centred on board
- [ ] DeviceBadge floats above board (not inside it)
- [ ] "Rozłącz" button floats at bottom centre above board
- [ ] `npm run build` passes
