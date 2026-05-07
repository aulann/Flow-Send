"use client"
import { useEffect, useRef, useState } from "react"
import { parseQrPayload } from "@/lib/qr"

export type ScannerStatus = "requesting" | "scanning" | "denied" | "error"

export function useQrScanner(
  elementId: string,
  onCode: (code: string) => void
) {
  const [status, setStatus] = useState<ScannerStatus>("requesting")
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null)
  const calledRef = useRef(false)
  const startedRef = useRef(false)

  useEffect(() => {
    let active = true

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode(elementId)
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (!active || calledRef.current) return
            const code = parseQrPayload(decoded)
            if (code) {
              calledRef.current = true
              onCode(code)
            }
          },
          () => {}
        )
        startedRef.current = true
        if (active) setStatus("scanning")
      } catch (err) {
        if (!active) return
        const msg = err instanceof Error ? err.message : String(err)
        setStatus(msg.toLowerCase().includes("permission") ? "denied" : "error")
      }
    }

    start()

    return () => {
      active = false
      if (startedRef.current) {
        startedRef.current = false
        scannerRef.current?.stop().catch(() => {})
      }
    }
  }, [elementId, onCode])

  return { status }
}
