# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 07: complete — device detection implemented and `npm run build` passes.

## Current Goal

- Feature 09: text / link / clipboard transfer over WebRTC data channel.

## Completed

- Context documentation: all 6 context files authored and finalized.
- `CLAUDE.md` written with invariants, stack reference, and sketch style summary.
- Feature 01 spec written: `context/feature-specs/01-project-setup.md`.
- **Feature 01 — Project Setup & Design System** (`npm run build` passes):
  - Next.js 16.2.5 with App Router, TypeScript strict mode, Tailwind v4.
  - All dependencies installed: `simple-peer`, `react-qr-code`, `html5-qrcode`, `@phosphor-icons/react`, `zustand`, `partykit`, `partysocket`, `geoip-lite`.
  - shadcn/ui initialised (new-york style, neutral base); components added: button, card, dialog, input, textarea, scroll-area, separator, badge.
  - `lib/utils.ts` with `cn()` helper.
  - Full folder structure with stubs: `app/api/device/`, `party/`, `lib/`, `hooks/`, `store/`, `components/{landing,send,receive,shared}/`, `types/`.
  - `app/globals.css` — full design system: all CSS custom property tokens + `@theme inline` Tailwind mapping + sketch utility classes (`.sketch-card`, `.sketch-btn`, `.sketch-input`, `.dot-grid`).
  - `app/layout.tsx` — Cause font via `next/font/google`, `lang="pl"`.
  - `app/page.tsx` — placeholder page using design tokens.
  - `partykit.json` + `.env.local` with `NEXT_PUBLIC_PARTYKIT_HOST`.

## In Progress

- None.

## Recently Completed

- **Feature 07 — Device Detection** (`npm run build` passes):
  - `types/session.ts` — `DeviceType` and `DeviceInfo` interface added.
  - `lib/device.ts` — User-Agent parsing: OS + browser detection, device type classification.
  - `lib/geolocation.ts` — `geoip-lite` IP lookup, IPv6-mapped address handling.
  - `app/api/device/route.ts` — `GET /api/device`: reads UA + IP, returns JSON.
  - `next.config.ts` — `serverExternalPackages: ["geoip-lite"]` (prevents Turbopack bundling issue with `__dirname`).
  - `store/session.store.ts` — `deviceInfo` field + `setDeviceInfo` setter added.
  - `types/transfer.ts` — `DeviceInfoFrame` control frame type.
  - `components/shared/device-badge.tsx` — Reusable device banner with Phosphor icon, sketch style.
  - `hooks/use-device-info.ts` — Hook for fetching own device info from `/api/device`.
  - `hooks/use-peer-connection.ts` — On connect: fetches own device info, sends `device-info` frame over data channel; on receive: parses frame and calls `setDeviceInfo`.
  - `components/receive/receive-waiting.tsx` — Shows `DeviceBadge` on connected status.
  - `components/send/send-waiting.tsx` — Shows `DeviceBadge` on connected status.

- **Feature 06 — WebRTC Peer Connection** (`npm run build` passes):
  - `types/session.ts` — `PeerRole` and `ConnectionStatus` types.
  - `store/session.store.ts` — Zustand store: `code`, `role`, `status`, `error`, setters, `reset`.
  - `hooks/use-peer-connection.ts` — full implementation: PartySocket room management, dynamic `simple-peer` import, initiator/non-initiator logic, signal relay, `peer-joined`/`peer-left`/`room-full` handling.
  - `hooks/use-session.ts` — added `paused` parameter to stop countdown during signaling/connected.
  - `components/receive/receive-waiting.tsx` — wired `usePeerConnection("receiver")`, status-aware render (connected / error / waiting QR).
  - `components/send/send-waiting.tsx` — replaced placeholder with real `usePeerConnection("sender")`, full status-aware render.

- **Feature 05 — Send Page: QR Scanner + Manual Code Input** (`npm run build` passes):
  - `lib/qr.ts` — `parseQrPayload()` (URL pattern + raw 6-char fallback), `isValidCode()`.
  - `hooks/use-qr-scanner.ts` — `useQrScanner()`: dynamic import of `html5-qrcode`, camera lifecycle, one-shot `calledRef` gate, permission error discrimination.
  - `app/send/page.tsx` — server component shell.
  - `components/send/send-waiting.tsx` — live QR scanner area, camera-denied/error fallback, 6-box manual code input (auto-advance, backspace, paste), "Połącz →" button, "Łączenie…" placeholder state.

