# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- **v1 complete.** All 13 planned features shipped, build passes, project cleaned and optimized.

## Completed (v1 release)

| # | Feature | Status |
|---|---------|--------|
| 01 | Project setup & design system | ✅ |
| 02 | Landing page | ✅ |
| 03 | PartyKit signaling server | ✅ |
| 04 | Receive: QR display + countdown | ✅ |
| 05 | Send: QR scanner + manual code | ✅ |
| 06 | WebRTC peer connection | ✅ |
| 07 | Device detection | ✅ |
| 08 | Text & link transfer | ✅ |
| 09 | File transfer (chunked + backpressure) | ✅ |
| 11 | Receive board (chalkboard UI) | ✅ |
| 12 | Disconnect flow | ✅ |
| 13 | PWA manifest | ✅ |

(Feature 10 was rolled into 09 during implementation.)

## In Progress

- None.

## Recently Completed

- **Polish pass (post-v1.1)** (`npm run build` passes):
  - **Hero illustration optimized**: 2752×1536 / 1041 KB → 1280×wide / 103 KB palette PNG (≈90% smaller, mathematically lossless). Next.js `<Image>` auto-serves WebP/AVIF to capable clients. Generation script: `scripts/optimize-hero.mjs` (uses `sharp`).
  - **OG image**: `public/og-image.png` (1200×630, 67 KB) generated via `scripts/gen-og.mjs` — design tokens, dot grid, sketch border, accent tile + wordmark, headline, accent chip. Wired into `metadata.openGraph` and `metadata.twitter` (card: `summary_large_image`).
  - **`metadataBase`** set from `NEXT_PUBLIC_SITE_URL` (default `https://flow-send.vercel.app`) — silences Next 16 warning and makes social cards work in production.
  - **File size limit**: `MAX_FILE_SIZE = 1 GB` exposed from `lib/transfer.ts`. `TransferPanel` filters dropped files, shows red inline error listing rejected names + sizes, and proceeds with the rest. Hint text now reads `max 5 plików · do 1.0 GB każdy`.
  - **`prefers-reduced-motion`**: global CSS rule in `globals.css` collapses all animations/transitions to ~0ms when the user has reduced-motion enabled (countdown bar, chalk-card hover, sketch-btn, …).

- **Cleanup pass (post-v1)** (`npm run build` passes):
  - **Navbar redesign**: logo replaced with `PaperPlaneTiltIcon` inside accent-blue sketch tile + tightened typography; "beta" badge removed; whole logo block now wrapped in `Link` to `/` for a11y.
  - **Footer**: copyright with year + link to `aulan.pl` (target=_blank, rel=noopener).
  - **Bug fix — deprecated Phosphor names**: `DeviceMobile/Monitor/DeviceTablet` → `*Icon` in `device-badge.tsx`; `DeviceMobile/QrCode/CheckCircle` → `*Icon` in `how-it-works-section.tsx`. Eliminates console deprecation warnings.
  - **Bug fix — leftover debug log**: removed `console.log("received data", …)` no-op handler in `send-waiting.tsx`; replaced with documented stub.
  - **Removed dead code**:
    - `hooks/use-device-info.ts` — orphan hook (both pages fetch `/api/device` directly via refs).
    - `components/ui/*` — full shadcn scaffold (badge, button, card, dialog, input, scroll-area, separator, textarea), never imported.
    - `lib/utils.ts` — only used by `components/ui/*`.
    - `components.json` — shadcn config.
    - `public/{file,globe,next,vercel,window}.svg` — Next.js default scaffold.
  - **Removed unused dependencies**: `lucide-react`, `class-variance-authority`, `@radix-ui/react-slot`, `radix-ui`, `tailwind-merge` (86 transitive packages dropped).
  - **Metadata**: `layout.tsx` upgraded to title template + OpenGraph + Twitter card + viewport (`width=device-width`, `initialScale=1`, `viewportFit=cover`).
  - **Per-page metadata**: `/send` → "Wyślij", `/receive` → "Odbierz" with descriptions.
  - **`public/robots.txt`** added (allow all, disallow `/api/`).

