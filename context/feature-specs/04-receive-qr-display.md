Read `CLAUDE.md` and all 6 context files before starting.

# Feature 04 — Receive Page: QR Display + Countdown

Build the `/receive` page — the first screen a user sees when they want to receive files. It shows a QR code, the 6-character session code, and a 30-second countdown ring that auto-regenerates the code on expiry.

No PartyKit connection yet. No WebRTC yet. This feature is UI only — code generation, display, and the countdown loop. The signaling integration comes in Feature 07.

---

## Files to create or update

| File | Action |
|------|--------|
| `lib/session.ts` | Replace stub with real implementation |
| `hooks/use-session.ts` | Replace stub — receiver-side countdown hook |
| `app/receive/page.tsx` | Create — server component shell |
| `components/receive/receive-waiting.tsx` | Create — full waiting screen UI |

---

## `lib/session.ts`

```typescript
export function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes).map(b => chars[b % 36]).join("")
}

export function buildQrPayload(code: string): string {
  const origin = typeof window !== "undefined"
    ? window.location.origin
    : "https://flow-send.vercel.app"
  return `${origin}/send?code=${code}`
}

export function isValidSessionCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}
```

Why `b % 36`: Uint8 values (0–255) are mapped into the 36-character alphabet. Values 0–35 map cleanly; values 36–71 map to the same chars again; and so on. Slight bias toward the first few characters (roughly 7× instead of 6×) is acceptable for a 6-char display code — this is not a cryptographic key.

`buildQrPayload` uses `window.location.origin` so local dev QR codes point to `localhost:3000` and work without deploying.

---

## `hooks/use-session.ts`

```typescript
"use client"
import { useState, useEffect, useCallback } from "react"
import { generateSessionCode, buildQrPayload } from "@/lib/session"

const SESSION_TTL_SECONDS = 30

export function useReceiverSession() {
  const [code, setCode] = useState<string>(() => generateSessionCode())
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TTL_SECONDS)

  const refresh = useCallback(() => {
    setCode(generateSessionCode())
    setSecondsLeft(SESSION_TTL_SECONDS)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) {
      refresh()
      return
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, refresh])

  return {
    code,
    secondsLeft,
    qrPayload: buildQrPayload(code),
    refresh,
  }
}
```

The hook drives the countdown with `setTimeout` (not `setInterval`) — each tick schedules the next one. When `secondsLeft` hits 0, `refresh()` generates a new code and resets the counter to 30, restarting the cycle.

---

## `app/receive/page.tsx`

```typescript
import { ReceiveWaiting } from "@/components/receive/receive-waiting"

export default function ReceivePage() {
  return <ReceiveWaiting />
}
```

Server component — no `"use client"`. The client boundary starts inside `ReceiveWaiting`.

---

## `components/receive/receive-waiting.tsx`

```tsx
"use client"
import QRCode from "react-qr-code"
import Link from "next/link"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { useReceiverSession } from "@/hooks/use-session"

const RING_RADIUS = 24
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const SESSION_TTL = 30

export function ReceiveWaiting() {
  const { code, secondsLeft, qrPayload } = useReceiverSession()

  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - secondsLeft / SESSION_TTL)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Back link */}
      <div className="w-full max-w-sm mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeftIcon size={16} />
          Strona główna
        </Link>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Main card */}
        <div className="sketch-card p-6 flex flex-col items-center gap-6">

          {/* QR code */}
          <div style={{
            background: "var(--bg-card)",
            border: "2px solid var(--border-ink)",
            borderRadius: "14px 13px 14px 15px",
            padding: "16px",
          }}>
            <QRCode
              value={qrPayload}
              size={200}
              fgColor="var(--border-ink)"
              bgColor="var(--bg-card)"
            />
          </div>

          {/* Session code — each character in its own box */}
          <div className="flex gap-2">
            {code.split("").map((char, i) => (
              <div
                key={i}
                className="w-9 h-10 flex items-center justify-center"
                style={{
                  background: "var(--bg-subtle)",
                  border: "2px solid var(--border-light)",
                  borderRadius: "6px 7px 6px 5px",
                  fontFamily: "monospace",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {char}
              </div>
            ))}
          </div>

          {/* Countdown ring */}
          <div className="flex flex-col items-center gap-1">
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
              {/* Track ring */}
              <circle
                cx="28" cy="28" r={RING_RADIUS}
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="3"
              />
              {/* Progress ring — key=code restarts on code refresh */}
              <circle
                key={code}
                cx="28" cy="28" r={RING_RADIUS}
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--text-muted)" }}
            >
              {secondsLeft}s
            </span>
          </div>

        </div>

        {/* Instruction text */}
        <p
          className="text-center text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Otwórz Flow Send na urządzeniu wysyłającym i zeskanuj ten kod QR.
        </p>

      </div>
    </div>
  )
}
```

### Countdown ring — how it works

- `RING_RADIUS = 24`, so `RING_CIRCUMFERENCE ≈ 150.8`.
- `stroke-dasharray = RING_CIRCUMFERENCE` — the stroke is exactly one full loop.
- `stroke-dashoffset` starts at `0` (full ring visible) and increases to `RING_CIRCUMFERENCE` (ring invisible) as seconds drain.
- CSS `transition: stroke-dashoffset 1s linear` smoothly interpolates between each 1-second state update.
- `key={code}` on the progress circle causes React to unmount + remount it when a new code is generated, resetting the stroke to full instantly without a flash.
- The track ring is always visible; only the progress ring animates.

### Session code display

Each character in its own small box (sketch-style chip). `tabular-nums` and monospace ensure characters don't shift width. The 6 chips make the code easy to type manually as a fallback.

---

## Check when done

- [ ] `npm run dev` — `/receive` loads without errors
- [ ] QR code renders (black modules on white background)
- [ ] 6-character code displays in individual boxes below the QR
- [ ] Countdown ring is full on page load and drains over 30 seconds
- [ ] At 30s: code changes, QR updates, ring snaps back to full
- [ ] Back link "Strona główna" navigates to `/`
- [ ] Mobile (375px): card fits screen width with padding, QR is readable
- [ ] No Tailwind color, shadow, or rounded utility classes on custom elements
- [ ] `npm run build` passes
