Read `CLAUDE.md` and all 6 context files before starting.

# Feature 09 — File Transfer (Image, Video, File)

Implement chunked binary file transfer over the WebRTC data channel. Activates the three remaining transfer type tiles (Zdjęcie, Wideo, Plik). Sender picks a file, it is split into 64 KB chunks and streamed to the receiver who reassembles it into a Blob and shows a download/preview card.

Single file at a time — no concurrent queue in v1.

---

## Files to create or update

| File | Action |
|------|--------|
| `types/transfer.ts` | Update — add FileStartFrame, FileEndFrame, InProgressTransfer; expand TransferItem |
| `lib/transfer.ts` | Replace stub — chunking, size formatting |
| `store/transfer.store.ts` | Update — add inProgress tracking |
| `hooks/use-transfer.ts` | Update — handle binary chunks, file-start/end frames |
| `components/send/transfer-panel.tsx` | Update — enable file tiles, file input, progress bar |
| `components/receive/receive-board.tsx` | Update — file item cards with preview + download |

---

## `types/transfer.ts`

Replace the entire file:

```typescript
import type { DeviceType } from "@/types/session"

export type TransferSubtype = "text" | "link" | "image" | "video" | "file"

// ─── Control frames ───────────────────────────────────────────────────────────

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
  subtype: "text" | "link"
}

export interface FileStartFrame {
  type: "file-start"
  id: string
  name: string
  size: number
  mimeType: string
  totalChunks: number
}

export interface FileEndFrame {
  type: "file-end"
  id: string
}

export interface RemoveFrame {
  type: "remove"
  id: string
}

export type ControlFrame =
  | DeviceInfoFrame
  | TextFrame
  | FileStartFrame
  | FileEndFrame
  | RemoveFrame

// ─── Transfer items (stored after receipt) ───────────────────────────────────

export type TextTransferItem = {
  id: string
  subtype: "text" | "link"
  content: string
  receivedAt: number
}

export type FileTransferItem = {
  id: string
  subtype: "image" | "video" | "file"
  name: string
  mimeType: string
  size: number
  blobUrl: string   // URL.createObjectURL — must be revoked on remove
  receivedAt: number
}

export type TransferItem = TextTransferItem | FileTransferItem

// ─── In-progress receive buffer ───────────────────────────────────────────────

export interface InProgressTransfer {
  id: string
  name: string
  mimeType: string
  size: number
  totalChunks: number
  chunks: ArrayBuffer[]
  receivedChunks: number
}
```

---

## `lib/transfer.ts`

```typescript
export const CHUNK_SIZE = 64 * 1024 // 64 KB

export async function* chunkFile(file: File): AsyncGenerator<ArrayBuffer> {
  let offset = 0
  while (offset < file.size) {
    yield await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer()
    offset += CHUNK_SIZE
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function mimeToSubtype(mime: string): "image" | "video" | "file" {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  return "file"
}
```

---

## `store/transfer.store.ts`

Add `inProgress` and `sendingProgress` fields:

```typescript
import { create } from "zustand"
import type { TransferItem, InProgressTransfer } from "@/types/transfer"

interface TransferState {
  items: TransferItem[]
  inProgress: InProgressTransfer | null
  sendingProgress: number   // 0–100, sender side
  addItem: (item: TransferItem) => void
  removeItem: (id: string) => void
  setInProgress: (t: InProgressTransfer | null) => void
  setSendingProgress: (pct: number) => void
  clear: () => void
}

export const useTransferStore = create<TransferState>((set) => ({
  items: [],
  inProgress: null,
  sendingProgress: 0,
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) => set((s) => {
    const item = s.items.find((i) => i.id === id)
    if (item && "blobUrl" in item) URL.revokeObjectURL(item.blobUrl)
    return { items: s.items.filter((i) => i.id !== id) }
  }),
  setInProgress: (t) => set({ inProgress: t }),
  setSendingProgress: (pct) => set({ sendingProgress: pct }),
  clear: () => set((s) => {
    s.items.forEach((i) => { if ("blobUrl" in i) URL.revokeObjectURL(i.blobUrl) })
    return { items: [], inProgress: null, sendingProgress: 0 }
  }),
}))
```

