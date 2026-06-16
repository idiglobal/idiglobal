import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate, STATUS_LABELS } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/Badge"
import { Plus } from "lucide-react"

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
    include: { client: true, supplier: true },
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Proveedor</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Importe</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    No se encontraron pedidos
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{order.client.companyName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status as OrderStatus} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{order.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-teal-600 hover:text-teal-700 text-xs font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
