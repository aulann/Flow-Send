Read `CLAUDE.md` and all 6 context files before starting.

# Feature 05 — Send Page: QR Scanner + Manual Code Input

Build the `/send` page — the screen a sender sees before the connection is established. It shows a live camera QR scanner and a 6-character manual code input as fallback. When a valid code is captured (by either method), the UI switches to a "Łączenie…" placeholder state.

No WebRTC yet. No PartyKit connection yet. This feature ends the moment a valid code is in hand — the actual connection logic comes in Feature 07.

---

## Files to create or update

| File | Action |
|------|--------|
| `lib/qr.ts` | Replace stub — QR payload parsing and code validation |
| `hooks/use-qr-scanner.ts` | Replace stub — html5-qrcode lifecycle hook |
| `app/send/page.tsx` | Create — server component shell |
| `components/send/send-waiting.tsx` | Create — scanner + code input UI |

---

## `lib/qr.ts`

```typescript
const CODE_REGEX = /^[A-Z0-9]{6}$/
const QR_URL_PATTERN = /\/send\?code=([A-Z0-9]{6})(?:$|&)/

export function parseQrPayload(raw: string): string | null {
  // Full URL: https://flow-send.vercel.app/send?code=ABCD12
  const match = raw.match(QR_URL_PATTERN)
  if (match) return match[1]

  // Raw code typed manually: abcd12 → ABCD12
  const upper = raw.trim().toUpperCase()
  if (CODE_REGEX.test(upper)) return upper

  return null
}

export function isValidCode(code: string): boolean {
  return CODE_REGEX.test(code)
}
```

---

## `hooks/use-qr-scanner.ts`

Dynamic import of `html5-qrcode` to avoid SSR crash (it uses browser APIs internally).

```typescript
"use client"
import { useEffect, useRef, useState } from "react"
import { parseQrPayload } from "@/lib/qr"

export type ScannerStatus = "requesting" | "scanning" | "denied" | "error"

export function useQrScanner(
  elementId: string,
  onCode: (code: string) => void
) {
  const [status, setStatus] = useState<ScannerStatus>("requesting")
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    let active = true

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode(elementId)
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (!active || calledRef.current) return
            const code = parseQrPayload(decoded)
            if (code) {
              calledRef.current = true
              onCode(code)
            }
          },
          () => {} // per-frame decode errors are normal — ignore
        )
        if (active) setStatus("scanning")
      } catch (err) {
        if (!active) return
        const msg = err instanceof Error ? err.message : String(err)
        setStatus(msg.toLowerCase().includes("permission") ? "denied" : "error")
      }
    }

    start()

    return () => {
      active = false
      scannerRef.current?.stop().catch(() => {})
    }
  }, [elementId, onCode])

  return { status }
}
```

`calledRef` prevents `onCode` from firing multiple times on the same frame burst.

---

## `app/send/page.tsx`

```typescript
import { SendWaiting } from "@/components/send/send-waiting"

export default function SendPage() {
  return <SendWaiting />
}
```

---

## `components/send/send-waiting.tsx`

Two states: `idle` (scanner visible) and `connecting` (code captured, placeholder).