`removeItem` revokes the blob URL when a file item is deleted — prevents memory leaks.

---

## `hooks/use-transfer.ts`

Extend to handle binary chunks and file-start/end frames:

```typescript
"use client"
import { useCallback, useRef } from "react"
import { useTransferStore } from "@/store/transfer.store"
import { chunkFile, mimeToSubtype, CHUNK_SIZE } from "@/lib/transfer"
import type {
  TextFrame, FileStartFrame, ControlFrame, TransferSubtype
} from "@/types/transfer"

export function useTransfer(send: (data: string | ArrayBuffer) => void) {
  const { addItem, removeItem, setInProgress, setSendingProgress } = useTransferStore()
  const isSending = useRef(false)

  // ── Sender ──────────────────────────────────────────────────────────────────

  const sendText = useCallback(
    (content: string, subtype: "text" | "link") => {
      const id = crypto.randomUUID()
      const frame: TextFrame = { type: "text", id, content, subtype }
      send(JSON.stringify(frame))
    },
    [send]
  )

  const sendFile = useCallback(
    async (file: File, peerRef: React.RefObject<import("simple-peer").Instance | null>) => {
      if (isSending.current) return
      isSending.current = true
      setSendingProgress(0)

      const id = crypto.randomUUID()
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      const subtype = mimeToSubtype(file.type)

      // Announce file
      const startFrame: FileStartFrame = {
        type: "file-start", id,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        totalChunks,
      }
      send(JSON.stringify(startFrame))

      // Stream chunks with backpressure
      let sent = 0
      for await (const chunk of chunkFile(file)) {
        // Backpressure: wait for RTCDataChannel buffer to drain
        const channel = (peerRef.current as any)?._channel as RTCDataChannel | undefined
        while (channel && channel.bufferedAmount > 1 * 1024 * 1024) {
          await new Promise((r) => setTimeout(r, 20))
        }
        send(chunk)
        sent++
        setSendingProgress(Math.round((sent / totalChunks) * 100))
      }

      // Signal end
      send(JSON.stringify({ type: "file-end", id }))
      setSendingProgress(100)
      setTimeout(() => setSendingProgress(0), 800)
      isSending.current = false
    },
    [send, setSendingProgress]
  )

  // ── Receiver ─────────────────────────────────────────────────────────────────

  const handleIncoming = useCallback(
    (raw: string | ArrayBuffer) => {
      // Binary chunk
      if (raw instanceof ArrayBuffer) {
        useTransferStore.setState((s) => {
          if (!s.inProgress) return s
          const updated = {
            ...s.inProgress,
            chunks: [...s.inProgress.chunks, raw],
            receivedChunks: s.inProgress.receivedChunks + 1,
          }
          return { inProgress: updated }
        })
        return
      }

      // JSON control frame
      try {
        const msg = JSON.parse(raw) as ControlFrame

        if (msg.type === "text") {
          addItem({ id: msg.id, subtype: msg.subtype, content: msg.content, receivedAt: Date.now() })
          return
        }

        if (msg.type === "file-start") {
          setInProgress({
            id: msg.id,
            name: msg.name,
            mimeType: msg.mimeType,
            size: msg.size,
            totalChunks: msg.totalChunks,
            chunks: [],
            receivedChunks: 0,
          })
          return
        }

        if (msg.type === "file-end") {
          useTransferStore.setState((s) => {
            if (!s.inProgress || s.inProgress.id !== msg.id) return s
            const { name, mimeType, size, chunks } = s.inProgress
            const blob = new Blob(chunks, { type: mimeType })
            const blobUrl = URL.createObjectURL(blob)
            const subtype = mimeToSubtype(mimeType)
            const item = { id: msg.id, subtype, name, mimeType, size, blobUrl, receivedAt: Date.now() }
            return { inProgress: null, items: [...s.items, item] }
          })
          return
        }

        if (msg.type === "remove") {
          removeItem(msg.id)
        }
      } catch {}
    },
    [addItem, removeItem, setInProgress]
  )

  return { sendText, sendFile, handleIncoming }
}
```

