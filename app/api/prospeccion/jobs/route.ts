import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SEGMENTS, MAX_SCRAPE_LIMIT } from "@/lib/prospeccion"
import type { Prisma } from "@/app/generated/prisma/client"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  return role === "ADMIN"
}

const JOB_TYPES = new Set([
  "scrape",
  "scrape_intent",
  "enrich",
  "filter",
  "verify",
  "generate",
  "send",
])

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const jobs = await prisma.prospectJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { type, params } = body as { type: string; params?: Record<string, unknown> }
  const jsonParams = (params ?? {}) as Prisma.InputJsonValue

  // "qualify" es un atajo: encadena enrich → filter → verify → generate
  if (type === "qualify") {
    const chain = ["enrich", "filter", "verify", "generate"]
    const jobs = []
    for (const t of chain) {
      jobs.push(
        await prisma.prospectJob.create({
          data: { type: t, params: jsonParams },
        })
      )
    }
    return NextResponse.json(jobs, { status: 201 })
  }

  if (!JOB_TYPES.has(type))
    return NextResponse.json({ error: "Tipo de job inválido" }, { status: 400 })

  // Validación específica del scrape
  if (type === "scrape") {
    const p = (params ?? {}) as { keyword?: string; city?: string; limit?: number; segment?: string }
    if (!p.keyword?.trim() || !p.city?.trim())
      return NextResponse.json({ error: "keyword y city son obligatorios" }, { status: 400 })
    if (!p.segment || !(p.segment in SEGMENTS))
      return NextResponse.json({ error: "Segmento inválido" }, { status: 400 })
    p.limit = Math.min(Math.max(1, Number(p.limit) || 15), MAX_SCRAPE_LIMIT)
  }

  // Evitar duplicados exactos en cola
  const existing = await prisma.prospectJob.findFirst({
    where: { type, status: { in: ["pending", "running"] } },
  })
  if (existing && type !== "scrape") {
    return NextResponse.json(
      { error: `Ya hay un job "${type}" en cola o ejecutándose` },
      { status: 409 }
    )
  }

  const job = await prisma.prospectJob.create({
    data: { type, params: jsonParams },
  })

  return NextResponse.json(job, { status: 201 })
}
