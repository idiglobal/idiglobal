import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SEGMENTS, MAX_SCRAPE_LIMIT, normalizarLeadIds } from "@/lib/prospeccion"
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

  // Validación del envío selectivo (ver CONTRATO_ENVIO_SELECTIVO.md).
  //
  // El worker interpreta "leadIds presente pero vacío" como "no enviar a nadie",
  // deliberadamente. Aquí cortamos antes: si la selección no deja ningún id
  // válido devolvemos 400 y no creamos el job, en vez de encolar uno que no
  // haría nada. La clave solo viaja si tiene contenido.
  let leadIdsLimpios: number[] | null = null
  if (type === "send") {
    const bruto = (params ?? {} as Record<string, unknown>).leadIds

    if (bruto !== undefined && bruto !== null) {
      const r = normalizarLeadIds(bruto)
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
      leadIdsLimpios = r.ids
    }
  }
  const envioSelectivo = leadIdsLimpios !== null

  // Evitar duplicados en cola.
  //
  // Para `send` se relaja: encadenar varias tandas dirigidas es un uso legítimo,
  // así que se permite si el job nuevo es selectivo Y todos los que ya están en
  // cola también lo son. Cualquier envío masivo (sin leadIds) sigue bloqueando,
  // porque barrería igualmente a los leads que se acaban de seleccionar.
  const activos = await prisma.prospectJob.findMany({
    where: { type, status: { in: ["pending", "running"] } },
    select: { params: true },
  })

  if (activos.length > 0 && type !== "scrape") {
    const permitido =
      type === "send" &&
      envioSelectivo &&
      activos.every((j) => {
        const ids = (j.params as { leadIds?: unknown } | null)?.leadIds
        return Array.isArray(ids) && ids.length > 0
      })

    if (!permitido)
      return NextResponse.json(
        {
          error:
            type === "send"
              ? "Ya hay un envío en cola. Espera a que termine, o lanza tandas seleccionando leads concretos."
              : `Ya hay un job "${type}" en cola o ejecutándose`,
        },
        { status: 409 }
      )
  }

  // Se construyen explícitamente: los ids que se guardan son siempre los ya
  // normalizados, sin depender de que una mutación anterior se haya reflejado.
  const paramsFinales = {
    ...((params ?? {}) as Record<string, unknown>),
    ...(leadIdsLimpios ? { leadIds: leadIdsLimpios } : {}),
  } as Prisma.InputJsonValue

  const job = await prisma.prospectJob.create({
    data: { type, params: paramsFinales },
  })

  return NextResponse.json(job, { status: 201 })
}
