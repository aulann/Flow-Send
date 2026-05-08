Read `CLAUDE.md` and all 6 context files before starting.

# Feature 08 — Text & Link Transfer

Implement the first two transfer types: **tekst** and **link**. After this feature both peers are fully connected and can exchange text/URL content in real time over the WebRTC data channel.

Image, video, and file transfers are **not** implemented here — their tiles are shown in the selector but disabled. The full receive board (pin board with rotated cards) comes in Feature 11 — for now a minimal list suffices.

---

## Files to create or update

| File | Action |
|------|--------|
| `types/transfer.ts` | Expand — add TextFrame, RemoveFrame, TransferItem |
| `store/transfer.store.ts` | Replace stub |
| `hooks/use-transfer.ts` | Replace stub |
| `hooks/use-peer-connection.ts` | Update — expose `send` function |
| `components/send/transfer-panel.tsx` | Create — type selector + input + send |
| `components/receive/receive-board.tsx` | Create — minimal received items list |
| `components/send/send-waiting.tsx` | Update — replace connected placeholder |
| `components/receive/receive-waiting.tsx` | Update — replace connected placeholder |

---

## `types/transfer.ts`

```typescript
import type { DeviceType } from "@/types/session"

export type TransferSubtype = "text" | "link"

// Control frames sent over WebRTC data channel
export interface DeviceInfoFrame {
  type: "device-info"
  deviceType: DeviceType
  deviceName: string
  location: { city: string; country: string }
}

export interface TextFrame {
  type: "text"
  id: string
  content: string
  subtype: TransferSubtype
}

export interface RemoveFrame {
  type: "remove"
  id: string
}

export type ControlFrame = DeviceInfoFrame | TextFrame | RemoveFrame

// Item stored in transfer store after receipt
export interface TransferItem {
  id: string
  subtype: TransferSubtype
  content: string
  receivedAt: number
}
```

---

## `store/transfer.store.ts`

```typescript
import { create } from "zustand"
import type { TransferItem } from "@/types/transfer"

interface TransferState {
  items: TransferItem[]
  addItem: (item: TransferItem) => void
  removeItem: (id: string) => void
  clear: () => void
}

export const useTransferStore = create<TransferState>((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}))
```

---

## `hooks/use-transfer.ts`

```typescript
"use client"
import { useCallback } from "react"
import { useTransferStore } from "@/store/transfer.store"
import type { TextFrame, TransferSubtype } from "@/types/transfer"

export function useTransfer(send: (data: string) => void) {
  const addItem = useTransferStore((s) => s.addItem)

  const sendText = useCallback(
    (content: string, subtype: TransferSubtype) => {
      const id = crypto.randomUUID()
      const frame: TextFrame = { type: "text", id, content, subtype }
      send(JSON.stringify(frame))
    },
    [send]
  )

  const handleIncoming = useCallback(
    (raw: string | ArrayBuffer) => {
      if (typeof raw !== "string") return
      try {
        const msg = JSON.parse(raw) as ControlFrame
        if (msg.type === "text") {
          addItem({
            id: msg.id,
            subtype: msg.subtype,
            content: msg.content,
            receivedAt: Date.now(),
          })
        }
      } catch {}
    },
    [addItem]
  )

  return { sendText, handleIncoming }
}
```

Import `ControlFrame` from `@/types/transfer` at the top.

---

## Update `hooks/use-peer-connection.ts`

Add a `send` helper to the return value so components can write to the data channel without accessing `peerRef` directly:

```typescript
const send = useCallback((data: string | ArrayBuffer) => {
  peerRef.current?.send(data as never)
}, [])

// Add to return:
return { status, error, peerRef, send, disconnect }
```

---

## `components/send/transfer-panel.tsx`

Shown on the sender side after connection. Selector for 5 transfer types (only text + link active), dynamic input, and send button.

```tsx
"use client"
import { useState } from "react"
import {
  TextTIcon,
  ImageIcon,
  FilmStripIcon,
  FileIcon,
  LinkIcon,
} from "@phosphor-icons/react"
import type { TransferSubtype } from "@/types/transfer"

interface TransferPanelProps {
  onSend: (content: string, subtype: TransferSubtype) => void
}

const types = [
  { subtype: "text" as TransferSubtype, icon: TextTIcon, label: "Tekst", active: true },
  { subtype: "link" as TransferSubtype, icon: LinkIcon, label: "Link", active: true },
  { subtype: null, icon: ImageIcon, label: "Zdjęcie", active: false },
  { subtype: null, icon: FilmStripIcon, label: "Wideo", active: false },
  { subtype: null, icon: FileIcon, label: "Plik", active: false },
]

export function TransferPanel({ onSend }: TransferPanelProps) {
  const [selected, setSelected] = useState<TransferSubtype>("text")
  const [value, setValue] = useState("")

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed, selected)
    setValue("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Type selector */}
      <div className="flex gap-2">
        {types.map(({ subtype, icon: Icon, label, active }) => (
          <button
            key={label}
            disabled={!active}
            onClick={() => active && subtype && setSelected(subtype)}
            className="flex-1 flex flex-col items-center gap-1 py-3"
            style={{
              background: active && subtype === selected
                ? "var(--accent-primary-dim)"
                : "var(--bg-subtle)",
              border: `2px solid ${active && subtype === selected ? "var(--accent-primary)" : "var(--border-light)"}`,
              borderRadius: "8px 9px 8px 7px",
              opacity: active ? 1 : 0.4,
              cursor: active ? "pointer" : "not-allowed",
            }}
          >
            <Icon
              size={20}
              weight={active && subtype === selected ? "bold" : "regular"}
              style={{ color: active && subtype === selected ? "var(--accent-primary)" : "var(--text-muted)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: active && subtype === selected ? "var(--accent-primary)" : "var(--text-muted)" }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Input */}
      {selected === "text" ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Wpisz tekst… (Enter aby wysłać)"
          rows={3}
          className="sketch-input w-full resize-none p-3 text-sm"
          style={{ color: "var(--text-primary)" }}
        />
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="https://..."
          className="sketch-input w-full p-3 text-sm"
          style={{ color: "var(--text-primary)" }}
        />
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!value.trim()}
        className="sketch-btn w-full py-3 font-semibold text-base"
        style={{
          background: value.trim() ? "var(--accent-primary)" : "var(--bg-muted)",
          color: value.trim() ? "#ffffff" : "var(--text-muted)",
          cursor: value.trim() ? "pointer" : "not-allowed",
        }}
      >
        Wyślij →
      </button>

    </div>
  )
}
```

