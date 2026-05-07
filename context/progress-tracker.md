# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 03: PartyKit signaling server.

## Current Goal

- `party/server.ts` z logiką join/relay/lock. Deploy do PartyKit, weryfikacja limitu 2 urządzeń.

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

- **Feature 02 — Landing Page** (`npm run build` passes):
  - `components/landing/landing-navbar.tsx` — fixed top bar, logo + "beta" badge.
  - `components/landing/hero-section.tsx` — full-height hero, headline, subtext, CTA buttons, decorative SVG arrow.
  - `components/landing/how-it-works-section.tsx` — 3-step grid with sketch cards.
  - `components/landing/transfer-types-section.tsx` — 5 type tiles with `.sketch-card-sm`.
  - `components/landing/landing-footer.tsx` — simple one-line footer.
  - `app/globals.css` — added `.sketch-card-sm` variant.
  - `app/page.tsx` — composed from all landing sections.

## Next Up

- Feature 03: PartyKit signaling server — `party/server.ts` z logiką join/relay/lock. Deploy do PartyKit, weryfikacja limitu 2 urządzeń.
- Feature 04: Session code generation and QR display — `/receive` page: generate 6-char code, render QR + countdown ring (30s), auto-regenerate on expiry.
- Feature 05: Session code generation and QR display — `/receive` page: generate 6-char code, render QR + countdown ring (30s), auto-regenerate on expiry.
- Feature 06: QR scanner and code input — `/send` page: camera QR scanner (`html5-qrcode`) + manual code input field, validate and parse scanned payload.
- Feature 07: WebRTC peer connection — `hooks/use-peer-connection.ts`, connect both peers via PartyKit signaling, confirm data channel established.
- Feature 08: Device detection — `GET /api/device`, user-agent + `geoip-lite` geolocation, device info displayed post-connection on send and receive screens.
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
