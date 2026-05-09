import sharp from "sharp"
import { statSync } from "node:fs"

const SRC = "public/hero-ilustration.png"
const TARGET_WIDTH = 1280 // hero renders at max ~520 logical px → 1280 = 2.4x density (retina-safe)

async function main() {
  const input = sharp(SRC)
  const meta = await input.metadata()
  console.log(`source: ${meta.width}×${meta.height}, ${(statSync(SRC).size / 1024).toFixed(0)} KB`)

  // Lossless WebP (smaller than PNG, modern browsers all support).
  await sharp(SRC)
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .webp({ lossless: true, effort: 6 })
    .toFile("public/hero-ilustration.webp")

  // AVIF (even smaller, perceptually lossless at q=80, falls back to webp).
  await sharp(SRC)
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .avif({ quality: 80, effort: 6 })
    .toFile("public/hero-ilustration.avif")

  // Fallback PNG, optimized + resized — keeps universal compatibility.
  await sharp(SRC)
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile("public/hero-ilustration.optimized.png")

  for (const f of [
    "public/hero-ilustration.webp",
    "public/hero-ilustration.avif",
    "public/hero-ilustration.optimized.png",
  ]) {
    console.log(`${f}: ${(statSync(f).size / 1024).toFixed(0)} KB`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
