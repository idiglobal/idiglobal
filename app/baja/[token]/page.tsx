import { prisma } from "@/lib/prisma"
import { parseUnsubscribeToken } from "@/lib/unsubscribe"
import { CheckCircle, XCircle } from "lucide-react"

export const metadata = { title: "Baja de comunicaciones — Identikglobal" }

export default async function BajaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const leadId = parseUnsubscribeToken(token)

  let ok = false
  if (leadId) {
    const lead = await prisma.prospectLead.findUnique({ where: { id: leadId } })
    if (lead?.email) {
      const email = lead.email.trim().toLowerCase()
      await prisma.$transaction(async (tx) => {
        await tx.prospectSuppression.upsert({
          where: { email },
          update: {},
          create: { email, reason: "baja", note: `Baja vía enlace, lead #${leadId}` },
        })
        await tx.prospectLead.update({
          where: { id: leadId },
          data: { status: "descartado" },
        })
      })
      ok = true
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 sm:p-10 text-center shadow-sm">
        {ok ? (
          <>
            <CheckCircle size={44} className="mx-auto mb-4 text-teal-500" />
            <h1 className="text-lg font-semibold text-slate-900 mb-2">Baja confirmada</h1>
            <p className="text-sm text-slate-500">
              No volverás a recibir comunicaciones comerciales de Identikglobal en esta
              dirección de correo. Disculpa las molestias.
            </p>
          </>
        ) : (
          <>
            <XCircle size={44} className="mx-auto mb-4 text-slate-300" />
            <h1 className="text-lg font-semibold text-slate-900 mb-2">Enlace no válido</h1>
            <p className="text-sm text-slate-500">
              Este enlace de baja no es válido o ha caducado. Si quieres dejar de recibir
              emails, responde al último correo con la palabra BAJA.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
