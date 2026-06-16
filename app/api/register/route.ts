import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { companyName, contactName, email, phone, password } = await req.json()

  if (!companyName || !contactName || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 10)

  // Crear cliente y usuario vinculado en una transacción
  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: { companyName, contactName, email, phone: phone || null },
    })
    const user = await tx.user.create({
      data: { email, name: contactName, passwordHash: hash, role: "CLIENT", clientId: client.id },
    })
    return { client, user }
  })

  return NextResponse.json({ ok: true, clientId: result.client.id }, { status: 201 })
}
