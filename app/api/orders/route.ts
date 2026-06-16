import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as { role?: string })?.role
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { clientId, items, totalAmount } = body

  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  })

  const year = new Date().getFullYear()
  let seq = 1
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-")
    const lastYear = parseInt(parts[1])
    const lastSeq = parseInt(parts[2])
    seq = lastYear === year ? lastSeq + 1 : 1
  }
  const orderNumber = `IG-${year}-${String(seq).padStart(3, "0")}`

  const order = await prisma.order.create({
    data: {
      orderNumber,
      clientId,
      totalAmount,
      items: {
        create: items,
      },
    },
  })

  return NextResponse.json(order, { status: 201 })
}
