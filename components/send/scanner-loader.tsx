"use client"
import dynamic from "next/dynamic"

const SendWaiting = dynamic(
  () => import("./send-waiting").then(m => m.SendWaiting),
  { ssr: false, loading: () => null }
)

export function ScannerLoader() {
  return <SendWaiting />
}
