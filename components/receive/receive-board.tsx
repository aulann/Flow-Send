"use client";
import React from "react";
import {
  ArrowDownIcon,
  CopyIcon,
  TrashIcon,
  FileIcon,
  ImageIcon,
  FilmStripIcon,
  LinkIcon,
  TextTIcon,
} from "@phosphor-icons/react";
import { useTransferStore } from "@/store/transfer.store";
import { formatFileSize } from "@/lib/transfer";
import type { TextTransferItem, FileTransferItem } from "@/types/transfer";

function hash(id: string, seed: number): number {
  let h = seed * 2654435761;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 15;
  }
  return Math.abs(h);
}

function cardTransform(
  id: string,
  boardW: number,
  boardH: number,
  cardW = 220,
  cardH = 200,
) {
  const x = (hash(id, 0) % Math.max(boardW - cardW - 40, 1)) + 20;
  const y = (hash(id, 1) % Math.max(boardH - cardH - 60, 1)) + 60;
  const rotate = (hash(id, 2) % 17) - 8;
  return { x, y, rotate };
}

function ChalkScribbles() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="#7A6E5F"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* wavy line top-left */}
        <polyline
          points="40,65 100,48 175,72 255,52 330,70"
          strokeWidth="2.5"
          opacity="0.22"
        />
        {/* circle top-right */}
        <circle cx="83%" cy="27%" r="36" strokeWidth="2" opacity="0.15" />
        {/* zigzag left side */}
        <polyline
          points="25,285 65,258 110,282 155,260 195,278"
          strokeWidth="2"
          opacity="0.18"
        />
        {/* hatching right side */}
        <line
          x1="68%"
          y1="78%"
          x2="78%"
          y2="77%"
          strokeWidth="2"
          opacity="0.20"
        />
        <line
          x1="69%"
          y1="82%"
          x2="77%"
          y2="81%"
          strokeWidth="2"
          opacity="0.16"
        />
        <line
          x1="70%"
          y1="86%"
          x2="76%"
          y2="85%"
          strokeWidth="1.5"
          opacity="0.12"
        />
        {/* scrawl mid-right */}
        <polyline
          points="520,175 545,155 565,178 590,152 615,168"
          strokeWidth="2"
          opacity="0.18"
        />
        {/* star outline bottom-left */}
        <polyline
          points="75,420 82,440 95,440 85,452 89,468 75,459 61,468 65,452 55,440 68,440 75,420"
          strokeWidth="1.5"
          opacity="0.15"
        />
        {/* arrow */}
        <line
          x1="140"
          y1="370"
          x2="185"
          y2="340"
          strokeWidth="2.5"
          opacity="0.19"
        />
        <polyline
          points="185,340 178,352 191,350"
          strokeWidth="2"
          opacity="0.19"
        />
      </g>
    </svg>
  );
}

function Pin() {
  return <div className="chalk-pin" />;
}

function CardActions({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-1.5 justify-end mt-3 pt-2"
      style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
    >
      {children}
    </div>
  );
}

