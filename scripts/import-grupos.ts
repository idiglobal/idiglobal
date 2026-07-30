/**
 * Importa los ejemplos de fotosweb/grupos-ejemplos al apartado
 * "Sudaderas para grupos y colegios".
 *
 *   npx tsx scripts/import-grupos.ts --dry-run
 *   npx tsx scripts/import-grupos.ts
 *
 * Van con precio 0 a proposito: es lo que hace que en la web salgan con el
 * boton "Pedir presupuesto" en vez de comprar online.
 * Idempotente: upsert por referencia.
 */
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.vercel" })

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

neonConfig.poolQueryViaFetch = true

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

const SRC = "fotosweb/grupos-ejemplos"
const DRY = process.argv.includes("--dry-run")

const COLLECTION = "Grupos, colegios y equipos"
// Nombre anterior; se renombra en sitio para no duplicar productos
const COLLECTION_ANTERIOR = "Sudaderas para grupos y colegios"
const SIZES = JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"])

const UPLOAD_ENDPOINT = `${process.env.IMPORT_BASE_URL ?? "https://idiglobal.vercel.app"}/api/upload-public`

const EJEMPLOS = [
  {
    file: "promocion-clase.jpg",
    reference: "GRP-PROMOCION-CLASE",
    name: "Sudaderas de promoción para clase",
    description:
      "Sudaderas a juego para toda la clase, con dorsal y nombre del centro estampados en la espalda. Desde 10 unidades.",
  },
  {
    file: "promocion-dorsal.jpg",
    reference: "GRP-PROMOCION-DORSAL",
    name: "Sudadera de promoción con dorsal",
    description:
      "Sudadera oversize con dorsal gigante en la espalda. Puede rellenarse con los nombres de todo el grupo.",
  },
  {
    file: "equipo-deportivo.jpg",
    reference: "GRP-EQUIPO-DEPORTIVO",
    name: "Sudaderas para equipo deportivo",
    description:
      "Equipaciones a juego para clubes y equipos, con dorsal y apellido de cada jugador.",
  },
  {
    file: "colores-disponibles.jpg",
    reference: "GRP-COLORES",
    name: "Sudaderas de grupo en varios colores",
    description:
      "Elige el color de la prenda: marino, gris, granate, verde y muchos más. Personalización en serigrafía o bordado.",
  },
  {
    file: "delante-y-espalda.jpg",
    reference: "GRP-DELANTE-ESPALDA",
    name: "Sudadera de grupo, delante y espalda",
    description:
      "Estampado pequeño en el pecho y diseño grande en la espalda, la combinación más pedida para promociones.",
  },
  // Equipaciones deportivas
  {
    file: "equipacion-completa.jpg",
    reference: "GRP-EQUIPACION-COMPLETA",
    name: "Equipación de fútbol completa",
    description:
      "Camiseta, pantalón y medias a juego, con dorsal, nombre y escudo del equipo. Para clubes, peñas o partidos entre amigos.",
    categoria: "Ropa técnica",
  },
  {
    file: "equipacion-equipo.jpg",
    reference: "GRP-EQUIPACION-EQUIPO",
    name: "Equipaciones para equipo o grupo de amigos",
    description:
      "Juego completo de equipaciones personalizadas para toda la plantilla, cada una con su dorsal y su nombre.",
    categoria: "Ropa técnica",
  },
  {
    file: "chandal-entrenamiento.jpg",
    reference: "GRP-CHANDAL",
    name: "Chándal de entrenamiento personalizado",
    description:
      "Chaqueta y pantalón técnicos con el escudo y los colores del club. Ideal para calentamiento y desplazamientos.",
    categoria: "Ropa técnica",
  },
  {
    file: "equipacion-dorsal.jpg",
    reference: "GRP-EQUIPACION-DORSAL",
    name: "Camiseta de juego con dorsal y nombre",
    description:
      "Tejido técnico transpirable con dorsal y apellido estampados. Se puede pedir suelta o dentro de la equipación completa.",
    categoria: "Ropa técnica",
  },
]

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
  // Renombrado en sitio del apartado: los 5 productos que ya existian pasan
  // al nombre nuevo sin duplicarse.
  if (!DRY) {
    const movidos = await prisma.product.updateMany({
      where: { collection: COLLECTION_ANTERIOR },
      data: { collection: COLLECTION },
    })
    if (movidos.count) console.log(`renombrado el apartado en ${movidos.count} productos existentes\n`)
  }

  for (const e of EJEMPLOS) {
    const path = join(SRC, e.file)
    if (!existsSync(path)) {
      console.warn(`falta ${path} — se omite`)
      continue
    }

    console.log(`${e.reference.padEnd(24)} ${e.name}`)
    if (DRY) continue

    const imageUrl = await upload(path, `catalogo/${e.reference}`, "principal.jpg")

    const data = {
      name: e.name,
      description: e.description,
      collection: COLLECTION,
      // Las equipaciones traen su propia categoria; el resto son sudaderas
      category: ("categoria" in e ? e.categoria : undefined) ?? "Sudaderas",
      unitPrice: 0,
      sizes: SIZES,
      imageUrl,
    }

    await prisma.product.upsert({
      where: { reference: e.reference },
      update: data,
      create: { reference: e.reference, minQuantity: 10, available: true, ...data },
    })
    console.log(`  ok`)
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
