import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { StatusBadge } from "@/components/ui/Badge"
import { StatusPipeline } from "@/components/ui/StatusPipeline"
import { ClientOrderPDF } from "@/components/client/ClientOrderPDF"

export default async function ClientOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const clientId = (session?.user as { clientId?: string | null })?.clientId

  const order = await prisma.order.findUnique({
    where: { id },
    include: { client: true, items: true, notes: { where: { isInternal: false } } },
  })

  if (!order) notFound()
  if (order.clientId !== clientId) redirect("/portal")

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/portal" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={order.status as OrderStatus} />
          <ClientOrderPDF order={{
            orderNumber: order.orderNumber,
            clientName: order.client.companyName,
            contactName: order.client.contactName,
            email: order.client.email,
            date: formatDate(order.createdAt),
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
          }} />
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Estado del pedido</h2>
        <StatusPipeline currentStatus={order.status as OrderStatus} />
      </div>

      {/* Items */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm">Productos</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Producto</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Uds</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">P. Unit.</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{item.product}</p>
                  {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-700">Total</td>
              <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes from team */}
      {order.notes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Comunicaciones</h2>
          <div className="space-y-2">
            {order.notes.map((n) => (
              <div key={n.id} className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                <p className="text-sm text-slate-700">{n.content}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
