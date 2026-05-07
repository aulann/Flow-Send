Read `CLAUDE.md` and all 6 context files before starting.

# Feature 06 — WebRTC Peer Connection

Wire up the actual P2P connection between `/receive` and `/send` using `simple-peer` for WebRTC and `partysocket` for signaling via the PartyKit server from Feature 03.

After this feature: scanning a QR code on `/send` triggers a real WebRTC data channel opening with the `/receive` page. Both pages show live connection state. No file transfer yet — that's Feature 09/10.

---

## How the connection flows

```
/receive opens                     /send scans QR
  └─ opens PartySocket "fs-CODE"     └─ opens PartySocket "fs-CODE"
  └─ status: "waiting"               └─ server sends peer-joined to receiver

receiver gets peer-joined
  └─ creates SimplePeer(initiator: true)
  └─ peer fires "signal" (offer) → send { type: "signal", data }

sender receives signal
  └─ creates SimplePeer(initiator: false)
  └─ peer.signal(offer) → fires own "signal" (answer + ICE) → send back

both exchange more ICE candidates via same { type: "signal" } messages

peer.on("connect") fires on both sides
  └─ status: "connected"
  └─ WebRTC data channel is open
```

---

## Files to create or update

| File | Action |
|------|--------|
| `types/session.ts` | Create — shared types |
| `store/session.store.ts` | Create — session state |
| `hooks/use-peer-connection.ts` | Replace stub |
| `components/receive/receive-waiting.tsx` | Update — wire hook, show connection states |
| `components/send/send-waiting.tsx` | Update — replace placeholder with real hook |

---

## `types/session.ts`

```typescript
export type PeerRole = "receiver" | "sender"

export type ConnectionStatus =
  | "idle"
  | "waiting"      // in PartyKit room, no peer yet
  | "signaling"    // SDP/ICE exchange in progress
  | "connected"    // WebRTC data channel open
  | "error"
  | "disconnected"
```

---

## `store/session.store.ts`

```typescript
import { create } from "zustand"
import type { PeerRole, ConnectionStatus } from "@/types/session"

interface SessionState {
  code: string | null
  role: PeerRole | null
  status: ConnectionStatus
  error: string | null
  setCode: (code: string) => void
  setRole: (role: PeerRole) => void
  setStatus: (status: ConnectionStatus) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  code: null,
  role: null,
  status: "idle",
  error: null,
  setCode: (code) => set({ code }),
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  reset: () => set({ code: null, role: null, status: "idle", error: null }),
}))
```

---

## `hooks/use-peer-connection.ts`

```typescript
"use client"
import { useEffect, useRef, useCallback } from "react"
import PartySocket from "partysocket"
import { useSessionStore } from "@/store/session.store"
import type { PeerRole } from "@/types/session"

export function usePeerConnection(
  role: PeerRole,
  code: string | null,
  onData: (data: string | ArrayBuffer) => void
) {
  const { status, error, setStatus, setError } = useSessionStore()
  const peerRef = useRef<import("simple-peer").Instance | null>(null)
  const socketRef = useRef<PartySocket | null>(null)

  const disconnect = useCallback(() => {
    peerRef.current?.destroy()
    socketRef.current?.close()
    peerRef.current = null
    socketRef.current = null
    setStatus("disconnected")
  }, [setStatus])

  useEffect(() => {
    if (!code) return

    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
      room: `fs-${code}`,
    })
    socketRef.current = socket
    setStatus("waiting")

    async function createPeer(initiator: boolean) {
      const SimplePeer = (await import("simple-peer")).default

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      })

      peer.on("signal", (data) => {
        socket.send(JSON.stringify({ type: "signal", data }))
      })

      peer.on("connect", () => setStatus("connected"))
      peer.on("data", (raw) => onData(raw))
      peer.on("error", (err) => {
        setError(err.message)
        setStatus("error")
      })
      peer.on("close", () => setStatus("disconnected"))

      peerRef.current = peer
      setStatus("signaling")
      return peer
    }

    socket.onmessage = async (event) => {
      const msg = JSON.parse(event.data as string)

      if (msg.type === "room-full") {
        setError("Sesja jest zajęta. Wróć do ekranu odbiorcy i spróbuj ponownie.")
        setStatus("error")
        socket.close()
        return
      }

      if (msg.type === "peer-left") {
        peerRef.current?.destroy()
        peerRef.current = null
        setStatus("disconnected")
        return
      }

      // Receiver: sender joined → become initiator and send offer
      if (msg.type === "peer-joined" && role === "receiver") {
        await createPeer(true)
        return
      }

      // Sender: first signal from receiver → create non-initiator and feed it
      if (msg.type === "signal" && role === "sender" && !peerRef.current) {
        const peer = await createPeer(false)
        peer.signal(msg.data)
        return
      }

      // All other signals: feed to existing peer
      if (msg.type === "signal" && peerRef.current) {
        peerRef.current.signal(msg.data)
      }
    }

    return () => {
      peerRef.current?.destroy()
      socket.close()
      peerRef.current = null
      socketRef.current = null
    }
  }, [code, role, onData, setStatus, setError])

  return { status, error, peerRef, disconnect }
}
```

### Key design notes

- **Dynamic import of `simple-peer`** inside `useEffect` — avoids SSR crash since `simple-peer` references browser globals at module level.
- **`{ type: "signal", data }`** — the server relays this opaquely (it broadcasts all messages). No need to differentiate offer/answer/ICE on the server.
- **Receiver is the initiator** — creates the WebRTC offer after `peer-joined`. Sender is non-initiator — waits for the offer.
- **Code change triggers reconnect automatically** — `useEffect` cleanup destroys the old peer and socket; new effect opens a fresh room.
- **`onData` must be stable** — callers must wrap it in `useCallback`. If it changes on every render, the effect re-runs and destroys the connection.

