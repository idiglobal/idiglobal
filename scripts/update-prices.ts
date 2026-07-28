/**
 * Actualiza precios por categoria sin tocar imagenes ni volver a importar.
 *
 *   npx tsx scripts/update-prices.ts --dry-run
 *   npx tsx scripts/update-prices.ts
 *
 * Los precios objetivo se leen de scripts/mockups-manifest.json, asi el
 * manifiesto sigue siendo la unica fuente de verdad.
 */
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.vercel" })

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import { readFileSync } from "node:fs"

neonConfig.poolQueryViaFetch = true

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

const DRY = process.argv.includes("--dry-run")

const manifest = JSON.parse(readFileSync("scripts/mockups-manifest.json", "utf8")) as {
  precios: { camiseta: number; sudadera: number }
}

const TARGETS: { categoria: string; precio: number }[] = [
  { categoria: "Camisetas", precio: manifest.precios.camiseta },
  { categoria: "Sudaderas", precio: manifest.precios.sudadera },
]

async function main() {
  for (const t of TARGETS) {
    const desfasados = await prisma.product.findMany({
      where: { category: t.categoria, unitPrice: { not: t.precio } },
      select: { reference: true, name: true, unitPrice: true },
      orderBy: { reference: "asc" },
    })

    const total = await prisma.product.count({ where: { category: t.categoria } })

    if (desfasados.length === 0) {
      console.log(`${t.categoria}: ${total} productos, todos ya a ${t.precio}€`)
      continue
    }

    console.log(`\n${t.categoria}: ${desfasados.length} de ${total} a cambiar -> ${t.precio}€`)
    for (const p of desfasados) {
      console.log(`  ${p.reference.padEnd(38)} ${String(p.unitPrice)}€ -> ${t.precio}€`)
    }

    if (DRY) continue

    const res = await prisma.product.updateMany({
      where: { category: t.categoria, unitPrice: { not: t.precio } },
      data: { unitPrice: t.precio },
    })
    console.log(`  actualizados: ${res.count}`)
  }

  // Verificacion final
  console.log("\n--- estado final ---")
  for (const t of TARGETS) {
    const grupos = await prisma.product.groupBy({
      by: ["unitPrice"],
      where: { category: t.categoria },
      _count: { _all: true },
    })
    for (const g of grupos) {
      console.log(`${t.categoria}: ${g._count._all} productos a ${g.unitPrice}€`)
    }
  }

  if (DRY) console.log("\nDry run: no se ha escrito nada.")
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.stack : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
