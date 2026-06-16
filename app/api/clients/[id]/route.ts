import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const clientId = (session?.user as { clientId?: string | null })?.clientId
  const { id } = await params

  if (role !== "ADMIN" && clientId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { companyName, contactName, email, phone, address, conditions } = body

  const updateData: Record<string, string | null | undefined> = { contactName, phone, address }
  if (role === "ADMIN") {
    updateData.companyName = companyName
    updateData.email = email
    updateData.conditions = conditions
  }

  const client = await prisma.client.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(client)
}
