import { createCanvas } from "canvas"
import { writeFileSync } from "node:fs"

const W = 1200
const H = 630

const BG = "#F7F6F1"
const INK = "#2B2B28"
const TEXT_PRIMARY = "#1A1917"
const TEXT_MUTED = "#8A8880"
const ACCENT = "#1D4ED8"
const DOT = "#D1D0C8"

const canvas = createCanvas(W, H)
const ctx = canvas.getContext("2d")

// Background
ctx.fillStyle = BG
ctx.fillRect(0, 0, W, H)

// Subtle dot grid
ctx.fillStyle = DOT
const gap = 36
for (let y = gap; y < H; y += gap) {
  for (let x = gap; x < W; x += gap) {
    ctx.beginPath()
    ctx.arc(x, y, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Center content block
const cx = W / 2
const cy = H / 2

// Logo tile — 80×80, centered above text
const tileSize = 80
const tileX = cx - tileSize / 2
const tileY = cy - 140
ctx.fillStyle = ACCENT
ctx.fillRect(tileX, tileY, tileSize, tileSize)
// thin ink shadow
ctx.fillStyle = INK
ctx.fillRect(tileX + tileSize, tileY + 4, 4, tileSize)
ctx.fillRect(tileX + 4, tileY + tileSize, tileSize, 4)

// Paper-plane glyph (arrow-up-right)
ctx.strokeStyle = "#FFFFFF"
ctx.lineWidth = 5
ctx.lineCap = "round"
ctx.lineJoin = "round"
ctx.beginPath()
ctx.moveTo(tileX + 22, tileY + 58)
ctx.lineTo(tileX + 58, tileY + 22)
ctx.stroke()
// arrow head
ctx.beginPath()
ctx.moveTo(tileX + 58, tileY + 22)
ctx.lineTo(tileX + 36, tileY + 22)
ctx.stroke()
ctx.beginPath()
ctx.moveTo(tileX + 58, tileY + 22)
ctx.lineTo(tileX + 58, tileY + 44)
ctx.stroke()

// Wordmark
ctx.fillStyle = TEXT_PRIMARY
ctx.font = "bold 72px sans-serif"
ctx.textAlign = "center"
ctx.textBaseline = "top"
ctx.fillText("Flow Send", cx, tileY + tileSize + 32)

// Tagline
ctx.fillStyle = TEXT_MUTED
ctx.font = "28px sans-serif"
ctx.fillText("Pliki między urządzeniami. Bez konta.", cx, tileY + tileSize + 32 + 88)

// URL — faint, bottom-center
ctx.fillStyle = DOT
ctx.font = "22px sans-serif"
ctx.textBaseline = "bottom"
ctx.fillText("flow-send.vercel.app", cx, H - 52)

writeFileSync("public/og-image.png", canvas.toBuffer("image/png"))
console.log("wrote public/og-image.png")
