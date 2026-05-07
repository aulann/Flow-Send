Read `CLAUDE.md` and all 6 context files before starting.

# Feature 07 — Device Detection

Implement `GET /api/device` — a server-side endpoint that reads the caller's User-Agent and IP address and returns human-readable device info. After this feature both `/send` and `/receive` fetch this endpoint post-connection and display a banner showing what device the other side is on.

---

## Files to create or update

| File | Action |
|------|--------|
| `types/session.ts` | Add `DeviceInfo` interface |
| `lib/device.ts` | Replace stub — User-Agent parsing |
| `lib/geolocation.ts` | Replace stub — IP geolocation via geoip-lite |
| `app/api/device/route.ts` | Replace stub — thin API route |
| `store/session.store.ts` | Add `deviceInfo` field |
| `components/shared/device-badge.tsx` | Create — reusable device banner |
| `components/receive/receive-waiting.tsx` | Update — show device badge on connected |
| `components/send/send-waiting.tsx` | Update — show device badge on connected |

---

## `types/session.ts`

Add to existing file:

```typescript
export type DeviceType = "phone" | "tablet" | "desktop"

export interface DeviceInfo {
  deviceType: DeviceType
  deviceName: string        // e.g. "iPhone · Safari", "Windows · Chrome"
  location: {
    city: string            // empty string if unknown
    country: string         // empty string if unknown
  }
}
```

---

## `lib/device.ts`

Pure function — no React, no Next.js imports. Takes a User-Agent string, returns `DeviceType` and `deviceName`.

```typescript
import { DeviceType } from "@/types/session"

interface ParsedDevice {
  deviceType: DeviceType
  deviceName: string
}

export function parseUserAgent(ua: string): ParsedDevice {
  const lower = ua.toLowerCase()

  // OS detection
  let os = "Unknown"
  if (/iphone/.test(lower)) os = "iPhone"
  else if (/ipad/.test(lower)) os = "iPad"
  else if (/android.*mobile/.test(lower)) os = "Android"
  else if (/android/.test(lower)) os = "Android Tablet"
  else if (/windows/.test(lower)) os = "Windows"
  else if (/macintosh|mac os x/.test(lower)) os = "Mac"
  else if (/linux/.test(lower)) os = "Linux"

  // Browser detection
  let browser = "Browser"
  if (/edg\//.test(lower)) browser = "Edge"
  else if (/opr\/|opera/.test(lower)) browser = "Opera"
  else if (/chrome/.test(lower) && !/chromium/.test(lower)) browser = "Chrome"
  else if (/firefox/.test(lower)) browser = "Firefox"
  else if (/safari/.test(lower) && !/chrome/.test(lower)) browser = "Safari"
  else if (/samsung/.test(lower)) browser = "Samsung"

  // Device type
  let deviceType: DeviceType = "desktop"
  if (/iphone|android.*mobile/.test(lower)) deviceType = "phone"
  else if (/ipad|android(?!.*mobile)/.test(lower)) deviceType = "tablet"

  return {
    deviceType,
    deviceName: `${os} · ${browser}`,
  }
}
```

---

## `lib/geolocation.ts`

`geoip-lite` runs server-side only. Accepts an IP string, returns city + country (empty strings on miss).

```typescript
import geoip from "geoip-lite"

interface GeoLocation {
  city: string
  country: string
}

export function lookupLocation(ip: string): GeoLocation {
  // Strip IPv6 prefix from IPv4-mapped addresses (::ffff:1.2.3.4)
  const clean = ip.replace(/^::ffff:/, "")

  const result = geoip.lookup(clean)
  if (!result) return { city: "", country: "" }

  return {
    city: result.city ?? "",
    country: result.country ?? "",
  }
}
```

---

## `app/api/device/route.ts`

Thin route — reads headers, calls lib functions, returns JSON.

```typescript
import { NextRequest, NextResponse } from "next/server"
import { parseUserAgent } from "@/lib/device"
import { lookupLocation } from "@/lib/geolocation"

export async function GET(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? ""
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"

  const { deviceType, deviceName } = parseUserAgent(ua)
  const location = lookupLocation(ip)

  return NextResponse.json({ deviceType, deviceName, location })
}
```

IP extraction priority: `x-forwarded-for` (Vercel/proxies) → `x-real-ip` → localhost fallback. `x-forwarded-for` may contain a comma-separated list — take the first value.

---

## `store/session.store.ts`

Add `deviceInfo` to track the connected peer's device details:

```typescript
// Add to SessionState interface:
deviceInfo: DeviceInfo | null
setDeviceInfo: (info: DeviceInfo) => void

// Add to initial state:
deviceInfo: null,

// Add setter:
setDeviceInfo: (info) => set({ deviceInfo: info }),

// Add to reset():
reset: () => set({ code: null, role: null, status: "idle", error: null, deviceInfo: null }),
```

