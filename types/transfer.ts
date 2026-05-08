import type { DeviceType } from "@/types/session"

export type TransferSubtype = "text" | "link" | "image" | "video" | "file"

// ─── Control frames ───────────────────────────────────────────────────────────

export interface DeviceInfoFrame {
  type: "device-info"
  deviceType: DeviceType
  deviceName: string
  location: { city: string; country: string }
}

export interface TextFrame {
  type: "text"
  id: string
  content: string
  subtype: "text" | "link"
}

export interface FileStartFrame {
  type: "file-start"
  id: string
  name: string
  size: number
  mimeType: string
  totalChunks: number
}

export interface FileEndFrame {
  type: "file-end"
  id: string
}

export interface RemoveFrame {
  type: "remove"
  id: string
}

export type ControlFrame =
  | DeviceInfoFrame
  | TextFrame
  | FileStartFrame
  | FileEndFrame
  | RemoveFrame

// ─── Transfer items (stored after receipt) ───────────────────────────────────

export type TextTransferItem = {
  id: string
  subtype: "text" | "link"
  content: string
  receivedAt: number
}

export type FileTransferItem = {
  id: string
  subtype: "image" | "video" | "file"
  name: string
  mimeType: string
  size: number
  blobUrl: string   // URL.createObjectURL — must be revoked on remove
  receivedAt: number
}

export type TransferItem = TextTransferItem | FileTransferItem

// ─── In-progress receive buffer ───────────────────────────────────────────────

export interface InProgressTransfer {
  id: string
  name: string
  mimeType: string
  size: number
  totalChunks: number
  chunks: ArrayBuffer[]
  receivedChunks: number
}