**Note**: `sendFile` needs `peerRef` to access `RTCDataChannel.bufferedAmount` for backpressure. Pass `peerRef` from the component (which gets it from `usePeerConnection`).

---

## Update `components/send/transfer-panel.tsx`

Enable image/video/file tiles and add file input + progress bar:

```tsx
"use client"
import { useState, useRef } from "react"
import {
  TextTIcon, ImageIcon, FilmStripIcon, FileIcon, LinkIcon
} from "@phosphor-icons/react"
import { useTransferStore } from "@/store/transfer.store"
import { formatFileSize } from "@/lib/transfer"
import type { TransferSubtype } from "@/types/transfer"
import type SimplePeer from "simple-peer"

interface TransferPanelProps {
  onSendText: (content: string, subtype: "text" | "link") => void
  onSendFile: (file: File) => void
}

const types: { subtype: TransferSubtype; icon: React.ElementType; label: string; accept: string }[] = [
  { subtype: "text", icon: TextTIcon, label: "Tekst", accept: "" },
  { subtype: "link", icon: LinkIcon, label: "Link", accept: "" },
  { subtype: "image", icon: ImageIcon, label: "Zdjęcie", accept: "image/*" },
  { subtype: "video", icon: FilmStripIcon, label: "Wideo", accept: "video/*" },
  { subtype: "file", icon: FileIcon, label: "Plik", accept: "*/*" },
]

export function TransferPanel({ onSendText, onSendFile }: TransferPanelProps) {
  const [selected, setSelected] = useState<TransferSubtype>("text")
  const [value, setValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sendingProgress = useTransferStore((s) => s.sendingProgress)
  const isSending = sendingProgress > 0 && sendingProgress < 100

  function handleSendText() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSendText(trimmed, selected as "text" | "link")
    setValue("")
  }

  function handleTileClick(subtype: TransferSubtype) {
    setSelected(subtype)
    if (subtype === "image" || subtype === "video" || subtype === "file") {
      fileInputRef.current?.click()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onSendFile(file)
    e.target.value = "" // reset so same file can be picked again
  }

  const currentType = types.find((t) => t.subtype === selected)!
  const isFileTile = selected === "image" || selected === "video" || selected === "file"

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={currentType.accept}
        onChange={handleFileChange}
      />

      {/* Type selector */}
      <div className="flex gap-2">
        {types.map(({ subtype, icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => handleTileClick(subtype)}
            disabled={isSending}
            className="flex-1 flex flex-col items-center gap-1 py-3"
            style={{
              background: subtype === selected
                ? "var(--accent-primary-dim)"
                : "var(--bg-subtle)",
              border: `2px solid ${subtype === selected ? "var(--accent-primary)" : "var(--border-light)"}`,
              borderRadius: "8px 9px 8px 7px",
              cursor: isSending ? "not-allowed" : "pointer",
              opacity: isSending ? 0.5 : 1,
            }}
          >
            <Icon
              size={20}
              weight={subtype === selected ? "bold" : "regular"}
              style={{ color: subtype === selected ? "var(--accent-primary)" : "var(--text-muted)" }}
            />
            <span className="text-xs font-medium"
              style={{ color: subtype === selected ? "var(--accent-primary)" : "var(--text-muted)" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Progress bar — visible while sending a file */}
      {isSending && (
        <div className="flex flex-col gap-1">
          <div className="w-full h-[4px] overflow-hidden"
            style={{ background: "var(--border-subtle)", borderRadius: "2px" }}>
            <div style={{
              height: "100%",
              width: `${sendingProgress}%`,
              background: "var(--accent-primary)",
              borderRadius: "2px",
              transition: "width 0.1s linear",
            }} />
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Wysyłanie… {sendingProgress}%
          </span>
        </div>
      )}

      {/* Text / link input — only for text/link tiles */}
      {!isFileTile && (
        <>
          {selected === "text" ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText() } }}
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
              onKeyDown={(e) => e.key === "Enter" && handleSendText()}
              placeholder="https://..."
              className="sketch-input w-full p-3 text-sm"
              style={{ color: "var(--text-primary)" }}
            />
          )}
          <button
            onClick={handleSendText}
            disabled={!value.trim() || isSending}
            className="sketch-btn w-full py-3 font-semibold text-base"
            style={{
              background: value.trim() && !isSending ? "var(--accent-primary)" : "var(--bg-muted)",
              color: value.trim() && !isSending ? "#ffffff" : "var(--text-muted)",
              cursor: value.trim() && !isSending ? "pointer" : "not-allowed",
            }}
          >
            Wyślij →
          </button>
        </>
      )}

      {/* File tile hint */}
      {isFileTile && !isSending && (
        <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
          Kliknij kafelek ponownie aby wybrać plik
        </p>
      )}
    </div>
  )
}
```

