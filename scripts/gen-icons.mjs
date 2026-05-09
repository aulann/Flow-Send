import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function makeIcon(size, maskable, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#F7F6F1";
  ctx.fillRect(0, 0, size, size);

  if (maskable) {
    const pad = size * 0.2;
    const inner = size - pad * 2;
    ctx.fillStyle = "#2B2B28";
    ctx.beginPath();
    ctx.roundRect(pad, pad, inner, inner, inner * 0.18);
    ctx.fill();
    ctx.fillStyle = "#F7F6F1";
  } else {
    ctx.fillStyle = "#2B2B28";
    const r = size * 0.38;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F7F6F1";
  }

  ctx.font = `bold ${Math.round(size * 0.32)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FS", size / 2, size / 2);

  writeFileSync(outPath, canvas.toBuffer("image/png"));
  console.log("wrote", outPath);
}

makeIcon(192, false, "public/icons/icon-192.png");
makeIcon(192, true,  "public/icons/icon-192-maskable.png");
makeIcon(512, false, "public/icons/icon-512.png");
makeIcon(512, true,  "public/icons/icon-512-maskable.png");
