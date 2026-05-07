export type PeerRole = "receiver" | "sender"

export type ConnectionStatus =
  | "idle"
  | "waiting"
  | "signaling"
  | "connected"
  | "error"
  | "disconnected"

export type DeviceType = "phone" | "tablet" | "desktop"

export interface DeviceInfo {
  deviceType: DeviceType
  deviceName: string
  location: {
    city: string
    country: string
  }
}
