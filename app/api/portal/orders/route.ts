import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const clientId = (session?.user as { clientId?: string | null })?.clientId

  if (role !== "CLIENT" || !clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { items, totalAmount, clientNotes, designPlacement, referenceFiles } = await req.json()

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
      clientNotes: clientNotes || null,
      designPlacement: designPlacement || null,
      referenceFiles: referenceFiles || null,
      status: "QUOTE_SENT",
      items: {
        create: items.map((it: {
          productId?: string; product: string; description?: string
          color?: string; size?: string; quantity: number; unitPrice: number; total: number
        }) => ({
          productId: it.productId ?? null,
          product: it.product,
          description: it.description ?? null,
          color: it.color ?? null,
          size: it.size ?? null,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
        })),
      },
    },
  })

  return NextResponse.json(order, { status: 201 })
}
