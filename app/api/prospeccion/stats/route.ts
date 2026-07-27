import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MAX_EMAILS_PER_DAY } from "@/lib/prospeccion"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  return role === "ADMIN"
}

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [byStatus, sentToday, pendingJobs, runningJobs] = await Promise.all([
    prisma.prospectLead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.prospectSendLog.count({
      where: { success: true, sentAt: { gte: today } },
    }),
    prisma.prospectJob.count({ where: { status: "pending" } }),
    prisma.prospectJob.count({ where: { status: "running" } }),
  ])

  const counts: Record<string, number> = {}
  for (const row of byStatus) counts[row.status] = row._count._all

  return NextResponse.json({
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    sentToday,
    quotaRemaining: Math.max(0, MAX_EMAILS_PER_DAY - sentToday),
    maxPerDay: MAX_EMAILS_PER_DAY,
    pendingJobs,
    runningJobs,
  })
}