---

## Update `components/send/send-waiting.tsx` (connected block)

Pass `peerRef` to `sendFile`:

```tsx
const { sendText, sendFile } = useTransfer(send)

// In TransferPanel:
<TransferPanel
  onSendText={sendText}
  onSendFile={(file) => sendFile(file, peerRef)}
/>
```

---

## Update `components/receive/receive-board.tsx`

Add file item card variant with image preview and download:

```tsx
import { formatFileSize } from "@/lib/transfer"

// Replace ItemCard with a version that handles both types:
function ItemCard({ item, onRemove }: { item: TransferItem; onRemove: (id: string) => void }) {
  if ("blobUrl" in item) {
    // File item
    return (
      <div className="sketch-card p-4 flex flex-col gap-3">
        {item.subtype === "image" && (
          <img
            src={item.blobUrl}
            alt={item.name}
            className="w-full rounded"
            style={{ maxHeight: "200px", objectFit: "cover", borderRadius: "8px 9px 7px 8px" }}
          />
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate flex-1" style={{ color: "var(--text-primary)" }}>
            {item.name}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            {formatFileSize(item.size)}
          </span>
        </div>
        <div className="flex gap-2 justify-end">
          <a
            href={item.blobUrl}
            download={item.name}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
            style={{
              background: "var(--accent-primary-dim)",
              border: "1.5px solid var(--accent-primary)",
              borderRadius: "6px 7px 6px 5px",
              color: "var(--accent-primary)",
              textDecoration: "none",
            }}
          >
            Pobierz
          </a>
          <button
            onClick={() => onRemove(item.id)}
            className="inline-flex items-center px-3 py-1.5 text-xs"
            style={{
              background: "var(--bg-subtle)",
              border: "1.5px solid var(--border-light)",
              borderRadius: "6px 7px 6px 5px",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // Text/link item — same as Feature 08
  // ...existing text item card code...
}
```

Also show in-progress transfer indicator above the items list:

```tsx
const inProgress = useTransferStore((s) => s.inProgress)

// At the top of ReceiveBoard return:
{inProgress && (
  <div className="sketch-card p-4 flex flex-col gap-2">
    <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
      <span className="truncate">{inProgress.name}</span>
      <span>{Math.round((inProgress.receivedChunks / inProgress.totalChunks) * 100)}%</span>
    </div>
    <div className="w-full h-[4px]" style={{ background: "var(--border-subtle)", borderRadius: "2px" }}>
      <div style={{
        height: "100%",
        width: `${Math.round((inProgress.receivedChunks / inProgress.totalChunks) * 100)}%`,
        background: "var(--accent-primary)",
        borderRadius: "2px",
        transition: "width 0.15s linear",
      }} />
    </div>
  </div>
)}
```

---

## Check when done

- [ ] Selecting Zdjęcie/Wideo/Plik tile opens native file picker
- [ ] Picking an image sends `file-start` + chunks + `file-end` (visible in browser console)
- [ ] Receiver shows in-progress bar filling during transfer
- [ ] After `file-end`: image appears as preview card on receiver
- [ ] "Pobierz" link downloads the file with original filename
- [ ] Picking a non-image file: no preview, just filename + size + download
- [ ] Progress bar on sender side fills 0→100% and disappears after ~800ms
- [ ] Large file (5 MB): transfers without freezing UI (backpressure working)
- [ ] Removing a file item from the board revokes the blob URL (no memory leak)
- [ ] Text/link still works after file transfer
- [ ] `npm run build` passes
