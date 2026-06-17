import { prisma } from "@/lib/prisma"
import { STATUS_LABELS } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import Link from "next/link"
import { Plus } from "lucide-react"
import { OrdersTable } from "@/components/admin/OrdersTable"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; client?: string; q?: string }>
}) {
  const params = await searchParams
  const { status, client: clientId, q } = params

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(clientId ? { clientId } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q } },
              { client: { companyName: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { client: true, supplier: true, expenses: true },
    orderBy: { createdAt: "desc" },
  })

  const clients = await prisma.client.findMany({ orderBy: { companyName: "asc" } })

  const statuses: OrderStatus[] = [
    "QUOTE_SENT",
    "CONFIRMED",
    "IN_PRODUCTION",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pedidos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders.length} resultado(s)</p>
        </div>
        <Link
          href="/dashboard/quotes"
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={15} />
          Nuevo presupuesto
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar pedido o cliente..."
          className="flex-1 min-w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">Todos los estados</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="client"
          defaultValue={clientId ?? ""}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">Todos los clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition"
        >
          Filtrar
        </button>
        <a
          href="/dashboard/orders"
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition"
        >
          Limpiar
        </a>
      </form>

      <OrdersTable orders={orders} />
    </div>
  )
}
