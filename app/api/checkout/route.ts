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
  const { empresa, email, tecnica, cantidad, precio, return_url, clientId: bodyClientId } = await req.json()

  const units     = Math.max(1, parseInt(cantidad) || 1)
  const unitPrice = parseFloat(precio) || 15
  const amount    = parseFloat((units * unitPrice).toFixed(2))
  const ref       = `IG-${Date.now()}`

  // 1. Resolver cliente — si viene clientId del login lo usamos directamente
  let clientId: string
  let clientEmail = email
  let clientEmpresa = empresa

  if (bodyClientId) {
    const existing = await prisma.client.findUnique({ where: { id: bodyClientId } })
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404, headers: CORS })
    }
    clientId    = existing.id
    clientEmail = existing.email
    clientEmpresa = existing.companyName
  } else {
    const client = await prisma.client.upsert({
      where:  { email },
      update: { companyName: empresa },
      create: { companyName: empresa, contactName: empresa, email },
    })
    clientId = client.id
  }

  // 2. Número de pedido correlativo
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select:  { orderNumber: true },
  })
  const year = new Date().getFullYear()
  let seq = 1
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-")
    if (parseInt(parts[1]) === year) seq = parseInt(parts[2]) + 1
  }
  const orderNumber = `IG-${year}-${String(seq).padStart(3, "0")}`

  // 3. Crear pedido
  await prisma.order.create({
    data: {
      orderNumber,
      clientId,
      totalAmount: amount,
      status:      "CONFIRMED",
      clientNotes: `Web · ${tecnica} · Ref SumUp: ${ref}`,
      items: {
        create: [{
          product:   tecnica,
          quantity:  units,
          unitPrice,
          total:     amount,
        }],
      },
    },
  })

  // 4. Checkout SumUp
  const sumupRes = await fetch("https://api.sumup.com/v0.1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkout_reference: ref,
      amount,
      currency:        "EUR",
      merchant_code:   process.env.SUMUP_MERCHANT_CODE,
      description:     `${units} uds · ${tecnica} · ${clientEmpresa}`,
      redirect_url:    return_url || "https://identikglobal.com",
      hosted_checkout: { enabled: true },
    }),
  })

  if (!sumupRes.ok) {
    const err = await sumupRes.text()
    return NextResponse.json({ error: err }, { status: 502, headers: CORS })
  }

  const checkout = await sumupRes.json()
  const url = checkout.hosted_checkout_url ?? `https://checkout.sumup.com/pay/${checkout.id}`

  return NextResponse.json({ url }, { headers: CORS })
}
