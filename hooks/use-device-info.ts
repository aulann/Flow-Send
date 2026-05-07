"use client"
import { useEffect, useState } from "react"
import type { DeviceInfo } from "@/types/session"

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)

  useEffect(() => {
    fetch("/api/device")
      .then(r => r.json())
      .then(setDeviceInfo)
      .catch(() => {})
  }, [])

  return deviceInfo
}