---

## `components/receive/receive-board.tsx`

Minimal received items list. The full pin-board (rotated sketch cards, dot-grid background) comes in Feature 11 — this is a functional placeholder.

```tsx
"use client"
import { CopyIcon, LinkIcon, TextTIcon, TrashIcon } from "@phosphor-icons/react"
import { useTransferStore } from "@/store/transfer.store"
import type { TransferItem } from "@/types/transfer"

function ItemCard({ item, onRemove }: { item: TransferItem; onRemove: (id: string) => void }) {
  const isLink = item.subtype === "link"

  function handleCopy() {
    navigator.clipboard.writeText(item.content).catch(() => {})
  }

  return (
    <div
      className="sketch-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-start gap-2">
        {isLink
          ? <LinkIcon size={16} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: 2 }} />
          : <TextTIcon size={16} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
        }
        {isLink ? (
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm break-all"
            style={{ color: "var(--accent-primary)" }}
          >
            {item.content}
          </a>
        ) : (
          <p className="text-sm break-words whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
            {item.content}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
          style={{
            background: "var(--bg-subtle)",
            border: "1.5px solid var(--border-light)",
            borderRadius: "6px 7px 6px 5px",
            color: "var(--text-secondary)",
          }}
        >
          <CopyIcon size={13} />
          Kopiuj
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
          style={{
            background: "var(--bg-subtle)",
            border: "1.5px solid var(--border-light)",
            borderRadius: "6px 7px 6px 5px",
            color: "var(--text-muted)",
          }}
        >
          <TrashIcon size={13} />
        </button>
      </div>
    </div>
  )
}

export function ReceiveBoard() {
  const { items, removeItem } = useTransferStore()

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 gap-2"
        style={{
          border: "2px dashed var(--border-light)",
          borderRadius: "12px 13px 11px 12px",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Czekam na pliki…
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onRemove={removeItem} />
      ))}
    </div>
  )
}
```

---

## Update `components/send/send-waiting.tsx`

Replace the `status === "connected"` block with:

```tsx
import { useCallback } from "react"
import { DeviceBadge } from "@/components/shared/device-badge"
import { TransferPanel } from "@/components/send/transfer-panel"
import { useTransfer } from "@/hooks/use-transfer"
import { useSessionStore } from "@/store/session.store"

// Inside component, after usePeerConnection:
const deviceInfo = useSessionStore((s) => s.deviceInfo)
const { sendText } = useTransfer(send) // `send` from usePeerConnection

// connected state:
if (status === "connected") {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
        {deviceInfo && <DeviceBadge device={deviceInfo} label="Połączono z" />}
        <div className="sketch-card p-5">
          <TransferPanel onSend={sendText} />
        </div>
      </div>
    </div>
  )
}
```

---

## Update `components/receive/receive-waiting.tsx`

Replace the `status === "connected"` block with:

```tsx
import { useCallback } from "react"
import { DeviceBadge } from "@/components/shared/device-badge"
import { ReceiveBoard } from "@/components/receive/receive-board"
import { useTransfer } from "@/hooks/use-transfer"
import { useSessionStore } from "@/store/session.store"
import { useTransferStore } from "@/store/transfer.store"

// Inside component — pass handleIncoming as onData to usePeerConnection:
const { handleIncoming } = useTransfer(() => {}) // send is no-op on receiver side
const { status, error, send, disconnect } = usePeerConnection(
  "receiver",
  code,
  handleIncoming  // ← was previously a console.log placeholder
)

const deviceInfo = useSessionStore((s) => s.deviceInfo)

// connected state:
if (status === "connected") {
  return (
    <div
      className="min-h-screen flex flex-col px-4 py-6"
      style={{ background: "var(--bg-subtle)" }}
    >
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
        {deviceInfo && <DeviceBadge device={deviceInfo} label="Połączono z" />}
        <ReceiveBoard />
        <button
          onClick={disconnect}
          className="sketch-btn py-2 text-sm font-medium"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
        >
          Rozłącz
        </button>
      </div>
    </div>
  )
}
```

**Important**: `handleIncoming` must be stable — wrap in `useCallback` or it will re-trigger `usePeerConnection`'s `useEffect` on every render. Since `useTransfer` already wraps it in `useCallback`, this is handled — but make sure `handleIncoming` is declared before `usePeerConnection` in the component body.

---

## Check when done

- [ ] After connection: sender shows device badge + transfer type selector
- [ ] Text type selected by default; link switches to URL input
- [ ] Typing text and pressing Enter (or "Wyślij →") sends the frame
- [ ] Sent text appears immediately on receiver's board
- [ ] Sent link appears as a clickable `<a>` on receiver's board
- [ ] "Kopiuj" copies the content to clipboard
- [ ] Trash icon removes the item from the board
- [ ] Image/video/file tiles are visible but disabled (opacity 0.4, not clickable)
- [ ] Sending multiple items — all appear in order on receiver
- [ ] `npm run build` passes
