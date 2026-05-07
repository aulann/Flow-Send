"use client"
import dynamic from "next/dynamic"

const ReceiveWaiting = dynamic(
  () => import("@/components/receive/receive-waiting").then(m => m.ReceiveWaiting),
  { ssr: false }
)

export function ReceiveWaitingLoader() {
  return <ReceiveWaiting />
}
