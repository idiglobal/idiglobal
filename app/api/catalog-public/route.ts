import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

// GET /api/catalog-public — sin autenticación, para la landing en WordPress
export async function GET() {
  const products = await prisma.product.findMany({
    where: { available: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      unitPrice: true,
      minQuantity: true,
      imageUrl: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(products, { headers: CORS })
}
