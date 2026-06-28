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
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña obligatorios" }, { status: 400, headers: CORS })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { client: true },
  })

  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401, headers: CORS })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401, headers: CORS })
  }

  return NextResponse.json({
    clientId:    user.clientId,
    email:       user.email,
    companyName: user.client?.companyName ?? "",
    contactName: user.name ?? "",
  }, { headers: CORS })
}
