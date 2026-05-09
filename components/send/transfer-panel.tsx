"use client"
import { useState, useRef } from "react"
import {
  TextTIcon, ImageIcon, FilmStripIcon, FileIcon, LinkIcon
} from "@phosphor-icons/react"
import { useTransferStore } from "@/store/transfer.store"
import { MAX_FILE_SIZE, formatFileSize } from "@/lib/transfer"
import type { TransferSubtype } from "@/types/transfer"

interface TransferPanelProps {
  onSendText: (content: string, subtype: "text" | "link") => void
  onSendFile: (files: File[]) => void
}

const types: { subtype: TransferSubtype; icon: React.ElementType; label: string; accept: string }[] = [
  { subtype: "text", icon: TextTIcon, label: "Tekst", accept: "" },
  { subtype: "link", icon: LinkIcon, label: "Link", accept: "" },
  { subtype: "image", icon: ImageIcon, label: "Zdjęcie", accept: "image/*" },
  { subtype: "video", icon: FilmStripIcon, label: "Wideo", accept: "video/*" },
  { subtype: "file", icon: FileIcon, label: "Plik", accept: "*/*" },
]

export function TransferPanel({ onSendText, onSendFile }: TransferPanelProps) {
  const [selected, setSelected] = useState<TransferSubtype>("text")
  const [value, setValue] = useState("")
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sendingProgress = useTransferStore((s) => s.sendingProgress)
  const isSending = sendingProgress > 0 && sendingProgress < 100

  function handleSendText() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSendText(trimmed, selected as "text" | "link")
    setValue("")
  }

  function handleTileClick(subtype: TransferSubtype) {
    setSelected(subtype)
    if (subtype === "image" || subtype === "video" || subtype === "file") {
      fileInputRef.current?.click()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, 5)
    e.target.value = ""
    if (picked.length === 0) return

    const tooBig = picked.filter((f) => f.size > MAX_FILE_SIZE)
    const ok = picked.filter((f) => f.size <= MAX_FILE_SIZE)

    if (tooBig.length > 0) {
      const names = tooBig.map((f) => `${f.name} (${formatFileSize(f.size)})`).join(", ")
      setFileError(
        `Pomijam ${tooBig.length === 1 ? "plik" : "pliki"} przekraczające ${formatFileSize(MAX_FILE_SIZE)}: ${names}`,
      )
    } else {
      setFileError(null)
    }

    if (ok.length > 0) onSendFile(ok)
  }

  const currentType = types.find((t) => t.subtype === selected)!
  const isFileTile = selected === "image" || selected === "video" || selected === "file"

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={currentType.accept}
        multiple
        onChange={handleFileChange}
      />

      {/* Type selector */}
      <div className="flex gap-2">
        {types.map(({ subtype, icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => handleTileClick(subtype)}
            disabled={isSending}
            className="flex-1 flex flex-col items-center gap-1 py-3"
            style={{
              background: subtype === selected
                ? "var(--accent-primary-dim)"
                : "var(--bg-subtle)",
              border: `2px solid ${subtype === selected ? "var(--accent-primary)" : "var(--border-light)"}`,
              borderRadius: "8px 9px 8px 7px",
              cursor: isSending ? "not-allowed" : "pointer",
              opacity: isSending ? 0.5 : 1,
            }}
          >
            <Icon
              size={20}
              weight={subtype === selected ? "bold" : "regular"}
              style={{ color: subtype === selected ? "var(--accent-primary)" : "var(--text-muted)" }}
            />
            <span className="text-xs font-medium"
              style={{ color: subtype === selected ? "var(--accent-primary)" : "var(--text-muted)" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Progress bar — visible while sending a file */}
      {isSending && (
        <div className="flex flex-col gap-1">
          <div className="w-full h-1 overflow-hidden"
            style={{ background: "var(--border-subtle)", borderRadius: "2px" }}>
            <div style={{
              height: "100%",
              width: `${sendingProgress}%`,
              background: "var(--accent-primary)",
              borderRadius: "2px",
              transition: "width 0.1s linear",
            }} />
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Wysyłanie… {sendingProgress}%
          </span>
        </div>
      )}

      {/* Text / link input — only for text/link tiles */}
      {!isFileTile && (
        <>
          {selected === "text" ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText() } }}
              placeholder="Wpisz tekst… (Enter aby wysłać)"
              rows={3}
              className="sketch-input w-full resize-none p-3 text-sm"
              style={{ color: "var(--text-primary)" }}
            />
          ) : (
            <input
              type="url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendText()}
              placeholder="https://..."
              className="sketch-input w-full p-3 text-sm"
              style={{ color: "var(--text-primary)" }}
            />
          )}
          <button
            onClick={handleSendText}
            disabled={!value.trim() || isSending}
            className="sketch-btn w-full py-3 font-semibold text-base"
            style={{
              background: value.trim() && !isSending ? "var(--accent-primary)" : "var(--bg-muted)",
              color: value.trim() && !isSending ? "#ffffff" : "var(--text-muted)",
              cursor: value.trim() && !isSending ? "pointer" : "not-allowed",
            }}
          >
            Wyślij →
          </button>
        </>
      )}

      {/* File tile hint */}
      {isFileTile && !isSending && (
        <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
          Kliknij kafelek ponownie · max 5 plików · do {formatFileSize(MAX_FILE_SIZE)} każdy
        </p>
      )}

      {/* File error */}
      {fileError && (
        <div
          className="text-xs px-3 py-2"
          style={{
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid var(--state-error)",
            borderRadius: "6px 7px 6px 5px",
            color: "var(--state-error)",
          }}
        >
          {fileError}
        </div>
      )}
    </div>
  )
}
