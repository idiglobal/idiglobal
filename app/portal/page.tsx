import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/Badge"
import { StatusPipeline } from "@/components/ui/StatusPipeline"
import { Plus } from "lucide-react"

export default async function PortalPage() {
  const session = await auth()
  const clientId = (session?.user as { clientId?: string | null })?.clientId

  const orders = await prisma.order.findMany({
    where: { clientId: clientId ?? "" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  const active = orders.filter(
    (o) => !["DELIVERED", "CANCELLED"].includes(o.status)
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mis pedidos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders.length} pedido(s) en total</p>
        </div>
        <Link
          href="/portal/orders/new"
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={15} />
          Nuevo pedido
        </Link>
      </div>

      {/* Active orders with pipeline */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Pedidos activos
          </h2>
          {active.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-800">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <span className="font-bold text-slate-700 text-sm">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <StatusPipeline currentStatus={order.status as OrderStatus} />
              <div className="mt-3 flex justify-end">
                <Link
                  href={`/portal/orders/${order.id}`}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Ver detalle →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All orders table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm">Historial de pedidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Productos</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Importe</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                    Aún no tienes pedidos.{" "}
                    <Link href="/portal/orders/new" className="text-teal-600 font-medium">
                      Crear tu primer pedido
                    </Link>
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status as OrderStatus} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {order.items.map((i) => i.product).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/orders/${order.id}`}
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
