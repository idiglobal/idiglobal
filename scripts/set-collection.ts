/**
 * Asigna el apartado (collection) a productos ya existentes.
 *
 *   npx tsx scripts/set-collection.ts --dry-run
 *   npx tsx scripts/set-collection.ts
 *
 * Los productos de coches se identifican por su referencia (CAM-/SUD-), que es
 * la que genero el importador de mockups.
 */
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.vercel" })

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"

neonConfig.poolQueryViaFetch = true

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

const DRY = process.argv.includes("--dry-run")

const COCHES = "Diseños de coches"

async function main() {
  // Solo los importados desde mockups llevan estas referencias.
  // Ojo: en SQL `collection != 'x'` es NULL (falsy) si collection es NULL, asi
  // que hay que pedir los NULL explicitamente o no se seleccionaria ninguno.
  const where = {
    AND: [
      { OR: [{ reference: { startsWith: "CAM-" } }, { reference: { startsWith: "SUD-" } }] },
      { OR: [{ collection: null }, { collection: { not: COCHES } }] },
    ],
  }

  const pendientes = await prisma.product.findMany({
    where,
    select: { reference: true, category: true, collection: true },
    orderBy: { reference: "asc" },
  })

  console.log(`${pendientes.length} productos a asignar -> "${COCHES}"`)
  for (const p of pendientes.slice(0, 5)) {
    console.log(`  ${p.reference.padEnd(38)} ${p.collection ?? "(sin apartado)"} -> ${COCHES}`)
  }
  if (pendientes.length > 5) console.log(`  ... y ${pendientes.length - 5} mas`)

  if (!DRY && pendientes.length) {
    const res = await prisma.product.updateMany({ where, data: { collection: COCHES } })
    console.log(`\nactualizados: ${res.count}`)
  }

  console.log("\n--- estado final ---")
  const grupos = await prisma.product.groupBy({
    by: ["collection", "category"],
    _count: { _all: true },
    orderBy: [{ collection: "asc" }, { category: "asc" }],
  })
  for (const g of grupos) {
    console.log(`${g.collection ?? "(sin apartado)"} / ${g.category ?? "(sin categoria)"}: ${g._count._all}`)
  }

  if (DRY) console.log("\nDry run: no se ha escrito nada.")
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.stack : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
