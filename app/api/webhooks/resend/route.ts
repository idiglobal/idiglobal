import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  ESTADO_POR_EVENTO,
  MOTIVO_SUPRESION,
  firmaValida,
} from "@/lib/resend-webhook"

export async function POST(request: Request) {
  const secreto = process.env.RESEND_WEBHOOK_SECRET
  if (!secreto) {
    console.error("[resend-webhook] falta RESEND_WEBHOOK_SECRET")
    return NextResponse.json({ error: "No configurado" }, { status: 500 })
  }

  // El cuerpo crudo, antes de parsear: la firma se calcula sobre él.
  const cuerpo = await request.text()
  if (!firmaValida(secreto, cuerpo, request.headers)) {
    return NextResponse.json({ error: "Firma no válida" }, { status: 401 })
  }

  let evento: {
    type?: string
    data?: { email_id?: string; to?: string[]; reason?: string }
  }
  try {
    evento = JSON.parse(cuerpo)
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 })
  }

  const tipo = evento.type ?? ""
  const messageId = evento.data?.email_id
  const estado = ESTADO_POR_EVENTO[tipo]

  // Un evento que no reconocemos no es un error: se acepta con 200 para que
  // Resend no lo reintente en bucle.
  if (!estado || !messageId) {
    return NextResponse.json({ ok: true, ignorado: tipo })
  }

  const registro = await prisma.prospectSendLog.findUnique({
    where: { providerMessageId: messageId },
    select: { id: true, emailTo: true, leadId: true },
  })
  if (!registro) {
    return NextResponse.json({ ok: true, sinEnvioAsociado: messageId })
  }

  await prisma.prospectSendLog.update({
    where: { id: registro.id },
    data: {
      deliveryStatus: estado,
      deliveryDetail: evento.data?.reason ?? null,
      deliveryUpdatedAt: new Date(),
    },
  })

  const motivo = MOTIVO_SUPRESION[tipo]
  if (motivo) {
    const email = registro.emailTo.toLowerCase()
    // Suprimir es lo que protege la reputación del dominio: si rebota o nos
    // marcan como spam, esa dirección no se vuelve a tocar.
    await prisma.prospectSuppression.upsert({
      where: { email },
      create: { email, reason: motivo, note: evento.data?.reason ?? tipo },
      update: {},
    })
    await prisma.prospectLead.update({
      where: { id: registro.leadId },
      data: {
        emailStatus: tipo === "email.bounced" ? "invalido" : undefined,
        status: "envio_fallido",
      },
    })
  }

  return NextResponse.json({ ok: true, estado })
}
