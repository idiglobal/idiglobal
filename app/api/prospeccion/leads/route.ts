import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  return role === "ADMIN"
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const city = searchParams.get("city")
  const q = searchParams.get("q")
  const segment = searchParams.get("segment")

  const leads = await prisma.prospectLead.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(segment ? { segment } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ intentScore: "desc" }, { createdAt: "desc" }],
    take: 500,
  })

  return NextResponse.json(leads)
}
