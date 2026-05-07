# Flow Send

## Overview

Flow Send is a browser-based file and content transfer tool. Two devices connect via QR code scan — no shared network, no account, no installation required. Users send files, images, video, text, and links instantly between any two devices with a browser and an internet connection.

## Goals

1. Let any user transfer files from one device to another with zero friction.
2. Work across different networks — devices only need internet, not LAN.
3. Require no account, no installation, and no setup beyond opening a URL.
4. Keep session data entirely private — no transferred content ever touches a server.
5. Deliver a fast, stable, and visually distinctive experience.

## Core User Flow

### Sender
1. Opens Flow Send at the home page.
2. Clicks "Wyślij" (Send).
3. Scans the QR code shown on the receiver's screen — or types the 6-character code.
4. Sees the connected device name and approximate location (city, country).
5. Chooses a transfer type: text, image, video, file, link, or clipboard.
6. Sends the content — it appears instantly on the receiver's screen.
7. Can view and delete items from the current session history.
8. Clicks disconnect or closes the tab to end the session.

### Receiver
1. Opens Flow Send at the home page.
2. Clicks "Odbierz" (Receive).
3. A QR code and 6-character code are displayed with a 30-second countdown ring.
4. If no device connects within 30 seconds, a new code and QR are generated automatically.
5. Once a device connects, transitions to the receive board.
6. Transferred items appear on the board in real time as cards.
7. Each item can be downloaded, copied, shared (Web Share API on mobile; copy to clipboard on desktop), or removed from the board.
8. Either side can disconnect to end the session.

## Features

### Session Management
- Ephemeral sessions — no accounts, no login, no persistent data.
- Receiver generates a 6-character alphanumeric code displayed as QR + plain text.
- QR and code regenerate every 30 seconds until a device connects.
- Once two devices connect, the session is locked — no third device can join.
- Session ends when either device disconnects or closes the browser tab.
- Receiver can also send to the sender within the same session (bidirectional).

### Transfer Types
- **Text** — plain text message (up to 10,000 characters)
- **Image** — image files: JPEG, PNG, GIF, WebP, HEIC (up to 50 MB)
- **Video** — video files: MP4, MOV, WebM (up to 200 MB)
- **File** — any file type (up to 100 MB)
- **Link** — a URL (up to 2,048 characters)

### Receive Board
- Full-viewport pin-board layout with dot-grid background.
- Each received item is a card with:
  - Content preview: image thumbnail, text excerpt, file type icon, or link URL
  - Filename or content label
  - Device type icon (phone / tablet / desktop) and auto-detected name (e.g. "iPhone · Safari")
  - Action buttons: Download · Copy · Share · Remove from session
- Items appear in real time as they are sent.
- Both sides can send within the same session.

### Transfer Mechanism
- Peer-to-peer via WebRTC data channels — file content never passes through a server.
- PartyKit WebSocket room handles signaling only (SDP offer/answer, ICE candidates).
- Free Google STUN servers for NAT traversal.
- ~70% of connections succeed P2P with STUN only. ~30% on restrictive NAT will fail.
- Fallback behavior: clear error UI explaining the failure with retry and network-change advice.
- No TURN server in v1.

### Privacy and Security
- QR code refreshes every 30 seconds to reduce interception risk before connection.
- Sessions are single-use: once two devices connect, no third device can join.
- File content is never stored server-side — it flows P2P directly between browsers.
- All connections are TLS-encrypted (HTTPS) and DTLS-encrypted (WebRTC).
- Device location is approximate IP-based geolocation (city-level, display only).
- All session data lives only in browser memory and is discarded when the session ends.

## Scope

### In Scope (v1)
- Landing page with product description and two CTAs
- Receiver mode: QR code + code display, auto-reset countdown, receive board
- Sender mode: QR scanner + code input, 6 transfer types, session history
- P2P file transfer via WebRTC (simple-peer)
- PartyKit for WebSocket signaling
- Device detection and IP geolocation (display only)
- Mobile-responsive design (mobile is the primary use case)
- PWA manifest (installable from browser)

### Out of Scope (v1)
- Authentication or user accounts
- File persistence beyond the active session
- Chat / messaging between devices
- More than 2 devices per session
- TURN server fallback for restrictive NAT
- Push notifications
- Browser extension
- Drag-and-drop file upload
- Multi-file batch queue
- Billing or subscription

## Success Criteria

1. A user on mobile can scan a QR on a desktop and receive a file within 5 seconds of connecting.
2. Session data is completely inaccessible after both devices disconnect.
3. Transfer works across different networks (e.g., mobile data to home WiFi).
4. The UI is intuitive enough for a non-technical user with no instructions.
5. The app is installable as a PWA on both Android and iOS.
