import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/catalog — available to logged-in users (clients browse it)
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const products = await prisma.product.findMany({
    where: { available: true },
    include: { supplier: { select: { name: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(products)
}

// POST /api/catalog — admin only
export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const product = await prisma.product.create({ data: body })
  return NextResponse.json(product, { status: 201 })
}
