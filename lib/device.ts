import { DeviceType } from "@/types/session"

interface ParsedDevice {
  deviceType: DeviceType
  deviceName: string
}

export function parseUserAgent(ua: string): ParsedDevice {
  const lower = ua.toLowerCase()

  let os = "Unknown"
  if (/iphone/.test(lower)) os = "iPhone"
  else if (/ipad/.test(lower)) os = "iPad"
  else if (/android.*mobile/.test(lower)) os = "Android"
  else if (/android/.test(lower)) os = "Android Tablet"
  else if (/windows/.test(lower)) os = "Windows"
  else if (/macintosh|mac os x/.test(lower)) os = "Mac"
  else if (/linux/.test(lower)) os = "Linux"

  let browser = "Browser"
  if (/edg\//.test(lower)) browser = "Edge"
  else if (/opr\/|opera/.test(lower)) browser = "Opera"
  else if (/chrome/.test(lower) && !/chromium/.test(lower)) browser = "Chrome"
  else if (/firefox/.test(lower)) browser = "Firefox"
  else if (/safari/.test(lower) && !/chrome/.test(lower)) browser = "Safari"
  else if (/samsung/.test(lower)) browser = "Samsung"

  let deviceType: DeviceType = "desktop"
  if (/iphone|android.*mobile/.test(lower)) deviceType = "phone"
  else if (/ipad|android(?!.*mobile)/.test(lower)) deviceType = "tablet"

  return {
    deviceType,
    deviceName: `${os} · ${browser}`,
  }
}