- **Feature 04 — Receive Page: QR Display + Countdown** (`npm run build` passes):
  - `lib/session.ts` — `generateSessionCode()` (crypto.getRandomValues, 36-char alphabet), `buildQrPayload()`, `isValidSessionCode()`.
  - `hooks/use-session.ts` — `useReceiverSession()` hook: setTimeout-based 30s countdown, auto-regenerates code on expiry.
  - `app/receive/page.tsx` — server component shell.
  - `components/receive/receive-waiting.tsx` — QR code (react-qr-code), 6-char code chips, SVG countdown ring with CSS transition.

- **Feature 03 — PartyKit Signaling Server** (`npx partykit dev` passes):
  - `party/server.ts` — pełna implementacja: 2-connection limit per room, relay SDP/ICE, `peer-joined`, `peer-left`, `room-full`.
  - `.env.local` + `partykit.json` — już skonfigurowane poprawnie.

- **Feature 02 — Landing Page** (`npm run build` passes):
  - `components/landing/landing-navbar.tsx` — fixed top bar, logo + "beta" badge.
  - `components/landing/hero-section.tsx` — full-height hero, headline, subtext, CTA buttons, decorative SVG arrow.
  - `components/landing/how-it-works-section.tsx` — 3-step grid with sketch cards.
  - `components/landing/transfer-types-section.tsx` — 5 type tiles with `.sketch-card-sm`.
  - `components/landing/landing-footer.tsx` — simple one-line footer.
  - `app/globals.css` — added `.sketch-card-sm` variant.
  - `app/page.tsx` — composed from all landing sections.

## Next Up

- Feature 09: Text / link / clipboard transfer — send and display the three text-based transfer types over the WebRTC data channel.
- Feature 10: File transfer (image, video, file) — chunked binary transfer via WebRTC data channel, progress bar, blob reassembly on receiver.
- Feature 11: Receive board — full pin-board UI with dot-grid background, rotated sketch cards, Download / Copy / Share / Remove actions.
- Feature 12: Session history (sender side) — session list below transfer type selector showing sent items, per-item delete.
- Feature 13: Disconnect flow — disconnect button on both sides, session cleanup, return to landing.
- Feature 14: PWA manifest — `manifest.json`, icons, `meta` tags, installable from browser on Android and iOS.

## Open Questions

- None currently open.

## Resolved Decisions

- Font: **Cause** (Google Fonts, variable) confirmed. Lato as fallback for small body text if readability issues arise.
- Share button: Web Share API (`navigator.share`) on mobile; copy to clipboard on desktop.
- Clipboard transfer type: **removed** from the app entirely (5 transfer types remain: text, image, video, file, link).
- Device name: auto-detected from User-Agent (e.g. "iPhone · Safari") — no user input.

## Architecture Decisions

- No database, no cloud storage — all session data is ephemeral in browser memory.
- PartyKit chosen over Pusher/Ably due to free tier, WebSocket-native model, and zero message-size restrictions on signaling data.
- WebRTC (simple-peer) for actual file transfer — avoids server bandwidth costs.
- TURN server deferred to v2 — ~30% of users on restrictive NAT will see a connection error in v1.
- Session codes are client-generated on the receiver — no API round-trip needed for code creation.
- `geoip-lite` for IP geolocation — runs server-side, no external API, no cost.
- `react-qr-code` for QR generation (SVG, SSR-safe) over canvas-based alternatives.
- Phosphor Icons Regular weight default, Bold for CTAs and transfer type tiles.
- shadcn CLI v4, style `base-nova`, Radix primitives — do not edit `components/ui/*`.
- Tailwind v4 — CSS-only config, no `tailwind.config.ts`.

## Session Notes

- Font: Cause (Google Fonts) — już wdrożony w Feature 01.
- Logo and illustration prompts to be written separately by the user's request.
- Budget constraint: $0 additional monthly cost. Vercel free tier + PartyKit free tier.
- Next.js version: 16 (same as Ghost AI reference project).
- Deployment: Vercel for Next.js, `partykit deploy` for signaling worker.