function ActionBtn({
  onClick,
  href,
  download,
  children,
}: {
  onClick?: () => void;
  href?: string;
  download?: string;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 500,
    background: "rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: "4px 5px 4px 3px",
    color: "#444",
    textDecoration: "none",
    cursor: "pointer",
  };
  if (href)
    return (
      <a href={href} download={download} style={style}>
        {children}
      </a>
    );
  return (
    <button onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function TextCard({
  item,
  style,
  onRemove,
}: {
  item: TextTransferItem;
  style: React.CSSProperties;
  onRemove: (id: string) => void;
}) {
  const isLink = item.subtype === "link";
  return (
    <div className="chalk-card" style={style}>
      <Pin />
      <div className="flex items-start gap-2 mb-1">
        {isLink ? (
          <LinkIcon
            size={14}
            style={{ color: "#4A6FA5", flexShrink: 0, marginTop: 2 }}
          />
        ) : (
          <TextTIcon
            size={14}
            style={{ color: "#888", flexShrink: 0, marginTop: 2 }}
          />
        )}
        {isLink ? (
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs break-all"
            style={{ color: "#4A6FA5" }}
          >
            {item.content}
          </a>
        ) : (
          <p
            className="text-xs wrap-break-word whitespace-pre-wrap leading-relaxed"
            style={{ color: "#333" }}
          >
            {item.content}
          </p>
        )}
      </div>
      <CardActions>
        <ActionBtn
          onClick={() =>
            navigator.clipboard.writeText(item.content).catch(() => {})
          }
        >
          <CopyIcon size={11} /> Kopiuj
        </ActionBtn>
        <ActionBtn onClick={() => onRemove(item.id)}>
          <TrashIcon size={11} />
        </ActionBtn>
      </CardActions>
    </div>
  );
}

function FileCard({
  item,
  style,
  onRemove,
}: {
  item: FileTransferItem;
  style: React.CSSProperties;
  onRemove: (id: string) => void;
}) {
  const Icon =
    item.subtype === "image"
      ? ImageIcon
      : item.subtype === "video"
        ? FilmStripIcon
        : FileIcon;
  return (
    <div className="chalk-card" style={style}>
      <Pin />
      {item.subtype === "image" && (
        <img
          src={item.blobUrl}
          alt={item.name}
          style={{
            width: "100%",
            height: 140,
            objectFit: "cover",
            borderRadius: 2,
            marginBottom: 10,
            display: "block",
          }}
        />
      )}
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: "#888", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <p className="text-xs font-medium truncate" style={{ color: "#333" }}>
            {item.name}
          </p>
          <p style={{ fontSize: 10, color: "#999" }}>
            {formatFileSize(item.size)}
          </p>
        </div>
      </div>
      <CardActions>
        <ActionBtn href={item.blobUrl} download={item.name}>
          <ArrowDownIcon size={11} /> Pobierz
        </ActionBtn>
        <ActionBtn onClick={() => onRemove(item.id)}>
          <TrashIcon size={11} />
        </ActionBtn>
      </CardActions>
    </div>
  );
}

function InProgressCard({ style }: { style: React.CSSProperties }) {
  const inProgress = useTransferStore((s) => s.inProgress);
  if (!inProgress) return null;
  const pct =
    inProgress.totalChunks > 0
      ? Math.round((inProgress.receivedChunks / inProgress.totalChunks) * 100)
      : 0;
  return (
    <div className="chalk-card" style={style}>
      <Pin />
      <div className="flex items-center gap-2 mb-3">
        <FileIcon size={14} style={{ color: "#888" }} />
        <p className="text-xs truncate flex-1" style={{ color: "#333" }}>
          {inProgress.name}
        </p>
        <span style={{ fontSize: 10, color: "#999" }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(0,0,0,0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#4A6FA5",
            transition: "width 0.1s ease",
          }}
        />
      </div>
    </div>
  );
}

export function ReceiveBoard() {
  const { items, removeItem, inProgress } = useTransferStore();
  const isEmpty = items.length === 0 && !inProgress;

  const boardRef = React.useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = React.useState({ w: 800, h: 600 });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (!boardRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      setBoardSize({ w, h });
      setIsMobile(w < 640);
    });
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boardRef}
      className="chalkboard w-full"
      style={{ minHeight: "100dvh" }}
    >
      <div className="chalk-grain" />
      <ChalkScribbles />

      {isEmpty && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: "none" }}
        >
          <p
            style={{
              fontFamily: "var(--font-primary, sans-serif)",
              fontSize: 18,
              color: "rgba(0,0,0,0.18)",
              letterSpacing: "0.04em",
              userSelect: "none",
            }}
          >
            Czekam na pliki…
          </p>
        </div>
      )}

      {inProgress &&
        (() => {
          const { rotate } = isMobile
            ? { rotate: (hash(inProgress.id + "ip", 2) % 11) - 5 }
            : cardTransform(inProgress.id + "ip", boardSize.w, boardSize.h);
          const { x, y } = isMobile
            ? { x: 0, y: 0 }
            : cardTransform(inProgress.id + "ip", boardSize.w, boardSize.h);
          const cardStyle: React.CSSProperties = isMobile
            ? {
                transform: `rotate(${rotate}deg)`,
                margin: "40px auto 0",
                display: "block",
              }
            : {
                position: "absolute",
                left: x,
                top: y,
                transform: `rotate(${rotate}deg)`,
              };
          return <InProgressCard style={cardStyle} />;
        })()}

      {items.map((item) => {
        const { x, y, rotate } = isMobile
          ? { x: 0, y: 0, rotate: (hash(item.id, 2) % 17) - 8 }
          : cardTransform(item.id, boardSize.w, boardSize.h);

        const cardStyle: React.CSSProperties = isMobile
          ? {
              transform: `rotate(${rotate}deg)`,
              margin: "32px auto 0",
              display: "block",
            }
          : {
              position: "absolute",
              left: x,
              top: y,
              transform: `rotate(${rotate}deg)`,
              ["--card-rotate" as string]: `${rotate}deg`,
            };

        return "content" in item ? (
          <TextCard
            key={item.id}
            item={item as TextTransferItem}
            style={cardStyle}
            onRemove={removeItem}
          />
        ) : (
          <FileCard
            key={item.id}
            item={item as FileTransferItem}
            style={cardStyle}
            onRemove={removeItem}
          />
        );
      })}

      {isMobile && <div style={{ height: 180 }} />}
    </div>
  );
}
