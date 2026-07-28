// Compone mockups de ejemplo para el apartado "Sudaderas para grupos y colegios"
// sobre las plantillas base propias (fotosweb/base camisetas).
//
// Estilo de referencia: sudadera de color, dorsal gigante relleno de los nombres
// del grupo, y nombre del centro debajo.
//
//   node scripts/build-grupos-mockups.mjs
//   node scripts/build-grupos-mockups.mjs --only=promocion
import sharp from "sharp"
import { mkdirSync } from "node:fs"
import { join } from "node:path"

const BASE_DIR = "fotosweb/base camisetas"
const OUT = "fotosweb/grupos"
mkdirSync(OUT, { recursive: true })

// Encuadre a la prenda: deja fuera cara, manos y vaqueros, para poder tenir
// todo el recorte de una pasada sin mascaras fragiles.
const CROP = { left: 340, top: 560, width: 1180, height: 1460 }

// Zona imprimible de la espalda, en coordenadas ya recortadas
const PRINT = { left: 240, top: 430, width: 700, height: 720 }
// Pecho izquierdo visto de frente
const CHEST = { left: 660, top: 300, width: 300, height: 150 }

const FONT = "Arial, Helvetica, sans-serif"

const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]

const NOMBRES = [
  "ANA", "CARLOS", "LUCÍA", "JAVIER", "MARTA", "PABLO", "SARA", "DIEGO",
  "ELENA", "HUGO", "CLAUDIA", "MARIO", "IRENE", "ÁLVARO", "NEREA", "IVÁN",
  "PAULA", "SERGIO", "CARLA", "ADRIÁN", "LAURA", "RUBÉN", "NOA", "GONZALO",
  "MARINA", "BRUNO", "ALBA", "NICOLÁS", "JULIA", "TOMÁS", "OLIVIA", "MATEO",
]

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** Lineas de nombres que rellenaran el interior del dorsal. */
function nameLines(count, perLine) {
  const lines = []
  let i = 0
  for (let l = 0; l < count; l++) {
    const parts = []
    for (let k = 0; k < perLine; k++) parts.push(NOMBRES[i++ % NOMBRES.length])
    lines.push(parts.join(" · "))
  }
  return lines
}

/**
 * Espalda estilo "Montearagon": dorsal gigante recortado sobre un tejido de
 * nombres diminutos, y nombre del grupo debajo.
 */
function backNamesSvg({ dorsal, titulo, ink }) {
  const { width: w, height: h } = PRINT
  const numY = 520
  const numSize = 640

  // Cuanto mas juntas van las lineas, mas solido se lee el dorsal
  const lineH = 15
  const top = 40
  const lines = nameLines(Math.ceil((numY - top) / lineH) + 2, 20)
  const filas = lines
    .map(
      (t, i) =>
        `<text x="${w / 2}" y="${top + i * lineH}" font-family="${FONT}" font-size="13"
               font-weight="bold" fill="${ink}" text-anchor="middle"
               letter-spacing="0.3">${esc(t)}</text>`
    )
    .join("\n      ")

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <clipPath id="dorsal" clipPathUnits="userSpaceOnUse">
      <text x="${w / 2}" y="${numY}" font-family="${FONT}" font-size="${numSize}"
            font-weight="bold" text-anchor="middle" letter-spacing="-10">${esc(dorsal)}</text>
    </clipPath>
  </defs>
  <g clip-path="url(#dorsal)">
      ${filas}
  </g>
  <text x="${w / 2}" y="${numY + 108}" font-family="${FONT}" font-size="72" font-weight="bold"
        fill="${ink}" text-anchor="middle" letter-spacing="4">${esc(titulo)}</text>
</svg>`)
}

/**
 * Espalda estilo "La Salle": dorsal en contorno arriba y el nombre del centro
 * repetido en bloque debajo.
 */
function backRepeatSvg({ dorsal, titulo, ink }) {
  const { width: w, height: h } = PRINT
  const repeticiones = 4
  const filas = Array.from({ length: repeticiones }, (_, i) => {
    const solido = i === repeticiones - 1
    return `<text x="${w / 2}" y="${330 + i * 96}" font-family="${FONT}" font-size="96"
                  font-weight="bold" text-anchor="middle" letter-spacing="4"
                  fill="${solido ? ink : "none"}" stroke="${ink}"
                  stroke-width="${solido ? 0 : 2.5}">${esc(titulo)}</text>`
  }).join("\n  ")

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <text x="${w / 2}" y="215" font-family="${FONT}" font-size="250" font-weight="bold"
        text-anchor="middle" letter-spacing="-8" fill="none" stroke="${ink}"
        stroke-width="6">${esc(dorsal)}</text>
  ${filas}
</svg>`)
}

