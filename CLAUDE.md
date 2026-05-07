# Flow Send — Agent Instructions

## Before You Do Anything

Read these files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture-context.md` — system structure, boundaries, transfer protocol, and invariants
3. `context/ui-context.md` — theme, colors, typography, sketch style, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after each meaningful implementation change.

If an implementation change affects architecture, scope, or standards documented in the context files, update the relevant file before continuing.

## Critical Invariants (Never Violate)

1. **File content never touches the server.** Transfers are P2P via WebRTC. PartyKit handles signaling only.
2. **Sessions are ephemeral.** No data persists after session end — no database, no cloud storage.
3. **Maximum 2 devices per session.** Enforced in the PartyKit server, not just the UI.
4. **Browser permissions on user action only.** Camera and clipboard requested only from explicit button clicks — never on page load.
5. **Sketch style on every component.** Asymmetric border-radius, 2px ink border, hard offset shadow. No plain Tailwind defaults.
6. **Mobile-first.** Every feature verified at mobile width before marked done.

## Stack Quick Reference

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 16 + TypeScript |
| Styling | Tailwind v4 + shadcn/ui |
| Icons | Phosphor Icons (`@phosphor-icons/react`) — Regular weight default, Bold for CTAs |
| Font | Cause (Google Fonts, variable) |
| Signaling | PartyKit (`party/server.ts`) |
| P2P transfer | `simple-peer` (WebRTC) |
| QR generate | `react-qr-code` |
| QR scan | `html5-qrcode` |
| State | Zustand (`store/`) |
| Geolocation | `geoip-lite` (server-side, no external API) |

## Sketch Style System (Summary)

Every bordered element must follow this pattern — do not use plain Tailwind defaults:

```css
/* Card */
border: 2px solid var(--border-ink);
border-radius: 12px 13px 11px 12px;
box-shadow: 3px 3px 0px 0px var(--border-ink);

/* Button (primary) — hover reduces shadow, active collapses it */
border: 2px solid var(--border-ink);
border-radius: 10px 11px 10px 10px;
box-shadow: 3px 3px 0px var(--border-ink);
```

Full token table and all style rules are in `context/ui-context.md`.

## Feature Specs

Each feature is a markdown file in `context/feature-specs/`. Read the spec for the current feature before starting. Do not begin a feature until the previous one passes `npm run build`.
