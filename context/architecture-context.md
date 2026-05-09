# Architecture Context

## Stack

| Layer | Technology | Role |
|-------|------------|------|
| Framework | Next.js 16 + TypeScript | Full-stack app, server/client boundaries |
| UI | Tailwind v4 + shadcn/ui | Component composition and styling |
| Icons | Phosphor Icons (`@phosphor-icons/react`) | All icons throughout the app |
| Signaling | PartyKit | WebSocket rooms for WebRTC peer setup |
| P2P Transfer | WebRTC via `simple-peer` | Direct browser-to-browser file transfer |
| NAT Traversal | Google STUN (free) | `stun:stun.l.google.com:19302` |
| QR Generation | `react-qr-code` | SVG QR codes, SSR-safe |
| QR Scanning | `html5-qrcode` | Camera-based QR scanning in browser |
| Client State | Zustand | Session state, transfer queue, peer connection metadata |
| Deployment | Vercel (Next.js) + PartyKit (Workers) | Frontend + signaling |

## System Boundaries

- `app/` — Next.js pages and API routes. Pages are server components by default. API routes handle device detection and IP geolocation only.
- `party/` — PartyKit signaling server (`server.ts`). Relays WebRTC SDP and ICE messages. Enforces 2-device room limit. No business logic.
- `lib/` — Shared utilities: session ID generation, device detection (user-agent), IP geolocation, file chunking, QR payload parsing.
- `components/` — UI composition only. No business logic in components.
- `hooks/` — Client-side React hooks: `usePeerConnection`, `useSession`, `useTransfer`, `useQrScanner`.
- `store/` — Zustand stores: `session.store.ts`, `transfer.store.ts`.
- `types/` — Shared TypeScript interfaces and enums.

## Session Lifecycle

Sessions are stateless on the server — no database, no file storage.

```
1. Receiver navigates to /receive
2. Client generates a 6-character alphanumeric session code
3. Client creates a PartyKit room: "fs-{code}"
4. QR encodes the URL: https://flow-send.vercel.app/send?code={code}
5. 30-second countdown timer starts; if it expires with no connection → new code + new room
6. Sender navigates to /send, scans QR or enters code
7. Sender joins the PartyKit room "fs-{code}"
8. PartyKit relays WebRTC offer → answer → ICE candidates between peers
9. WebRTC data channel established (P2P); PartyKit room no longer needed for data
10. PartyKit room is locked (rejects any third connection attempt)
11. Session ends when either peer's WebRTC connection drops or they disconnect
12. All data in browser memory is discarded on session end
```

## Transfer Flow Diagram

```
Sender Browser              PartyKit Room             Receiver Browser
      |                          |                           |
      |──── JOIN "fs-ABCD1" ────>|                           |
      |                          |<──── JOIN "fs-ABCD1" ─────|
      |                          |                           |
      |<─── SDP offer (receiver) |                           |
      |─── SDP answer (sender) ──>──── SDP answer ──────────>|
      |                          |                           |
      |<── ICE candidates ───────>──── ICE candidates ──────>|
      |                          |                           |
      |<════════════ WebRTC P2P Data Channel ════════════════>|
      |   (files, text, links travel here — not via server)  |
```

## Transfer Protocol

All messages over the WebRTC data channel are either JSON control frames or raw binary chunks.

### Control frames (JSON strings)
```typescript
// Announce incoming file before sending chunks
{ type: "file-start", id: string, name: string, size: number, mimeType: string, totalChunks: number }

// Signal end of file transfer
{ type: "file-end", id: string }

// Text or link transfer (no chunks)
{ type: "text", id: string, content: string, subtype: "text" | "link" }

// Remote peer requests to remove an item from the board
{ type: "remove", id: string }
```

### File chunks (binary ArrayBuffer)
- Chunk size: 64 KB
- Sender monitors `bufferedAmount` and pauses when the buffer is full
- Receiver reassembles chunks by `id` in order

## Data Model

There is no database. All state is ephemeral and in-browser.

| Location | What it holds | Lifetime |
|----------|---------------|----------|
| Zustand session store | Session code, peer status, connected device info | Session |
| Zustand transfer store | Received items (blobs, text), transfer queue | Session |
| WebRTC data channel | In-flight file chunks | Transient |
| PartyKit room | Signaling messages only | Until both peers connect |
| Server (none) | Nothing | — |

## Device Detection

API route `GET /api/device`:
- Reads `User-Agent` header to determine `phone | tablet | desktop` and to compose the display name (e.g. "iPhone · Safari", "Windows · Chrome", "Android · Firefox")
- Reads client IP for city-level geolocation via `geoip-lite`
- Returns: `{ deviceType: "phone" | "tablet" | "desktop", deviceName: string, location: { city: string, country: string } }`
- `deviceName` is auto-composed from OS + browser — no user input required
- Used only for display — not for auth or access control

## Security Model

- Session codes are 6 alphanumeric characters (62^6 = ~56 billion combinations).
- QR regenerates every 30 seconds while waiting — short window prevents passive harvesting.
- PartyKit enforces a hard limit of 2 connections per room; third joins are rejected.
- Sessions are single-use: once connection is established, the room is locked.
- All signaling is TLS-encrypted (HTTPS). All WebRTC data is DTLS-encrypted.
- No file content, text, or clipboard data is ever sent to or stored on any server.
- PartyKit room names are prefixed `fs-` to avoid collisions.
- QR payloads are validated (must match `^[A-Z0-9]{6}$`) before any room is joined.

## Known Constraints

- WebRTC P2P fails for ~30% of users on restrictive corporate/CGNAT networks. No TURN in v1 — show a clear error with advice to try a different network.
- Maximum session participants: 2 (hard limit in PartyKit server).
- Single-file transfers in v1 — no concurrent multi-file queue.
- File content lives in browser memory on the receiver — very large files (200 MB video) may cause memory pressure on low-end devices.
- `html5-qrcode` requires camera permission — handle denial gracefully with a manual code input fallback.

## Deployment

- **Frontend**: Vercel (free tier). Next.js 16 standard deployment.
- **Signaling**: PartyKit (free tier). Deployed from `party/server.ts` via `partykit deploy`.
- **Storage**: None.
- **Database**: None.
- **Environment variables**: `NEXT_PUBLIC_PARTYKIT_HOST` (PartyKit deployment URL).
