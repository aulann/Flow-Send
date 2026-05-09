# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries in `architecture-context.md`.

## TypeScript

- Strict mode is required throughout.
- No `any` — use explicit interfaces or narrowly-scoped types.
- Validate all untrusted inputs at system boundaries: QR payloads, WebRTC messages, user-agent strings, scanned codes.
- Use `interface` for object shapes; `type` for unions and aliases.
- All WebRTC control frame types must match the discriminated union in `types/transfer.ts`.

## Next.js

- Default to server components.
- Add `"use client"` only when the component genuinely requires browser APIs, hooks, event handlers, or real-time state (WebRTC, Zustand, camera, File API, Clipboard API).
- Route handlers in `app/api/` are thin: read input, validate, call a `lib/` function, return a response.
- No business logic in API routes — push complexity into `lib/`.
- No long-running work in API routes — WebRTC and file transfer run entirely in the browser.

## WebRTC and Peer Connections

- All peer connection lifecycle logic lives in `hooks/use-peer-connection.ts`.
- `simple-peer` is the sole abstraction over raw `RTCPeerConnection`.
- File chunking and reassembly logic lives in `lib/transfer.ts`, not in components or stores.
- Chunk size is 64 KB. Do not change without profiling evidence.
- Binary file chunks are sent as `ArrayBuffer`. Control frames are JSON strings. Never mix the two in a single send call.
- Always destroy the `simple-peer` instance and clean up event listeners on component unmount.
- Never store the peer instance in Zustand — use a React ref. Store only serializable connection metadata (status, device info) in Zustand.

## PartyKit Server

- `party/server.ts` handles only WebRTC signaling: relay SDP offers/answers and ICE candidates between the two peers.
- Enforce a hard limit of 2 connections per room. Reject third connections immediately.
- Lock the room after both peers have joined — do not allow rejoining after disconnect.
- No file content, no text content, and no clipboard data may ever pass through the PartyKit server.
- Room names must be prefixed `fs-` followed by the 6-character session code.

## State Management (Zustand)

- Stores live in `store/`. One store per concern: `session.store.ts` and `transfer.store.ts`.
- Do not put derived state in stores — compute it from primitives in selectors.
- Do not put non-serializable values (peer instance, File objects) in Zustand — use refs for those.
- Transfer items in `transfer.store.ts` hold `Blob` URLs (created via `URL.createObjectURL`) for downloaded files, not raw `ArrayBuffer` data.
- Revoke object URLs when items are removed from the store to avoid memory leaks.

## Styling

- Use CSS custom property tokens from `globals.css` — no hardcoded hex values or raw Tailwind color classes.
- Apply the sketch style conventions from `ui-context.md`: asymmetric border-radius, 2px dark border, hard offset box-shadow.
- Never modify `components/ui/*` (shadcn/ui primitives) directly — override at the app layer.
- Mobile-first: write base styles for mobile, then layer `sm:` / `md:` / `lg:` overrides.

## Security

- Never log file content, clipboard content, or transferred text — only metadata (size, type, filename).
- Validate session codes before joining any PartyKit room: must match `/^[A-Z0-9]{6}$/`.
- Validate QR payloads: must contain a recognizable `flow-send.vercel.app/send?code=` URL pattern.
- Do not expose the PartyKit room name pattern in error messages shown to users.
- Camera permission must be requested only when the QR scanner component mounts — never on page load.

## Browser APIs

- Clipboard API (`navigator.clipboard.read/write`) requires a user gesture — call it only from button click handlers.
- `URL.createObjectURL` for received file blobs — always pair with `URL.revokeObjectURL` on cleanup.
- File input must use `<input type="file">` wrapped in a styled `<label>` — no custom drop zone in v1.
- Camera/media stream (`getUserMedia`) must be stopped (all tracks) on component unmount or session end.
- Gracefully handle denied permissions: show a human-readable fallback (manual code input for camera; clipboard paste prompt for clipboard).

## File Organization

```
app/              Next.js pages and API routes
  api/
    device/       GET — user-agent + IP geolocation
party/            PartyKit signaling server
  server.ts
lib/              Pure utilities, no React
  session.ts      Session code generation
  device.ts       User-agent parsing
  geolocation.ts  IP geolocation via geoip-lite
  transfer.ts     File chunking and reassembly
  qr.ts           QR payload validation and parsing
hooks/            Client-only React hooks
  use-peer-connection.ts
  use-session.ts
  use-transfer.ts
  use-qr-scanner.ts
store/            Zustand stores
  session.store.ts
  transfer.store.ts
components/       UI only — no business logic
  ui/             shadcn/ui primitives (do not edit)
  landing/        Landing page sections
  send/           Sender flow components
  receive/        Receiver flow + board components
  shared/         Shared: QR display, device badge, etc.
types/            Shared TypeScript interfaces
  transfer.ts     Control frame union, TransferItem
  session.ts      Session state, device info
```

Name files after the responsibility they contain, not the technology. `transfer.ts` not `webrtc-utils.ts`.
