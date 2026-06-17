import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

function adminOnly(session: Awaited<ReturnType<typeof auth>>) {
  const role = (session?.user as { role?: string })?.role
  return role === "ADMIN"
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !adminOnly(session))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const expenses = await prisma.orderExpense.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(expenses)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !adminOnly(session))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { concept, amount, notes } = await req.json()

  if (!concept || typeof amount !== "number" || amount < 0)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const expense = await prisma.orderExpense.create({
    data: { orderId: id, concept, amount, notes: notes || null },
  })
  return NextResponse.json(expense, { status: 201 })
}
