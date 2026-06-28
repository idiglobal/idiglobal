import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

export async function POST(req: NextRequest) {
  const { companyName, contactName, email, phone, items, technique, designDescription, referenceFiles, clientId: bodyClientId } = await req.json()

  if (!companyName || !contactName || !email || !items?.length) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400, headers: CORS })
  }

  let clientId: string

  if (bodyClientId) {
    const existing = await prisma.client.findUnique({ where: { id: bodyClientId } })
    if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404, headers: CORS })
    clientId = existing.id
  } else {
    const client = await prisma.client.upsert({
      where: { email },
      update: { companyName, contactName, phone: phone || undefined },
      create: { companyName, contactName, email, phone: phone || null },
    })
    clientId = client.id
  }

  // Generate order number
  const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: "desc" }, select: { orderNumber: true } })
  const year = new Date().getFullYear()
  let seq = 1
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-")
    if (parseInt(parts[1]) === year) seq = parseInt(parts[2]) + 1
  }
  const orderNumber = `IG-${year}-${String(seq).padStart(3, "0")}`

  const notes = [
    technique ? `Técnica: ${technique}` : null,
    designDescription ? `Diseño: ${designDescription}` : null,
  ].filter(Boolean).join(" · ")

  const order = await prisma.order.create({
    data: {
      orderNumber,
      clientId,
      totalAmount: 0,
      status: "QUOTE_SENT",
      clientNotes: notes || null,
      designPlacement: designDescription || null,
      referenceFiles: referenceFiles?.length ? referenceFiles.join(",") : null,
      items: {
        create: items.map((item: { product: string; quantity: number }) => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: 0,
          total: 0,
        })),
      },
    },
  })

  return NextResponse.json({ ok: true, clientId, orderId: order.id, orderNumber }, { status: 201, headers: CORS })
}
