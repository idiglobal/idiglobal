// Generates icon-192.png and icon-512.png using @vercel/og's Satori + resvg
// Run: node scripts/generate-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { createCanvas } from "canvas"

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")

  // Background gradient (teal)
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, "#0f766e")
  grad.addColorStop(1, "#0d9488")
  ctx.fillStyle = grad
  const r = size * 0.12
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.arcTo(size, 0, size, r, r)
  ctx.lineTo(size, size - r)
  ctx.arcTo(size, size, size - r, size, r)
  ctx.lineTo(r, size)
  ctx.arcTo(0, size, 0, size - r, r)
  ctx.lineTo(0, r)
  ctx.arcTo(0, 0, r, 0, r)
  ctx.closePath()
  ctx.fill()

  // "IG" text
  ctx.fillStyle = "white"
  ctx.font = `bold ${size * 0.42}px sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("IG", size / 2, size * 0.46)

  // Subtitle text
  ctx.font = `${size * 0.09}px sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.fillText("IDENTIKGLOBAL", size / 2, size * 0.76)

  return canvas.toBuffer("image/png")
}

mkdirSync("public/icons", { recursive: true })
writeFileSync("public/icons/icon-192.png", drawIcon(192))
writeFileSync("public/icons/icon-512.png", drawIcon(512))
console.log("✓ Icons generated: public/icons/icon-192.png & icon-512.png")
