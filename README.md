# Flow Send

**Szybki transfer plików P2P — jednym skanem QR.**

Wyślij pliki, zdjęcia, wideo, linki i tekst między dowolnymi urządzeniami bez konta, bez kabla i bez tej samej sieci. Połączenie nawiązywane jest przez WebRTC bezpośrednio w przeglądarce.

🔗 **[flow-send.vercel.app](https://flow-send.vercel.app)**

---

## Jak to działa

1. Odbiorca otwiera `/receive` — dostaje kod QR i 6-znakowy kod sesji (ważny 30 s, auto-regeneruje się)
2. Nadawca otwiera `/send` — skanuje QR lub wpisuje kod ręcznie
3. Nawiązuje się połączenie WebRTC peer-to-peer
4. Transfer odbywa się bezpośrednio — żaden plik nie przechodzi przez serwer
5. Pliki pojawiają się na tablicy odbiorcy jako przyczepione karteczki

---

## Tech stack

| Warstwa | Technologie |
|---------|-------------|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind v4 · custom CSS design system |
| Transfer | WebRTC via `simple-peer` · chunked (64 KB) · backpressure |
| Signaling | [PartyKit](https://partykit.io) WebSocket server |
| QR | `react-qr-code` (generowanie) · `html5-qrcode` (skanowanie) |
| Device detection | User-Agent parsing · `geoip-lite` (IP → miasto/kraj) |
| State | Zustand |
| Deploy | Vercel (Next.js) + PartyKit (signaling worker) |

---

## Architektura

```
Nadawca                   PartyKit (signaling)                Odbiorca
   │                             │                               │
   │── JOIN room ──────────────→ │                               │
   │                             │ ←──────────────── JOIN room ──│
   │                             │ ──── peer-joined ────────────→│
   │                             │ ←─── SDP offer ───────────────│
   │ ←── SDP offer ─────────────│                               │
   │──── SDP answer ───────────→│                               │
   │                             │ ──── SDP answer ────────────→│
   │◄══════════════ WebRTC data channel (P2P) ════════════════►│
```

**Brak bazy danych.** Wszystkie dane sesji są efemeryczne — znikają po zamknięciu okna.
Kod sesji generowany jest po stronie odbiorcy, bez żadnego round-tripu do API.

---

## Obsługiwane typy transferu

| Typ | Format |
|-----|--------|
| Tekst | Dowolny, Enter żeby wysłać |
| Link | Wykrywany automatycznie jako `http(s)://` |
| Zdjęcie | `image/*` — podgląd na tablicy odbiorcy |
| Wideo | `video/*` |
| Plik | Dowolny format, do 1 GB na plik |

Do 5 plików na raz. Chunked transfer z backpressure (`RTCDataChannel.bufferedAmount`).

---

## Lokalny development

```bash
git clone https://github.com/aulann/Flow-Send.git
cd Flow-Send
npm install
```

Utwórz `.env.local`:

```env
NEXT_PUBLIC_PARTYKIT_HOST=<twój-projekt>.partykit.dev
```

Uruchom jednocześnie Next.js i serwer PartyKit:

```bash
# terminal 1
npm run dev

# terminal 2
npx partykit dev
```

Otwórz [localhost:3000](http://localhost:3000).

---

## Deploy

### Next.js → Vercel

```bash
vercel deploy --prod
```

Dodaj zmienną środowiskową w Vercel:

```
NEXT_PUBLIC_PARTYKIT_HOST = <twój-projekt>.partykit.dev
```

### PartyKit (signaling)

```bash
npx partykit deploy
```

Po deploy'u PartyKit poda adres `*.partykit.dev` — wpisz go jako `NEXT_PUBLIC_PARTYKIT_HOST`.

---

## Licencja

MIT — © 2026 [aulan.pl](https://aulan.pl)
