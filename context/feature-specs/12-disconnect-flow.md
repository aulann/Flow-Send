Read `CLAUDE.md` and all 6 context files before starting.

# Feature 12 — Disconnect Flow

Handle all disconnect scenarios on both sides: user-initiated disconnect, remote peer leaving, and connection error. In every case: clear all session state, clear transfer store, and redirect to `/`.

---

## Disconnect scenarios

| Trigger | Source | What happens in WebRTC |
|---------|--------|------------------------|
| User clicks "Rozłącz" | either side | `disconnect()` → `peerRef.current.destroy()` → `setStatus("disconnected")` |
| Other side disconnects | remote | `peer.on("close")` → `setStatus("disconnected")` |
| `peer-left` from PartyKit | remote | `peerRef.current.destroy()` → `setStatus("disconnected")` |
| WebRTC error | local | `peer.on("error")` → `setStatus("error")` |

All cases eventually result in `status === "disconnected"` or `status === "error"`. Components watch for these states and handle cleanup + redirect.

---

## Strategy

**Do not put navigation logic in `usePeerConnection`** — hooks should not push routes.

Instead: each connected component (`SendWaiting`, `ReceiveWaiting`) watches `status` via a `useEffect`:

```tsx
const router = useRouter()

useEffect(() => {
  if (status === "disconnected") {
    useTransferStore.getState().clear()
    useSessionStore.getState().reset()
    router.push("/")
  }
}, [status, router])
```

This catches ALL disconnect causes: user-initiated, remote disconnect, peer-left.

---

## Cleanup on disconnect

Order matters:

1. `useTransferStore.getState().clear()` — revokes blob URLs, clears items + inProgress + sendingProgress
2. `useSessionStore.getState().reset()` — clears code, role, status → "idle", error, deviceInfo
3. `router.push("/")` — navigates to landing

The `clear()` in `transfer.store.ts` already revokes blob URLs. The `reset()` in `session.store.ts` resets all fields.

---

## Files to update

| File | Change |
|------|--------|
| `store/session.store.ts` | Verify `reset()` clears `deviceInfo` too — add if missing |
| `components/send/send-waiting.tsx` | Add disconnect button to connected state + add redirect effect |
| `components/receive/receive-waiting.tsx` | Add redirect effect (Rozłącz button already exists) |

No changes to `usePeerConnection` — `disconnect()` already destroys the peer and calls `setStatus("disconnected")`.

---

## `store/session.store.ts`

Ensure `reset()` resets `deviceInfo` to `null`. Current implementation may not. Replace reset with:

```typescript
reset: () => set({
  code: null,
  role: null,
  status: "idle",
  error: null,
  deviceInfo: null,
}),
```

---

## `components/send/send-waiting.tsx`

### 1. Add router and redirect effect

Add at the top of the component, after the existing hooks:

```tsx
import { useRouter } from "next/navigation"
import { useTransferStore } from "@/store/transfer.store"

// inside SendWaiting():
const router = useRouter()

useEffect(() => {
  if (status === "disconnected") {
    useTransferStore.getState().clear()
    useSessionStore.getState().reset()
    router.push("/")
  }
}, [status, router])
```

### 2. Add "Rozłącz" button to connected state

The sender's connected state currently has no way to end the session. Add it below the TransferPanel card:

```tsx
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
          <TransferPanel
            onSendText={sendText}
            onSendFile={handleSendFiles}
          />
        </div>
        <button
          onClick={disconnect}
          className="sketch-btn w-full py-2 text-sm font-medium"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
        >
          Rozłącz
        </button>
      </div>
    </div>
  )
}
```

### 3. Add home button to error state

Update the error state to include a "Strona główna" link alongside the retry button:

```tsx
if (status === "error") {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="text-base font-semibold" style={{ color: "var(--state-error)" }}>
          Błąd połączenia
        </div>
        <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
          {error}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setCode(null)}
            className="sketch-btn flex-1 py-2 text-sm font-medium"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            Skanuj ponownie
          </button>
          <Link
            href="/"
            className="sketch-btn flex-1 py-2 text-sm font-medium text-center"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
          >
            Strona główna
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## `components/receive/receive-waiting.tsx`

### 1. Add router and redirect effect

Add inside `ReceiveWaiting()`:

```tsx
import { useRouter } from "next/navigation"
import { useTransferStore } from "@/store/transfer.store"

const router = useRouter()

useEffect(() => {
  if (status === "disconnected") {
    useTransferStore.getState().clear()
    useSessionStore.getState().reset()
    router.push("/")
  }
}, [status, router])
```

The "Rozłącz" button already calls `disconnect()` which sets `status = "disconnected"`, which the effect above catches. No changes needed to the button itself.

### 2. Add home button to error state

Same pattern as sender — add a "Strona główna" link next to "Spróbuj ponownie":

```tsx
<div className="flex gap-3 w-full">
  <button
    onClick={() => window.location.reload()}
    className="sketch-btn flex-1 py-2 text-sm font-medium"
    style={{ background: "var(--accent-primary)", color: "#fff" }}
  >
    Spróbuj ponownie
  </button>
  <Link
    href="/"
    className="sketch-btn flex-1 py-2 text-sm font-medium text-center"
    style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
  >
    Strona główna
  </Link>
</div>
```

---

## Check when done

- [ ] Clicking "Rozłącz" on sender → store cleared → redirect to `/`
- [ ] Clicking "Rozłącz" on receiver → store cleared → redirect to `/`
- [ ] If OTHER side disconnects first → this side auto-redirects to `/`
- [ ] On error state: "Strona główna" link available on both sides
- [ ] After redirect to `/`, scanning a new QR works (no stale state)
- [ ] Blob URLs are revoked on disconnect (no memory leak)
- [ ] `npm run build` passes
