import type { Metadata } from "next"
import { ScannerLoader } from "@/components/send/scanner-loader"

export const metadata: Metadata = {
  title: "Wyślij",
  description: "Zeskanuj kod QR z drugiego urządzenia, żeby zacząć transfer.",
}

export default function SendPage() {
  return <ScannerLoader />
}
