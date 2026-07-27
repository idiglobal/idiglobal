import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  return role === "ADMIN"
}

// Transiciones permitidas desde la UI (gestión manual del pipeline)
const ALLOWED_STATUSES = new Set([
  "respondido",
  "reunion_agendada",
  "descartado",
  "enriquecido", // recuperar un descartado
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const leadId = parseInt(id, 10)
  if (!Number.isInteger(leadId))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const { status } = await req.json()
  if (!ALLOWED_STATUSES.has(status))
    return NextResponse.json({ error: "Estado no permitido" }, { status: 400 })

  const lead = await prisma.prospectLead.update({
    where: { id: leadId },
    data: { status },
  })

  return NextResponse.json(lead)
}
