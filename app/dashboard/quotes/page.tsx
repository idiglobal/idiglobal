import { prisma } from "@/lib/prisma"
import { QuoteGenerator } from "@/components/admin/QuoteGenerator"

export default async function QuotesPage() {
  const clients = await prisma.client.findMany({ orderBy: { companyName: "asc" } })
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  })

  const currentYear = new Date().getFullYear()
  let nextSeq = 1
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-")
    const lastYear = parseInt(parts[1])
    const lastSeq = parseInt(parts[2])
    nextSeq = lastYear === currentYear ? lastSeq + 1 : 1
  }

  const nextOrderNumber = `IG-${currentYear}-${String(nextSeq).padStart(3, "0")}`

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Generador de presupuestos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Crea presupuestos PDF para clientes</p>
      </div>
      <QuoteGenerator clients={clients} nextOrderNumber={nextOrderNumber} />
    </div>
  )
}
