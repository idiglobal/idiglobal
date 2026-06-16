import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate, STATUS_LABELS } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import { notFound } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/Badge"
import { StatusPipeline } from "@/components/ui/StatusPipeline"
import { OrderActions } from "@/components/admin/OrderActions"
import { ArrowLeft, Download, FileText, ImageIcon, Ruler } from "lucide-react"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      supplier: true,
      items: true,
      notes: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!order) notFound()

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } })
  const statuses: OrderStatus[] = [
    "QUOTE_SENT",
    "CONFIRMED",
    "IN_PRODUCTION",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="p-1.5 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">
            {order.client.companyName} · {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status as OrderStatus} />
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Estado del pedido</h2>
        <StatusPipeline currentStatus={order.status as OrderStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 text-sm">Líneas del pedido</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Producto</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Uds</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">P. Unit.</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.product}</p>
                      {item.description && (
                        <p className="text-xs text-slate-400">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-700 text-sm">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Design files */}
          {order.referenceFiles && (() => {
            let files: { url: string; name: string; size: number }[] = []
            try { files = JSON.parse(order.referenceFiles) } catch { /* ignore */ }
            if (files.length === 0) return null
            return (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <FileText size={15} className="text-teal-600" />
                  <h2 className="font-semibold text-slate-800 text-sm">Archivos de diseño del cliente</h2>
                  <span className="ml-auto text-xs text-slate-400">{files.length} archivo{files.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="p-4 space-y-2">
                  {files.map((f) => {
                    const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
                    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
                    const sizeFmt = f.size < 1024 * 1024
                      ? `${(f.size / 1024).toFixed(1)} KB`
                      : `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                    return (
                      <a
                        key={f.url}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg transition group"
                      >
                        {isImage
                          ? <ImageIcon size={15} className="text-teal-500 shrink-0" />
                          : <FileText size={15} className="text-slate-400 shrink-0" />
                        }
                        <span className="text-sm text-slate-700 truncate flex-1 group-hover:text-teal-700">{f.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{sizeFmt}</span>
                        <Download size={13} className="text-slate-300 group-hover:text-teal-500 shrink-0" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Design placement */}
          {order.designPlacement && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ruler size={14} className="text-teal-600" />
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Ubicación y medidas del diseño</p>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{order.designPlacement}</p>
            </div>
          )}

          {/* Client notes */}
          {order.clientNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-medium text-amber-700 mb-1">Notas generales del cliente</p>
              <p className="text-sm text-amber-900">{order.clientNotes}</p>
            </div>
          )}

          {/* Internal notes */}
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 text-sm">Notas internas</h2>
            </div>
            <div className="p-4 space-y-3">
              {order.notes.length === 0 && (
                <p className="text-sm text-slate-400">Sin notas</p>
              )}
              {order.notes.map((note) => (
                <div key={note.id} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm text-slate-700">{note.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: actions */}
        <div className="space-y-4">
          {/* Client info */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Cliente</h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-slate-800">{order.client.companyName}</p>
              <p className="text-slate-500">{order.client.contactName}</p>
              <p className="text-slate-500">{order.client.email}</p>
              {order.client.phone && (
                <p className="text-slate-500">{order.client.phone}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <OrderActions
            orderId={order.id}
            currentStatus={order.status as OrderStatus}
            currentSupplierId={order.supplierId}
            statuses={statuses}
            suppliers={suppliers}
          />
        </div>
      </div>
    </div>
  )
}
