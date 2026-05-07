"use client"
import { useCallback } from "react"
import QRCode from "react-qr-code"
import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react"
import { useReceiverSession } from "@/hooks/use-session"
import { usePeerConnection } from "@/hooks/use-peer-connection"
import { useSessionStore } from "@/store/session.store"
import { DeviceBadge } from "@/components/shared/device-badge"

export function ReceiveWaiting() {
  const connectionStatus = useSessionStore((s) => s.status)
  const deviceInfo = useSessionStore((s) => s.deviceInfo)

  const handleData = useCallback((data: string | ArrayBuffer) => {
    console.log("received data", data)
  }, [])

  const { code, secondsLeft, qrPayload } = useReceiverSession(
    connectionStatus === "connected" || connectionStatus === "signaling"
  )

  const { status, error, disconnect } = usePeerConnection("receiver", code, handleData)

  if (status === "connected") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
          <div className="text-lg font-semibold" style={{ color: "var(--state-success)" }}>
            Połączono
          </div>
          {deviceInfo && (
            <DeviceBadge device={deviceInfo} label="Połączono z" />
          )}
          <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
            Tablica odbioru zostanie zaimplementowana w Feature 11.
          </p>
          <button
            onClick={disconnect}
            className="sketch-btn px-5 py-2 text-sm font-medium"
            style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
          >
            Rozłącz
          </button>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
          <div className="text-base font-semibold" style={{ color: "var(--state-error)" }}>
            Błąd połączenia
          </div>
          <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="sketch-btn px-5 py-2 text-sm font-medium"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 pb-32 relative"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">

        <div className="w-full mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} />
            Strona główna
          </Link>
        </div>

        <div className="flex flex-col gap-1 mb-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Czekam na połączenie
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Pokaż ten kod urządzeniu wysyłającemu.
          </p>
        </div>

        {status === "signaling" && (
          <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Łączenie…
          </div>
        )}

        <div className="sketch-card p-6 flex flex-col items-center gap-6">

          <div style={{
            background: "var(--bg-card)",
            border: "2px solid var(--border-ink)",
            borderRadius: "14px 13px 14px 15px",
            padding: "16px",
          }}>
            <QRCode
              value={qrPayload}
              size={200}
              fgColor="var(--border-ink)"
              bgColor="var(--bg-card)"
            />
          </div>

          <div className="flex gap-2">
            {code.split("").map((char, i) => (
              <div
                key={i}
                className="w-9 h-10 flex items-center justify-center"
                style={{
                  background: "var(--bg-subtle)",
                  border: "2px solid var(--border-light)",
                  borderRadius: "6px 7px 6px 5px",
                  fontFamily: "monospace",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {char}
              </div>
            ))}
          </div>

          <div className="w-full flex flex-col gap-1">
            <div
              className="w-full h-0.75 overflow-hidden"
              style={{
                background: "var(--border-subtle)",
                borderRadius: "2px 1px 2px 1px",
              }}
            >
              <div
                key={code}
                style={{
                  height: "100%",
                  background: "var(--accent-primary)",
                  borderRadius: "2px 1px 2px 1px",
                  transformOrigin: "left center",
                  animation: "countdown-bar 30s linear forwards",
                }}
              />
            </div>
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--text-muted)" }}
            >
              {secondsLeft}s
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}
