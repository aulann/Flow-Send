"use client"
import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react"
import { useQrScanner } from "@/hooks/use-qr-scanner"
import { isValidCode } from "@/lib/qr"

type PageState = "idle" | "connecting"

export function SendWaiting() {
  const [pageState, setPageState] = useState<PageState>("idle")
  const [capturedCode, setCapturedCode] = useState("")
  const [inputs, setInputs] = useState<string[]>(Array(6).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCode = useCallback((code: string) => {
    setCapturedCode(code)
    setPageState("connecting")
  }, [])

  const { status } = useQrScanner("qr-reader", handleCode)

  function handleInputChange(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1)
    const next = [...inputs]
    next[index] = char
    setInputs(next)
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !inputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "")
    const next = Array(6).fill("")
    pasted.slice(0, 6).split("").forEach((c, i) => { next[i] = c })
    setInputs(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  function handleConnect() {
    const code = inputs.join("")
    if (isValidCode(code)) handleCode(code)
  }

  if (pageState === "connecting") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="sketch-card p-8 w-full max-w-sm flex flex-col items-center gap-4">
          <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Łączenie…
          </div>
          <div
            className="font-mono text-sm tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            {capturedCode}
          </div>
          <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
            WebRTC zostanie wdrożone w Feature 07
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
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

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          Strona główna
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Wyślij pliki
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Zeskanuj kod QR z ekranu odbiorcy.
          </p>
        </div>

        <div className="sketch-card p-4 flex flex-col gap-5">

          {status === "denied" || status === "error" ? (
            <div
              className="w-full flex flex-col items-center justify-center gap-2 py-10"
              style={{
                background: "var(--bg-subtle)",
                borderRadius: "10px 11px 9px 10px",
                border: "2px dashed var(--border-light)",
              }}
            >
              <WarningCircle size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                {status === "denied"
                  ? "Brak dostępu do kamery. Wpisz kod ręcznie."
                  : "Nie udało się uruchomić kamery. Wpisz kod ręcznie."}
              </p>
            </div>
          ) : (
            <div
              id="qr-reader"
              className="w-full overflow-hidden"
              style={{
                borderRadius: "10px 11px 9px 10px",
                border: "2px solid var(--border-ink)",
                minHeight: "420px",
              }}
            />
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              lub wpisz kod
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <div className="flex gap-2 justify-center">
            {inputs.map((val, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                value={val}
                maxLength={1}
                onChange={e => handleInputChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-9 h-10 text-center font-mono font-bold text-lg uppercase"
                style={{
                  background: "var(--bg-card)",
                  border: "2px solid var(--border-ink)",
                  borderRadius: "6px 7px 6px 5px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                aria-label={`Znak ${i + 1} z 6`}
              />
            ))}
          </div>

          <button
            onClick={handleConnect}
            disabled={inputs.join("").length < 6}
            className="sketch-btn w-full py-3 font-semibold text-base"
            style={{
              background: inputs.join("").length === 6
                ? "var(--accent-primary)"
                : "var(--bg-muted)",
              color: inputs.join("").length === 6
                ? "#ffffff"
                : "var(--text-muted)",
              cursor: inputs.join("").length === 6 ? "pointer" : "not-allowed",
            }}
          >
            Połącz →
          </button>

        </div>
      </div>
    </div>
  )
}
