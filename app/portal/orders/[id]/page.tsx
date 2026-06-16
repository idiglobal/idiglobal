import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, ImageIcon, Ruler } from "lucide-react"
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

      {/* Design files */}
      {order.referenceFiles && (() => {
        let files: { url: string; name: string; size: number }[] = []
        try { files = JSON.parse(order.referenceFiles) } catch { /* ignore */ }
        if (files.length === 0) return null
        return (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText size={15} className="text-teal-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Archivos de diseño adjuntos</h2>
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
                    <span className="text-sm text-slate-700 truncate flex-1">{f.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{sizeFmt}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Design placement */}
      {order.designPlacement && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Ruler size={14} className="text-teal-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Ubicación y medidas del diseño</h2>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{order.designPlacement}</p>
        </div>
      )}

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
