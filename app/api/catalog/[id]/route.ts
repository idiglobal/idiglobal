import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  return role === "ADMIN"
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id }, include: { supplier: true } })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const product = await prisma.product.update({ where: { id }, data: body })
  return NextResponse.json(product)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
