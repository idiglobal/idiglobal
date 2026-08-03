// Genera la salida final de los 8 avatares: original optimizado a WebP y su
// mascara de prenda, listos para el personalizador.
import sharp from "sharp"
import { mkdirSync } from "node:fs"
import { construirMascara, CLAVES } from "./build-avatares.mjs"

const SRC = "fotosweb/base-nuevas"
const OUT = "web wordpress local/app/public/wp-content/themes/identikglobal/assets/prendas"
mkdirSync(OUT, { recursive: true })

for (const k of CLAVES) {
  const file = `${SRC}/${k}.png`
  const { mascara } = await construirMascara(file)

  await sharp(file).resize(900, null, { withoutEnlargement: true })
    .webp({ quality: 86 }).toFile(`${OUT}/av-${k}.webp`)
  await sharp(mascara).resize(900, null, { withoutEnlargement: true })
    .webp({ quality: 90, lossless: false, nearLossless: true }).toFile(`${OUT}/av-${k}-mask.webp`)

  console.log(`ok  av-${k}.webp + mask`)
}
console.log(`\n${CLAVES.length} avatares generados en ${OUT}`)
