"use client"
import { useEffect, useRef, useCallback } from "react"
import PartySocket from "partysocket"
import { useSessionStore } from "@/store/session.store"
import type { PeerRole, DeviceInfo } from "@/types/session"

export function usePeerConnection(
  role: PeerRole,
  code: string | null,
  onData: (data: string | ArrayBuffer) => void
) {
  const { status, error, setStatus, setError, setDeviceInfo } = useSessionStore()
  const peerRef = useRef<import("simple-peer").Instance | null>(null)
  const socketRef = useRef<PartySocket | null>(null)

  const disconnect = useCallback(() => {
    peerRef.current?.destroy()
    socketRef.current?.close()
    peerRef.current = null
    socketRef.current = null
    setStatus("disconnected")
  }, [setStatus])

  useEffect(() => {
    if (!code) return

    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
      room: `fs-${code}`,
    })
    socketRef.current = socket
    setStatus("waiting")

    async function createPeer(initiator: boolean) {
      const SimplePeer = (await import("simple-peer")).default

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      })

      peer.on("signal", (data) => {
        socket.send(JSON.stringify({ type: "signal", data }))
      })

      peer.on("connect", () => {
        setStatus("connected")
        fetch("/api/device")
          .then(r => r.json())
          .then((info: DeviceInfo) => {
            peer.send(JSON.stringify({ type: "device-info", ...info }))
          })
          .catch(() => {})
      })

      peer.on("data", (raw) => {
        try {
          const msg = JSON.parse(raw.toString())
          if (msg.type === "device-info") {
            setDeviceInfo({ deviceType: msg.deviceType, deviceName: msg.deviceName, location: msg.location })
            return
          }
        } catch {
          // binary data — pass through
        }
        onData(raw)
      })

      peer.on("error", (err) => {
        setError(err.message)
        setStatus("error")
      })
      peer.on("close", () => setStatus("disconnected"))

      peerRef.current = peer
      setStatus("signaling")
      return peer
    }

    socket.onmessage = async (event) => {
      const msg = JSON.parse(event.data as string)

      if (msg.type === "room-full") {
        setError("Sesja jest zajęta. Wróć do ekranu odbiorcy i spróbuj ponownie.")
        setStatus("error")
        socket.close()
        return
      }

      if (msg.type === "peer-left") {
        peerRef.current?.destroy()
        peerRef.current = null
        setStatus("disconnected")
        return
      }

      if (msg.type === "peer-joined" && role === "receiver") {
        await createPeer(true)
        return
      }

      if (msg.type === "signal" && role === "sender" && !peerRef.current) {
        const peer = await createPeer(false)
        peer.signal(msg.data)
        return
      }

      if (msg.type === "signal" && peerRef.current) {
        peerRef.current.signal(msg.data)
      }
    }

    return () => {
      peerRef.current?.destroy()
      socket.close()
      peerRef.current = null
      socketRef.current = null
    }
  }, [code, role, onData, setStatus, setError, setDeviceInfo])

  return { status, error, peerRef, disconnect }
}
