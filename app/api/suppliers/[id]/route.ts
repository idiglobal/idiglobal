import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { name, contactEmail, contactPhone, products, leadTimeDays, priceTier, notes } = body

  const supplier = await prisma.supplier.update({
    where: { id },
    data: { name, contactEmail, contactPhone, products, leadTimeDays, priceTier, notes },
  })

  return NextResponse.json(supplier)
}