```tsx
"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeftIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useQrScanner } from "@/hooks/use-qr-scanner"
import { isValidCode } from "@/lib/qr"

type PageState = "idle" | "connecting"

export function SendWaiting() {
  const [pageState, setPageState] = useState<PageState>("idle")
  const [capturedCode, setCapturedCode] = useState("")
  const [inputs, setInputs] = useState<string[]>(Array(6).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCode = useCallback((code: string) => {
    setCapturedCode(code)
    setPageState("connecting")
  }, [])

  const { status } = useQrScanner("qr-reader", handleCode)

  // Manual input handlers
  function handleInputChange(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1)
    const next = [...inputs]
    next[index] = char
    setInputs(next)
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !inputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "")
    const next = Array(6).fill("")
    pasted.slice(0, 6).split("").forEach((c, i) => { next[i] = c })
    setInputs(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  function handleConnect() {
    const code = inputs.join("")
    if (isValidCode(code)) handleCode(code)
  }

  if (pageState === "connecting") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
          <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Łączenie…
          </div>
          <div
            className="font-mono text-sm tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            {capturedCode}
          </div>
          <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
            WebRTC zostanie wdrożone w Feature 07
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeftIcon size={16} />
          Strona główna
        </Link>

        {/* Heading */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Wyślij pliki
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Zeskanuj kod QR z ekranu odbiorcy.
          </p>
        </div>

        {/* Main card */}
        <div className="sketch-card p-4 flex flex-col gap-5">

          {/* Scanner area */}
          {status === "denied" || status === "error" ? (
            <div
              className="w-full flex flex-col items-center justify-center gap-2 py-10"
              style={{
                background: "var(--bg-subtle)",
                borderRadius: "10px 11px 9px 10px",
                border: "2px dashed var(--border-light)",
              }}
            >
              <WarningCircleIcon size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                {status === "denied"
                  ? "Brak dostępu do kamery. Wpisz kod ręcznie."
                  : "Nie udało się uruchomić kamery. Wpisz kod ręcznie."}
              </p>
            </div>
          ) : (
            <div
              id="qr-reader"
              className="w-full overflow-hidden"
              style={{
                borderRadius: "10px 11px 9px 10px",
                border: "2px solid var(--border-ink)",
                minHeight: "260px",
              }}
            />
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              lub wpisz kod
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          {/* Manual code input — 6 boxes */}
          <div className="flex gap-2 justify-center">
            {inputs.map((val, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                value={val}
                maxLength={1}
                onChange={e => handleInputChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-9 h-10 text-center font-mono font-bold text-lg uppercase"
                style={{
                  background: "var(--bg-card)",
                  border: "2px solid var(--border-ink)",
                  borderRadius: "6px 7px 6px 5px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                aria-label={`Znak ${i + 1} z 6`}
              />
            ))}
          </div>

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={inputs.join("").length < 6}
            className="sketch-btn w-full py-3 font-semibold text-base"
            style={{
              background: inputs.join("").length === 6
                ? "var(--accent-primary)"
                : "var(--bg-muted)",
              color: inputs.join("").length === 6
                ? "#ffffff"
                : "var(--text-muted)",
              cursor: inputs.join("").length === 6 ? "pointer" : "not-allowed",
            }}
          >
            Połącz →
          </button>

        </div>
      </div>
    </div>
  )
}
```

---

## Notes

**`html5-qrcode` and the DOM element**: The library attaches a `<video>` and UI controls directly into `#qr-reader`. Do not put any children inside `<div id="qr-reader">`. The `minHeight: 260px` ensures the card doesn't collapse before the library injects its content.

**Dynamic import**: `html5-qrcode` uses `navigator.mediaDevices` internally on import. Importing it at module level will crash the Next.js build. Always `await import("html5-qrcode")` inside a `useEffect`.

**`calledRef`**: Without it, the scanner fires `onCode` on every frame that contains a valid QR — potentially dozens of times per second. The ref acts as a one-shot gate.

**Paste handling**: Pasting "ABCD12" into any of the 6 inputs distributes the characters and focuses the last filled box.

**`connecting` state note**: The placeholder "WebRTC zostanie wdrożone w Feature 07" is temporary. Feature 07 will replace this state with the actual peer connection flow.

---

## Check when done

- [ ] `npm run dev` — `/send` loads without errors
- [ ] Camera permission prompt appears on page load (not before)
- [ ] Camera feed is visible inside the scanner area
- [ ] Scanning the QR from `/receive` shows the "Łączenie…" screen with the code
- [ ] Camera denied → warning shown, manual input still works
- [ ] Manual input: typing 6 chars enables the "Połącz →" button
- [ ] Manual input: backspace on empty box moves focus to previous box
- [ ] Manual input: pasting a 6-char code fills all boxes
- [ ] "Połącz →" with complete valid code → "Łączenie…" screen
- [ ] "Połącz →" disabled (muted) when fewer than 6 chars entered
- [ ] Back link navigates to `/`
- [ ] Mobile (375px): scanner fills the card width, touch targets ≥ 48px
- [ ] `npm run build` passes
