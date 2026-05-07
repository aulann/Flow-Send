import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    deviceType: "desktop",
    deviceName: "Unknown",
    location: { city: "", country: "" },
  })
}