/** Pecho: texto pequeno a dos lineas. */
function chestSvg({ linea1, linea2, ink }) {
  const { width: w, height: h } = CHEST
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <text x="${w / 2}" y="52" font-family="${FONT}" font-size="34" font-weight="bold"
        fill="${ink}" text-anchor="middle" letter-spacing="1">${esc(linea1)}</text>
  <text x="${w / 2}" y="94" font-family="${FONT}" font-size="24" font-weight="500"
        fill="${ink}" text-anchor="middle" letter-spacing="1">${esc(linea2)}</text>
</svg>`)
}

const DISENOS = [
  {
    slug: "promocion",
    estilo: "nombres",
    prenda: "#3d4a6b",
    ink: "#ffffff",
    dorsal: "26",
    titulo: "PROMOCIÓN",
    chest: { linea1: "Promoción 2026", linea2: "2º Bachillerato" },
    nombre: "Sudadera de promoción con los nombres de la clase",
  },
  {
    slug: "colegio",
    estilo: "repetido",
    prenda: "#5f636a",
    ink: "#d8e64f",
    dorsal: "06",
    titulo: "SAN JORGE",
    chest: { linea1: "Colegio San Jorge", linea2: "Promoción 2026" },
    nombre: "Sudadera de colegio con nombre repetido",
  },
  {
    slug: "equipo",
    estilo: "nombres",
    prenda: "#2f3338",
    ink: "#ffffff",
    dorsal: "10",
    titulo: "LAS ROZAS",
    chest: { linea1: "C.D. Las Rozas", linea2: "Temporada 25/26" },
    nombre: "Sudadera de equipo deportivo",
  },
  {
    slug: "grupo",
    estilo: "repetido",
    prenda: "#6b4a3a",
    ink: "#f2e4d0",
    dorsal: "15",
    titulo: "LOS DE SIEMPRE",
    chest: { linea1: "Los de siempre", linea2: "Desde 2015" },
    nombre: "Sudadera para grupo o peña",
  },
]

/** Recorta la plantilla a la prenda y la tine del color pedido. */
async function prenda(file, color) {
  const crop = await sharp(join(BASE_DIR, file)).extract(CROP).png().toBuffer()
  const solid = await sharp({
    create: { width: CROP.width, height: CROP.height, channels: 3, background: color },
  })
    .png()
    .toBuffer()
  // multiply conserva pliegues y sombras del tejido
  return sharp(crop).composite([{ input: solid, blend: "multiply" }]).png().toBuffer()
}

for (const d of DISENOS) {
  if (only && d.slug !== only) continue

  const back = d.estilo === "nombres" ? backNamesSvg(d) : backRepeatSvg(d)

  const espalda = await prenda("base_sudadera_espalda.png", d.prenda)
  await sharp(espalda)
    .composite([{ input: back, top: PRINT.top, left: PRINT.left }])
    .jpeg({ quality: 90 })
    .toFile(join(OUT, `${d.slug}-espalda.jpg`))

  const delante = await prenda("base_sudadera_delante.png", d.prenda)
  await sharp(delante)
    .composite([{ input: chestSvg({ ...d.chest, ink: d.ink }), top: CHEST.top, left: CHEST.left }])
    .jpeg({ quality: 90 })
    .toFile(join(OUT, `${d.slug}-delante.jpg`))

  console.log(`ok ${d.slug}  ${d.nombre}`)
}
