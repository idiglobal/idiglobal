"use client"

import { FileDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type OrderItem = { product: string; description: string | null; quantity: number; unitPrice: number; total: number }

type Props = {
  order: {
    orderNumber: string
    clientName: string
    contactName: string
    email: string
    date: string
    items: OrderItem[]
    totalAmount: number
    status: string
  }
}

export function ClientOrderPDF({ order }: Props) {
  async function download() {
    const jsPDF = (await import("jspdf")).default
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(15, 118, 110)
    doc.text("IDIGLOBAL", 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("Personalización textil B2B", 14, 30)
    doc.text(`Pedido: ${order.orderNumber}`, 14, 38)
    doc.text(`Fecha: ${order.date}`, 14, 44)
    doc.text(`Estado: ${order.status}`, 14, 50)

    doc.setFontSize(11)
    doc.setTextColor(30)
    doc.text("Cliente:", 14, 64)
    doc.setFontSize(10)
    doc.setTextColor(80)
    doc.text(order.clientName, 14, 71)
    doc.text(order.contactName, 14, 77)
    doc.text(order.email, 14, 83)

    autoTable(doc, {
      startY: 95,
      head: [["Producto", "Descripción", "Cant.", "P. Unit.", "Total"]],
      body: order.items.map((it) => [
        it.product,
        it.description ?? "",
        it.quantity,
        formatCurrency(it.unitPrice),
        formatCurrency(it.total),
      ]),
      foot: [["", "", "", "TOTAL", formatCurrency(order.totalAmount)]],
      headStyles: { fillColor: [15, 118, 110] },
      footStyles: { fillColor: [240, 253, 250], textColor: [15, 118, 110], fontStyle: "bold" },
      styles: { fontSize: 9 },
    })

    doc.save(`${order.orderNumber}.pdf`)
  }

  return (
    <button
      onClick={download}
      className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg transition"
    >
      <FileDown size={13} />
      PDF
    </button>
  )
}
