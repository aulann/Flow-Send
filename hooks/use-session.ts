"use client"
import { useState, useEffect, useCallback } from "react"
import { generateSessionCode, buildQrPayload } from "@/lib/session"

const SESSION_TTL_SECONDS = 30

export function useReceiverSession() {
  const [code, setCode] = useState<string>(() => generateSessionCode())
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TTL_SECONDS)

  const refresh = useCallback(() => {
    setCode(generateSessionCode())
    setSecondsLeft(SESSION_TTL_SECONDS)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) {
      refresh()
      return
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, refresh])

  return {
    code,
    secondsLeft,
    qrPayload: buildQrPayload(code),
    refresh,
  }
}