---

## Update `components/receive/receive-waiting.tsx`

Add the connection hook. The component has two visual phases: waiting for a peer (QR display) and connected.

```tsx
// Add to imports
import { useCallback } from "react"
import { usePeerConnection } from "@/hooks/use-peer-connection"

// Inside ReceiveWaiting(), after useReceiverSession():
const handleData = useCallback((data: string | ArrayBuffer) => {
  // Feature 09 will handle incoming data
  console.log("received data", data)
}, [])

const { status, error, disconnect } = usePeerConnection("receiver", code, handleData)

// Replace the outer return with a status-aware render:
if (status === "connected") {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="text-lg font-semibold" style={{ color: "var(--state-success)" }}>
          Połączono
        </div>
        <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
          Tablica odbioru zostanie zaimplementowana w Feature 11.
        </p>
        <button
          onClick={disconnect}
          className="sketch-btn px-5 py-2 text-sm font-medium"
          style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
        >
          Rozłącz
        </button>
      </div>
    </div>
  )
}

if (status === "error") {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="text-base font-semibold" style={{ color: "var(--state-error)" }}>
          Błąd połączenia
        </div>
        <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="sketch-btn px-5 py-2 text-sm font-medium"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  )
}

// Keep existing QR waiting UI for all other statuses (idle, waiting, signaling)
// Optionally: show a subtle status label above the countdown bar:
// status === "signaling" && <span>Łączenie…</span>
```

**Important**: The `useReceiverSession` hook regenerates the code every 30 seconds. If `status` is `"waiting"` or `"signaling"` and the code refreshes, `usePeerConnection` will automatically close the old PartyKit room and open a new one (via useEffect cleanup). If `status` is `"connected"`, stop the countdown — do not regenerate the code while connected.

To stop the countdown when connected, pass `status` into `useReceiverSession` or add a guard:

```typescript
// In useReceiverSession (hooks/use-session.ts), add a paused parameter:
export function useReceiverSession(paused = false) {
  // ...
  useEffect(() => {
    if (paused || secondsLeft <= 0) {
      if (!paused && secondsLeft <= 0) refresh()
      return
    }
    const timer = setTimeout(...)
    return () => clearTimeout(timer)
  }, [secondsLeft, refresh, paused])
}

// In receive-waiting.tsx:
const { code, secondsLeft, qrPayload } = useReceiverSession(status === "connected" || status === "signaling")
```

---

## Update `components/send/send-waiting.tsx`

Replace the `"connecting"` placeholder state with the real hook.

```tsx
// Add to imports
import { useCallback } from "react"
import { usePeerConnection } from "@/hooks/use-peer-connection"

// Remove the old pageState / capturedCode local state.
// Replace with:
const [code, setCode] = useState<string | null>(null)

const handleData = useCallback((data: string | ArrayBuffer) => {
  // Feature 09 will handle incoming data
  console.log("received data", data)
}, [])

const { status, error, disconnect } = usePeerConnection("sender", code, handleData)

// handleCode becomes:
const handleCode = useCallback((scanned: string) => {
  setCode(scanned)
}, [])
```

Show connection states at the top of the render:

```tsx
if (status === "connected") {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}>
      <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="text-lg font-semibold" style={{ color: "var(--state-success)" }}>
          Połączono
        </div>
        <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
          Wybór typu transferu zostanie zaimplementowany w Feature 09.
        </p>
        <button onClick={disconnect}
          className="sketch-btn px-5 py-2 text-sm font-medium"
          style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
          Rozłącz
        </button>
      </div>
    </div>
  )
}

if (status === "signaling" || status === "waiting") {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}>
      <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Łączenie…
        </div>
        <p className="text-xs" style={{ color: "var(--text-futed)" }}>{code}</p>
      </div>
    </div>
  )
}

if (status === "error") {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}>
      <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="text-base font-semibold" style={{ color: "var(--state-error)" }}>
          Błąd połączenia
        </div>
        <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>{error}</p>
        <button onClick={() => setCode(null)}
          className="sketch-btn px-5 py-2 text-sm font-medium"
          style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Skanuj ponownie
        </button>
      </div>
    </div>
  )
}

// status === "idle" or "disconnected" → show scanner UI (existing code)
```

---

## Environment variable

`NEXT_PUBLIC_PARTYKIT_HOST` must be set before testing:
- Local: `localhost:1999` (run `npx partykit dev`)
- Production: the URL from `npx partykit deploy`

Add to Vercel environment variables after deploying PartyKit.

---

## Check when done

- [ ] `/receive` page opens PartySocket room on load (visible in Network tab — WS connection to PartyKit)
- [ ] Opening `/send` and scanning the QR from `/receive` triggers `peer-joined` on the receiver
- [ ] Both pages show "Łączenie…" during signaling
- [ ] Both pages show "Połączono" with green text when WebRTC connects
- [ ] "Rozłącz" on either side → other side transitions to "disconnected" state
- [ ] Code refresh on `/receive` (every 30s) → old room closes, new room opens (verify in Network tab)
- [ ] Countdown pauses when status is `"signaling"` (code no longer regenerates mid-handshake)
- [ ] Third device joining shows "Sesja jest zajęta" error
- [ ] `npm run build` passes