Import `DeviceInfo` from `@/types/session`.

---

## `components/shared/device-badge.tsx`

Reusable banner shown on both sides after connection.

```tsx
import { DeviceMobileIcon, MonitorIcon, DeviceTabletIcon } from "@phosphor-icons/react"
import type { DeviceInfo } from "@/types/session"

const iconMap = {
  phone: DeviceMobileIcon,
  tablet: DeviceTabletIcon,
  desktop: MonitorIcon,
}

interface DeviceBadgeProps {
  device: DeviceInfo
  label: string  // e.g. "Połączono z" or "Wysyła z"
}

export function DeviceBadge({ device, label }: DeviceBadgeProps) {
  const Icon = iconMap[device.deviceType]
  const location = [device.location.city, device.location.country]
    .filter(Boolean)
    .join(", ")

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 w-full"
      style={{
        background: "var(--accent-primary-dim)",
        border: "2px solid var(--accent-primary)",
        borderRadius: "10px 11px 10px 10px",
      }}
    >
      <Icon size={20} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
      <div className="flex flex-col min-w-0">
        <span className="text-xs" style={{ color: "var(--accent-primary)" }}>
          {label}
        </span>
        <span
          className="text-sm font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {device.deviceName}
        </span>
        {location && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {location}
          </span>
        )}
      </div>
    </div>
  )
}
```

---

## Fetch hook — `hooks/use-device-info.ts` (new file)

Fetch own device info once on mount. Used by both pages to know their own device before sending it to the peer.

```typescript
"use client"
import { useEffect, useState } from "react"
import type { DeviceInfo } from "@/types/session"

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)

  useEffect(() => {
    fetch("/api/device")
      .then(r => r.json())
      .then(setDeviceInfo)
      .catch(() => {}) // non-critical, UI degrades gracefully
  }, [])

  return deviceInfo
}
```

---

## How device info is exchanged between peers

Device info travels over the **WebRTC data channel** (not via PartyKit). After `status === "connected"`, each side:

1. Fetches `/api/device` for their own info
2. Sends it to the other peer as a JSON control frame over the data channel:
   ```json
   { "type": "device-info", "deviceType": "phone", "deviceName": "iPhone · Safari", "location": { "city": "Warsaw", "country": "PL" } }
   ```
3. Receives the same frame from the other side and stores it in `session.store` via `setDeviceInfo`

Add this to `types/transfer.ts` — the `device-info` type extends the control frame union.

This exchange happens automatically once the data channel opens. Both sides send simultaneously — no handshake needed.

### Update `hooks/use-peer-connection.ts`

After `peer.on("connect")` fires, trigger the device info exchange:

```typescript
peer.on("connect", () => {
  setStatus("connected")
  // Send own device info to peer
  fetch("/api/device")
    .then(r => r.json())
    .then((info: DeviceInfo) => {
      peer.send(JSON.stringify({ type: "device-info", ...info }))
    })
    .catch(() => {})
})
```

In `onData`, handle the `device-info` frame before passing to the caller:

```typescript
peer.on("data", (raw) => {
  try {
    const msg = JSON.parse(raw.toString())
    if (msg.type === "device-info") {
      setDeviceInfo({ deviceType: msg.deviceType, deviceName: msg.deviceName, location: msg.location })
      return
    }
  } catch {
    // binary data — pass through
  }
  onData(raw)
})
```

`setDeviceInfo` comes from `useSessionStore` — import it in the hook.

---

## Update connected screens

In both `receive-waiting.tsx` and `send-waiting.tsx`, replace the plain "Połączono" text in the `status === "connected"` block with:

```tsx
import { DeviceBadge } from "@/components/shared/device-badge"
import { useSessionStore } from "@/store/session.store"

// Inside component:
const deviceInfo = useSessionStore(s => s.deviceInfo)

// In connected render:
{deviceInfo && (
  <DeviceBadge
    device={deviceInfo}
    label="Połączono z"
  />
)}
```

---

## Check when done

- [ ] `GET /api/device` returns correct `deviceType`, `deviceName`, `location` for the calling browser
- [ ] Test on phone: `deviceType` is `"phone"`, `deviceName` contains "iPhone" or "Android"
- [ ] Test on desktop: `deviceType` is `"desktop"`, `deviceName` contains OS + browser
- [ ] After QR scan + WebRTC connect: device badge appears on both screens
- [ ] Badge shows the **other** device's info (not own)
- [ ] Location shows city + country when IP is not localhost
- [ ] On localhost: location fields are empty — no error thrown
- [ ] `npm run build` passes
