import { create } from "zustand"
import type { TransferItem, InProgressTransfer } from "@/types/transfer"

interface TransferState {
  items: TransferItem[]
  inProgress: InProgressTransfer | null
  sendingProgress: number   // 0–100, sender side
  addItem: (item: TransferItem) => void
  removeItem: (id: string) => void
  setInProgress: (t: InProgressTransfer | null) => void
  setSendingProgress: (pct: number) => void
  clear: () => void
}

export const useTransferStore = create<TransferState>((set) => ({
  items: [],
  inProgress: null,
  sendingProgress: 0,
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) => set((s) => {
    const item = s.items.find((i) => i.id === id)
    if (item && "blobUrl" in item) URL.revokeObjectURL(item.blobUrl)
    return { items: s.items.filter((i) => i.id !== id) }
  }),
  setInProgress: (t) => set({ inProgress: t }),
  setSendingProgress: (pct) => set({ sendingProgress: pct }),
  clear: () => set((s) => {
    s.items.forEach((i) => { if ("blobUrl" in i) URL.revokeObjectURL(i.blobUrl) })
    return { items: [], inProgress: null, sendingProgress: 0 }
  }),
}))
