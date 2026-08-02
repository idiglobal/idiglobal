/**
 * Crea los dos productos que abren el personalizador.
 *
 *   npx tsx scripts/import-personalizables.ts --dry-run
 *   npx tsx scripts/import-personalizables.ts
 *
 * Idempotente: upsert por referencia.
 */
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.vercel" })

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import { readFileSync, existsSync } from "node:fs"

neonConfig.poolQueryViaFetch = true

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

const DRY = process.argv.includes("--dry-run")
const COLLECTION = "Personalizables"
const SIZES = JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"])
const SRC = "web wordpress local/app/public/wp-content/themes/identikglobal/assets/prendas"
const UPLOAD = `${process.env.IMPORT_BASE_URL ?? "https://idiglobal.vercel.app"}/api/upload-public`

const PRODUCTOS = [
  {
    reference: "PER-CAMISETA",
    name: "Camiseta personalizada",
    category: "Camisetas",
    unitPrice: 20,
    file: "camiseta_espalda.webp",
    description:
      "Diséñala tú: elige color, añade tu nombre, dorsal y logo, y colócalo donde quieras. Desde 10 unidades.",
  },
  {
    reference: "PER-SUDADERA",
    name: "Sudadera personalizada",
    category: "Sudaderas",
    unitPrice: 35,
    file: "sudadera_espalda.webp",
    description:
      "Sudadera con capucha a tu gusto: color, nombre, dorsal y logo en la espalda o el pecho. Desde 10 unidades.",
  },
]

async function subir(path: string, folder: string, nombre: string) {
  const body = new Blob([readFileSync(path)], { type: "image/webp" })
  let ultimo: unknown
  for (let i = 1; i <= 3; i++) {
    try {
      const fd = new FormData()
      fd.append("file", body, nombre)
      fd.append("folder", folder)
      const res = await fetch(UPLOAD, { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      return data.url as string
    } catch (e) {
      ultimo = e
      if (i < 3) await new Promise((r) => setTimeout(r, 1000 * i))
    }
  }
  throw new Error(`No se pudo subir ${path}: ${ultimo}`)
}

async function main() {
  for (const p of PRODUCTOS) {
    const path = `${SRC}/${p.file}`
    if (!existsSync(path)) {
      console.warn(`falta ${path} — se omite`)
      continue
    }
    console.log(`${p.reference.padEnd(16)} ${p.name}  ${p.unitPrice}€`)
    if (DRY) continue

    const imageUrl = await subir(path, `catalogo/${p.reference}`, "principal.webp")
    const data = {
      name: p.name,
      description: p.description,
      collection: COLLECTION,
      category: p.category,
      unitPrice: p.unitPrice,
      sizes: SIZES,
      imageUrl,
    }
    await prisma.product.upsert({
      where: { reference: p.reference },
      update: data,
      create: { reference: p.reference, minQuantity: 10, available: true, ...data },
    })
    console.log("  ok")
  }

  const total = await prisma.product.count({ where: { collection: COLLECTION } })
  console.log(`\n${total} productos en "${COLLECTION}"`)
  if (DRY) console.log("Dry run: no se ha subido ni escrito nada.")
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.stack : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
