import type { Metadata } from "next"
import { ReceiveWaitingLoader } from "@/components/receive/receive-waiting-loader"

export const metadata: Metadata = {
  title: "Odbierz",
  description: "Pokaż kod QR drugiemu urządzeniu, żeby otrzymać pliki.",
}

export default function ReceivePage() {
  return <ReceiveWaitingLoader />
}
