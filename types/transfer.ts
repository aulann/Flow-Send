import type { DeviceType } from "@/types/session"

export interface DeviceInfoFrame {
  type: "device-info"
  deviceType: DeviceType
  deviceName: string
  location: { city: string; country: string }
}

export type ControlFrame = DeviceInfoFrame
