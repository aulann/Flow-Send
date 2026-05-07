import { create } from "zustand"
import type { PeerRole, ConnectionStatus, DeviceInfo } from "@/types/session"

interface SessionState {
  code: string | null
  role: PeerRole | null
  status: ConnectionStatus
  error: string | null
  deviceInfo: DeviceInfo | null
  setCode: (code: string) => void
  setRole: (role: PeerRole) => void
  setStatus: (status: ConnectionStatus) => void
  setError: (error: string | null) => void
  setDeviceInfo: (info: DeviceInfo) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  code: null,
  role: null,
  status: "idle",
  error: null,
  deviceInfo: null,
  setCode: (code) => set({ code }),
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setDeviceInfo: (info) => set({ deviceInfo: info }),
  reset: () => set({ code: null, role: null, status: "idle", error: null, deviceInfo: null }),
}))
