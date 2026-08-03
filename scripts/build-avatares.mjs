// Genera mascaras y version tenida para los 8 avatares nuevos (chico/chica x
// camiseta/sudadera x delante/espalda), sobre fondo oscuro generado a proposito
// para que la segmentacion salga limpia.
//
//   node scripts/build-avatares.mjs --solo-mascaras   # revisar antes de tenir
//   node scripts/build-avatares.mjs                   # genera salida final
//
// Metodo en dos pasos (el que de verdad funciona con fondo oscuro):
//   1. Flood-fill de fondo desde las esquinas y los bordes medios. El salto de
//      luminancia fondo->cuerpo es grande (L~40 vs L~90+), asi que el fondo
//      queda perfectamente contenido sin escaparse por hombros ni pliegues.
//   2. Dentro de "no fondo" (persona+prenda), se descarta lo que tiene color
//      (piel, pelo): la prenda es practicamente neutra.
import sharp from "sharp"
import { mkdirSync } from "node:fs"

const SRC = "fotosweb/base-nuevas"
const OUT_DIAG = "scripts/_diag"
const SOLO_MASCARAS = process.argv.includes("--solo-mascaras")

mkdirSync(OUT_DIAG, { recursive: true })

const TOL_FONDO = 2.5   // cuanto puede variar el fondo (degradado de estudio) y seguir contandose como fondo
const CROMA_MAX = 26    // por encima de esto se considera piel/pelo, no prenda

async function construirMascara(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: Ch } = info

  const lum = new Float32Array(W * H)
  const croma = new Float32Array(W * H)
  for (let p = 0, i = 0; p < W * H; p++, i += Ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    lum[p] = r * 0.299 + g * 0.587 + b * 0.114
    croma[p] = Math.max(r, g, b) - Math.min(r, g, b)
  }

  // Paso 1: fondo desde las esquinas y los bordes medios (el sujeto nunca los toca)
  const fondo = new Uint8Array(W * H)
  const pila = []
  const semillas = [
    [0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1],
    [0, (H * 0.5) | 0], [W - 1, (H * 0.5) | 0],
  ]
  for (const [sx, sy] of semillas) {
    const p = sy * W + sx
    if (!fondo[p]) { fondo[p] = 1; pila.push(p) }
  }
  while (pila.length) {
    const p = pila.pop()
    const x = p % W, y = (p / W) | 0
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const q = ny * W + nx
      if (fondo[q] || Math.abs(lum[q] - lum[p]) > TOL_FONDO) continue
      fondo[q] = 1
      pila.push(q)
    }
  }

  // Paso 2: dentro de "no fondo", descartar piel/pelo por croma
  const raw = Buffer.alloc(W * H)
  let dentro = 0
  for (let p = 0; p < W * H; p++) {
    const ok = !fondo[p] && croma[p] <= CROMA_MAX
    raw[p] = ok ? 255 : 0
    if (ok) dentro++
  }

  const limpia = await sharp(raw, { raw: { width: W, height: H, channels: 1 } })
    .median(7).blur(2)
    .png().toBuffer()

  return { mascara: limpia, W, H, cobertura: dentro / (W * H) }
}

export async function tenir(file, mascaraPng, W, H, colorHex) {
  const alpha = await sharp(mascaraPng).extractChannel(0).raw().toBuffer()
  const solido = await sharp({ create: { width: W, height: H, channels: 3, background: colorHex } }).png().toBuffer()
  const coloreado = await sharp(solido).joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer()
  const capa = await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
    .composite([{ input: coloreado }]).png().toBuffer()
  return sharp(file).composite([{ input: capa, blend: "multiply" }]).png().toBuffer()
}

const CLAVES = [
  "cam-chico-delante", "cam-chico-espalda", "cam-chica-delante", "cam-chica-espalda",
  "sud-chico-delante", "sud-chico-espalda", "sud-chica-delante", "sud-chica-espalda",
]

if (SOLO_MASCARAS) {
  const cells = []
  for (const k of CLAVES) {
    const file = `${SRC}/${k}.png`
    const { mascara, W, H, cobertura } = await construirMascara(file)
    const teñida = await tenir(file, mascara, W, H, "#1e2a44")
    const img = await sharp(teñida).resize(230, 294, { fit: "fill" }).toBuffer()
    const lab = Buffer.from(
      `<svg width="230" height="24"><rect width="100%" height="100%" fill="#000"/><text x="4" y="17" font-family="monospace" font-size="10" fill="#0ff">${k} ${(cobertura * 100).toFixed(0)}%</text></svg>`
    )
    cells.push(await sharp({ create: { width: 230, height: 318, channels: 3, background: "#000" } })
      .composite([{ input: img, top: 0, left: 0 }, { input: lab, top: 294, left: 0 }]).png().toBuffer())
    console.log(k.padEnd(20), "cobertura:", (cobertura * 100).toFixed(1) + "%")
  }
  await sharp({ create: { width: 230 * 4, height: 318 * 2, channels: 3, background: "#000" } })
    .composite(cells.map((input, i) => ({ input, left: (i % 4) * 230, top: Math.floor(i / 4) * 318 })))
    .jpeg({ quality: 88 }).toFile(`${OUT_DIAG}/diag-tenido.jpg`)
  console.log("\nRevisa scripts/_diag/diag-tenido.jpg")
}

export { construirMascara, CLAVES }
