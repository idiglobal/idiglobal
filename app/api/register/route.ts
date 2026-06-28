import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

export async function POST(req: NextRequest) {
  const { companyName, contactName, email, phone, password } = await req.json()

  if (!companyName || !contactName || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400, headers: CORS })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409, headers: CORS })
  }

  const hash = await bcrypt.hash(password, 10)

  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: { companyName, contactName, email, phone: phone || null },
    })
    const user = await tx.user.create({
      data: { email, name: contactName, passwordHash: hash, role: "CLIENT", clientId: client.id },
    })
    return { client, user }
  })

  return NextResponse.json({ ok: true, clientId: result.client.id }, { status: 201, headers: CORS })
}
