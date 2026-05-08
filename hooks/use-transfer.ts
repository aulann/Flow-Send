"use client";
import { useCallback, useRef, type RefObject } from "react";
import { useTransferStore } from "@/store/transfer.store";
import { chunkFile, mimeToSubtype, CHUNK_SIZE } from "@/lib/transfer";
import type { TextFrame, FileStartFrame, ControlFrame } from "@/types/transfer";

export function useTransfer(send: (data: string | ArrayBuffer) => void) {
  const { addItem, removeItem, setInProgress, setSendingProgress } =
    useTransferStore();
  const isSending = useRef(false);

  // ── Sender ──────────────────────────────────────────────────────────────────

  const sendText = useCallback(
    (content: string, subtype: "text" | "link") => {
      const id = crypto.randomUUID();
      const frame: TextFrame = { type: "text", id, content, subtype };
      send(JSON.stringify(frame));
    },
    [send],
  );

  const sendFile = useCallback(
    async (
      file: File,
      peerRef: RefObject<import("simple-peer").Instance | null>,
    ) => {
      if (isSending.current) return;
      isSending.current = true;
      try {
        setSendingProgress(0);

        const id = crypto.randomUUID();
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        const startFrame: FileStartFrame = {
          type: "file-start",
          id,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          totalChunks,
        };
        send(JSON.stringify(startFrame));

        let sent = 0;
        for await (const chunk of chunkFile(file)) {
          // Backpressure: wait for RTCDataChannel buffer to drain
          const channel = (peerRef.current as any)?._channel as
            | RTCDataChannel
            | undefined;
          while (channel && channel.bufferedAmount > 1 * 1024 * 1024) {
            await new Promise((r) => setTimeout(r, 20));
          }
          send(chunk);
          sent++;
          setSendingProgress(Math.round((sent / totalChunks) * 100));
        }

        send(JSON.stringify({ type: "file-end", id }));
        setSendingProgress(100);
        setTimeout(() => setSendingProgress(0), 800);
      } finally {
        isSending.current = false;
      }
    },
    [send, setSendingProgress],
  );

  // ── Receiver ─────────────────────────────────────────────────────────────────

  const handleIncoming = useCallback(
    (raw: string | ArrayBuffer) => {
      // Binary chunk
      if (raw instanceof ArrayBuffer) {
        useTransferStore.setState((s) => {
          if (!s.inProgress) return s;
          const updated = {
            ...s.inProgress,
            chunks: [...s.inProgress.chunks, raw],
            receivedChunks: s.inProgress.receivedChunks + 1,
          };
          return { inProgress: updated };
        });
        return;
      }

      // JSON control frame
      try {
        const msg = JSON.parse(raw) as ControlFrame;

        if (msg.type === "text") {
          addItem({
            id: msg.id,
            subtype: msg.subtype,
            content: msg.content,
            receivedAt: Date.now(),
          });
          return;
        }

        if (msg.type === "file-start") {
          setInProgress({
            id: msg.id,
            name: msg.name,
            mimeType: msg.mimeType,
            size: msg.size,
            totalChunks: msg.totalChunks,
            chunks: [],
            receivedChunks: 0,
          });
          return;
        }

        if (msg.type === "file-end") {
          useTransferStore.setState((s) => {
            if (!s.inProgress || s.inProgress.id !== msg.id) return s;
            const { name, mimeType, size, chunks } = s.inProgress;
            const blob = new Blob(chunks, { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            const subtype = mimeToSubtype(mimeType);
            const item = {
              id: msg.id,
              subtype,
              name,
              mimeType,
              size,
              blobUrl,
              receivedAt: Date.now(),
            };
            return { inProgress: null, items: [...s.items, item] };
          });
          return;
        }

        if (msg.type === "remove") {
          removeItem(msg.id);
        }
      } catch {}
    },
    [addItem, removeItem, setInProgress],
  );

  return { sendText, sendFile, handleIncoming };
}
