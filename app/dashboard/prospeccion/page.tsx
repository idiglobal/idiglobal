import { prisma } from "@/lib/prisma"
import { MAX_EMAILS_PER_DAY } from "@/lib/prospeccion"
import { ProspeccionPanel } from "@/components/admin/ProspeccionPanel"

export const metadata = { title: "Prospección — Identikglobal" }

export default async function ProspeccionPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [leads, jobs, sentToday] = await Promise.all([
    prisma.prospectLead.findMany({
      orderBy: [{ intentScore: "desc" }, { createdAt: "desc" }],
      take: 500,
    }),
    prisma.prospectJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.prospectSendLog.count({ where: { success: true, sentAt: { gte: today } } }),
  ])

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Prospección</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Captación de clientes B2B: búsqueda, cualificación y contacto
        </p>
      </div>

      <ProspeccionPanel
        initialLeads={leads.map((l) => ({
          ...l,
          emailCheckedAt: l.emailCheckedAt?.toISOString() ?? null,
          lastSentAt: l.lastSentAt?.toISOString() ?? null,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        }))}
        initialJobs={jobs.map((j) => ({
          ...j,
          params: (j.params ?? {}) as Record<string, unknown>,
          createdAt: j.createdAt.toISOString(),
          startedAt: j.startedAt?.toISOString() ?? null,
          finishedAt: j.finishedAt?.toISOString() ?? null,
        }))}
        quota={{ sentToday, remaining: Math.max(0, MAX_EMAILS_PER_DAY - sentToday), max: MAX_EMAILS_PER_DAY }}
      />
    </div>
  )
}
