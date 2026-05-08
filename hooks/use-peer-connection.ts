"use client";
import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import { useSessionStore } from "@/store/session.store";
import type { PeerRole, DeviceInfo } from "@/types/session";

export function usePeerConnection(
  role: PeerRole,
  code: string | null,
  onData: (data: string | ArrayBuffer) => void,
  ownDeviceInfo: DeviceInfo | null,
) {
  const { status, error, setStatus, setError, setDeviceInfo } =
    useSessionStore();
  const peerRef = useRef<import("simple-peer").Instance | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  // Signal queue for sender: buffers signals that arrive before createPeer resolves.
  // Without this, multiple concurrent async createPeer calls happen when trickle ICE
  // sends several signals before the first dynamic import of simple-peer finishes.
  const signalQueueRef = useRef<import("simple-peer").SignalData[]>([]);
  const peerCreatingRef = useRef(false);

  const onDataRef = useRef(onData);
  onDataRef.current = onData;
  const ownDeviceInfoRef = useRef(ownDeviceInfo);
  ownDeviceInfoRef.current = ownDeviceInfo;

  const disconnect = useCallback(() => {
    peerRef.current?.destroy();
    socketRef.current?.close();
    peerRef.current = null;
    socketRef.current = null;
    signalQueueRef.current = [];
    peerCreatingRef.current = false;
    setStatus("disconnected");
  }, [setStatus]);

  const send = useCallback((data: string | ArrayBuffer) => {
    if (peerRef.current?.connected) {
      peerRef.current.send(data as never);
    }
  }, []);

  useEffect(() => {
    if (!code) return;

    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
      room: `fs-${code}`,
    });
    socketRef.current = socket;
    signalQueueRef.current = [];
    peerCreatingRef.current = false;
    setStatus("waiting");

    async function createPeer(initiator: boolean) {
      const SimplePeer = (await import("simple-peer")).default;

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      peer.on("signal", (data) => {
        socket.send(JSON.stringify({ type: "signal", data }));
      });

      peer.on("connect", () => {
        setStatus("connected");
        if (ownDeviceInfoRef.current) {
          peer.send(
            JSON.stringify({
              type: "device-info",
              ...ownDeviceInfoRef.current,
            }),
          );
        }
      });

      peer.on("data", (raw) => {
        const str = raw.toString();
        try {
          const msg = JSON.parse(str);
          if (msg.type === "device-info") {
            setDeviceInfo({
              deviceType: msg.deviceType,
              deviceName: msg.deviceName,
              location: msg.location,
            });
            return;
          }
          onDataRef.current(str);
        } catch {
          const ab = raw.buffer.slice(
            raw.byteOffset,
            raw.byteOffset + raw.byteLength,
          ) as ArrayBuffer;
          onDataRef.current(ab);
        }
      });

      peer.on("error", (err) => {
        setError(err.message);
        setStatus("error");
      });
      peer.on("close", () => setStatus("disconnected"));

      peerRef.current = peer;
      setStatus("signaling");
      return peer;
    }

    // Synchronous handler — no async/await here.
    // Async peer creation is done via Promise chains to prevent concurrent calls.
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);

      if (msg.type === "room-full") {
        setError(
          "Sesja jest zajęta. Wróć do ekranu odbiorcy i spróbuj ponownie.",
        );
        setStatus("error");
        socket.close();
        return;
      }

      if (msg.type === "peer-left") {
        peerRef.current?.destroy();
        peerRef.current = null;
        setStatus("disconnected");
        return;
      }

      // Receiver: create initiator peer once when the sender joins.
      if (
        msg.type === "peer-joined" &&
        role === "receiver" &&
        !peerRef.current
      ) {
        createPeer(true);
        return;
      }

      if (msg.type === "signal") {
        if (role === "receiver") {
          // Receiver: peer already exists (initiator), just relay the answer/ICE.
          if (peerRef.current) {
            peerRef.current.signal(msg.data);
          }
        } else {
          // Sender: buffer every incoming signal until the peer is ready.
          // createPeer is kicked off exactly once; subsequent signals are queued
          // and flushed in order when the peer resolves.
          if (peerRef.current) {
            peerRef.current.signal(msg.data);
          } else {
            signalQueueRef.current.push(
              msg.data as import("simple-peer").SignalData,
            );
            if (!peerCreatingRef.current) {
              peerCreatingRef.current = true;
              createPeer(false)
                .then((peer) => {
                  const queued = signalQueueRef.current.splice(0);
                  queued.forEach((s) => peer.signal(s));
                  peerCreatingRef.current = false;
                })
                .catch((err) => {
                  peerCreatingRef.current = false;
                  setError(err?.message ?? "Failed to create peer");
                  setStatus("error");
                });
            }
          }
        }
        return;
      }
    };

    return () => {
      peerRef.current?.destroy();
      socket.close();
      peerRef.current = null;
      socketRef.current = null;
      signalQueueRef.current = [];
      peerCreatingRef.current = false;
    };
  }, [code, role, setStatus, setError, setDeviceInfo]);

  return { status, error, peerRef, send, disconnect };
}
