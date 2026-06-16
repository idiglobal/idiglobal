import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { companyName, contactName, email, phone, address, conditions } = body

  const client = await prisma.client.create({
    data: { companyName, contactName, email, phone, address, conditions },
  })

  return NextResponse.json(client, { status: 201 })
}