- **Feature 13 — PWA Manifest** (`npm run build` passes):
  - `public/manifest.json` with name, short_name, description, theme/background colors, 4 icon entries (192, 512, each as standard + maskable).
  - `public/icons/{icon-192,icon-192-maskable,icon-512,icon-512-maskable}.png` generated via `scripts/gen-icons.mjs` (devDep `canvas`).
  - `app/layout.tsx` — `metadata.manifest`, `metadata.appleWebApp`, `metadata.icons.apple`, `viewport.themeColor`.

- **Feature 12 — Disconnect Flow** (`npm run build` passes):
  - `components/send/send-waiting.tsx` — `useEffect` redirect on `status === "disconnected"` (clears transfer store, resets session, pushes to `/`); "Rozłącz" button below TransferPanel; error state shows "Skanuj ponownie" + "Strona główna" side-by-side.
  - `components/receive/receive-waiting.tsx` — same redirect effect; error state shows "Spróbuj ponownie" + "Strona główna".
  - `store/session.store.ts` — `reset()` already cleared `deviceInfo`.

- **Feature 11 — Receive Board (Chalkboard UI)** — chalk-card layout, SVG noise grain, deterministic hash-positioned cards, red pin, mobile column layout.

- **Feature 09 — File Transfer** — `chunkFile` async generator (64 KB), backpressure via `RTCDataChannel.bufferedAmount`, `file-start`/`file-end` control frames, blob URL revocation on remove/clear.

- **Feature 08 — Text & Link Transfer** — `ControlFrame` union, `useTransfer` sender/receiver hook.

- **Feature 07 — Device Detection** — `geoip-lite` IP geolocation, UA parsing, device badge over data channel.

- **Feature 06 — WebRTC Peer Connection** — `usePeerConnection` with PartySocket signaling, dynamic `simple-peer` import, signal queue for sender, stable refs for `onData`/`ownDeviceInfo` to prevent effect re-runs destroying the peer.

- **Feature 05 — Send Page** — `html5-qrcode` scanner with permission discrimination, 6-box manual input.

- **Feature 04 — Receive Page** — `react-qr-code` SVG, 6-char chips, CSS countdown bar, auto-regenerate.

- **Feature 03 — PartyKit Signaling Server** — 2-connection limit per room, `peer-joined`/`peer-left`/`room-full`.

- **Feature 02 — Landing Page** — hero + how-it-works + transfer-types + footer.

- **Feature 01 — Project Setup & Design System** — Next.js 16, Tailwind v4, full design tokens, sketch utility classes, Cause font.

## Open Questions

- None currently open.

## Resolved Decisions

- Font: **Cause** (Google Fonts).
- Share button: Web Share API on mobile; copy to clipboard on desktop.
- Clipboard transfer type: removed from the app entirely (5 transfer types: text, image, video, file, link).
- Device name: auto-detected from User-Agent.
- shadcn UI scaffolding removed in cleanup pass — design system is fully driven by `globals.css` sketch classes; reintroduce only if a complex primitive (popover, command palette, …) is actually needed.

## Architecture Decisions

- No database, no cloud storage — all session data is ephemeral in browser memory.
- PartyKit chosen over Pusher/Ably due to free tier, WebSocket-native model, and zero message-size restrictions on signaling data.
- WebRTC (simple-peer) for actual file transfer — avoids server bandwidth costs.
- TURN server deferred to v2 — ~30% of users on restrictive NAT will see a connection error in v1.
- Session codes are client-generated on the receiver — no API round-trip needed for code creation.
- `geoip-lite` for IP geolocation — runs server-side, no external API, no cost. Marked `serverExternalPackages` in `next.config.ts` to avoid Turbopack `__dirname` issue.
- `react-qr-code` for QR generation (SVG, SSR-safe) over canvas-based alternatives.
- Phosphor Icons — always import the `*Icon`-suffixed names (older bare names trigger runtime deprecation warnings).
- Tailwind v4 — CSS-only config, no `tailwind.config.ts`.

## Deferred / out of scope (v2+)

- TURN server (covers users on symmetric NAT).
- Sender-side session history.
- Service worker / offline mode.
- Resumable transfers across reconnects.

## Session Notes

- Logo and illustration prompts to be written separately by the user's request.
- Budget constraint: $0 additional monthly cost. Vercel free tier + PartyKit free tier.
- Next.js version: 16.2.5.
- Deployment: Vercel for Next.js, `partykit deploy` for signaling worker.
