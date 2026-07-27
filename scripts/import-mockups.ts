/**
 * Importa los mockups de fotosweb/mockups al catalogo.
 *
 *   npx tsx scripts/import-mockups.ts --dry-run   # solo muestra lo que haria
 *   npx tsx scripts/import-mockups.ts             # sube imagenes y crea productos
 *
 * Es idempotente: se puede reejecutar sin duplicar (upsert por referencia).
 * Las imagenes ya subidas se reutilizan salvo que se pase --reupload.
 */
// .env.vercel trae BLOB_STORE_ID + VERCEL_OIDC_TOKEN (el Blob de este proyecto
// usa OIDC, no BLOB_READ_WRITE_TOKEN). Generarlo con:
//   vercel env pull .env.vercel --environment=production
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.vercel", override: true })

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

const SRC = "fotosweb/mockups"
const DRY = process.argv.includes("--dry-run")
const REUPLOAD = process.argv.includes("--reupload")

const SIZES = JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"])
const COLORS = JSON.stringify(["Blanco"])

type Modelo = { slug: string; name: string; marca: string }
type Manifest = {
  precios: { camiseta: number; sudadera: number }
  modelos: Modelo[]
}

const manifest: Manifest = JSON.parse(
  readFileSync("scripts/mockups-manifest.json", "utf8")
)

// Referencia legible y estable: CAM-BMW-M2, SUD-ASTON-MARTIN-DB9
function ref(prefix: string, name: string) {
  const code = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${prefix}-${code}`
}

// El Blob de este proyecto solo esta conectado por OIDC, que no funciona fuera
// de Vercel. Se sube a traves del endpoint desplegado, que si tiene credenciales.
const UPLOAD_ENDPOINT = `${process.env.IMPORT_BASE_URL ?? "https://idiglobal.vercel.app"}/api/upload-public`

/** Sube un fichero y devuelve su URL publica. Reintenta ante fallos de red. */
async function upload(localPath: string, folder: string, fileName: string) {
  const body = new Blob([readFileSync(localPath)], { type: "image/jpeg" })

  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const fd = new FormData()
      fd.append("file", body, fileName)
      fd.append("folder", folder)

      const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      return data.url as string
    } catch (err) {
      lastError = err
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
  throw new Error(`No se pudo subir ${localPath}: ${lastError}`)
}

async function main() {
  const found = readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  // Avisar si el manifiesto y las carpetas se han desincronizado
  const known = new Set(manifest.modelos.map((m) => m.slug))
  const missing = found.filter((s) => !known.has(s))
  const stale = manifest.modelos.filter((m) => !found.includes(m.slug))
  if (missing.length) console.warn(`Carpetas sin entrada en el manifiesto: ${missing.join(", ")}`)
  if (stale.length) console.warn(`Manifiesto apunta a carpetas inexistentes: ${stale.map((m) => m.slug).join(", ")}`)

  const rows: { ref: string; name: string; price: number }[] = []

  for (const m of manifest.modelos) {
    const dir = join(SRC, m.slug)

    const files = {
      camisetaEspalda: join(dir, `${m.slug}-camiseta-espalda.jpg`),
      sudaderaDelante: join(dir, `${m.slug}-sudadera-delante.jpg`),
      sudaderaEspalda: join(dir, `${m.slug}-sudadera-espalda.jpg`),
    }

    const absent = Object.entries(files).filter(([, p]) => !existsSync(p))
    if (absent.length) {
      console.warn(`${m.slug}: faltan ${absent.map(([k]) => k).join(", ")} — se omite`)
      continue
    }

    const variants = [
      {
        prefix: "CAM",
        tipo: "Camiseta",
        categoria: "Camisetas",
        precio: manifest.precios.camiseta,
        // La espalda lleva el diseno: es la foto principal
        principal: files.camisetaEspalda,
        extra: [] as string[],
        descripcion: `Camiseta blanca de algodon con diseno ${m.name} estampado en la espalda.`,
      },
      {
        prefix: "SUD",
        tipo: "Sudadera",
        categoria: "Sudaderas",
        precio: manifest.precios.sudadera,
        principal: files.sudaderaEspalda,
        extra: [files.sudaderaDelante],
        descripcion: `Sudadera con capucha blanca con diseno ${m.name} en la espalda y logo bordado en el pecho.`,
      },
    ]

    for (const v of variants) {
      const reference = ref(v.prefix, m.name)
      const name = `${v.tipo} ${m.name}`

      rows.push({ ref: reference, name, price: v.precio })
      if (DRY) continue

      const imageUrl = await upload(v.principal, `catalogo/${reference}`, "principal.jpg")

      const gallery: string[] = []
      for (let i = 0; i < v.extra.length; i++) {
        gallery.push(await upload(v.extra[i], `catalogo/${reference}`, `vista-${i + 1}.jpg`))
      }

      await prisma.product.upsert({
        where: { reference },
        update: {
          name,
          description: v.descripcion,
          category: v.categoria,
          unitPrice: v.precio,
          colors: COLORS,
          sizes: SIZES,
          imageUrl,
          gallery: gallery.length ? JSON.stringify(gallery) : null,
        },
        create: {
          reference,
          name,
          description: v.descripcion,
          category: v.categoria,
          unitPrice: v.precio,
          minQuantity: 1,
          available: true,
          colors: COLORS,
          sizes: SIZES,
          imageUrl,
          gallery: gallery.length ? JSON.stringify(gallery) : null,
        },
      })

      console.log(`  ok ${reference}  ${name}  ${v.precio}€`)
    }
  }

  console.log(`\n${rows.length} productos ${DRY ? "se crearian" : "procesados"}`)
  if (DRY) {
    for (const r of rows) console.log(`  ${r.ref.padEnd(38)} ${r.name.padEnd(42)} ${r.price}€`)
    console.log("\nDry run: no se ha subido ni escrito nada.")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
