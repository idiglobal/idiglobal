// Builds contact sheets from the mockup folders so the print designs can be
// identified in bulk. Crops the print area, downscales, tiles with slug labels.
import sharp from "sharp"
import { readdirSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const SRC = "fotosweb/mockups"
const OUT = "scripts/contact-sheets"

// Print area within the 1856x2304 mockups (measured off the BMW M2 sample)
const CROP = { left: 650, top: 700, width: 650, height: 1000 }

const CELL_W = 380
const CELL_H = Math.round((CROP.height / CROP.width) * CELL_W) // 585
const LABEL_H = 34
const COLS = 3
const ROWS = 3
const PER_SHEET = COLS * ROWS

mkdirSync(OUT, { recursive: true })

const slugs = readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

console.log(`${slugs.length} modelos encontrados`)

function labelSvg(text) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  return Buffer.from(
    `<svg width="${CELL_W}" height="${LABEL_H}">
       <rect width="100%" height="100%" fill="#0a0a0a"/>
       <text x="${CELL_W / 2}" y="23" font-family="monospace" font-size="19"
             fill="#ffffff" text-anchor="middle">${safe}</text>
     </svg>`
  )
}

async function cell(slug) {
  const file = join(SRC, slug, `${slug}-camiseta-espalda.jpg`)
  const art = await sharp(file)
    .extract(CROP)
    .resize(CELL_W, CELL_H, { fit: "fill" })
    .toBuffer()

  return sharp({
    create: {
      width: CELL_W,
      height: CELL_H + LABEL_H,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([
      { input: art, top: 0, left: 0 },
      { input: labelSvg(slug), top: CELL_H, left: 0 },
    ])
    .jpeg()
    .toBuffer()
}

const sheets = Math.ceil(slugs.length / PER_SHEET)

for (let s = 0; s < sheets; s++) {
  const batch = slugs.slice(s * PER_SHEET, (s + 1) * PER_SHEET)
  const cells = await Promise.all(batch.map(cell))

  const composites = cells.map((input, i) => ({
    input,
    left: (i % COLS) * CELL_W,
    top: Math.floor(i / COLS) * (CELL_H + LABEL_H),
  }))

  const rowsUsed = Math.ceil(batch.length / COLS)
  const outPath = join(OUT, `sheet-${s + 1}.jpg`)

  await sharp({
    create: {
      width: COLS * CELL_W,
      height: rowsUsed * (CELL_H + LABEL_H),
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(composites)
    .jpeg({ quality: 82 })
    .toFile(outPath)

  console.log(`${outPath} -> ${batch.join(", ")}`)
}
