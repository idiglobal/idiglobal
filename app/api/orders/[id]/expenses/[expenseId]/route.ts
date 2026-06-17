import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

function adminOnly(session: Awaited<ReturnType<typeof auth>>) {
  const role = (session?.user as { role?: string })?.role
  return role === "ADMIN"
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await auth()
  if (!session || !adminOnly(session))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { expenseId } = await params
  await prisma.orderExpense.delete({ where: { id: expenseId } })
  return NextResponse.json({ ok: true })
}
