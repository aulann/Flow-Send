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
