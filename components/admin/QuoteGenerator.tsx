"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, FileDown } from "lucide-react"

type Client = { id: string; companyName: string; contactName: string; email: string }
type LineItem = { product: string; description: string; quantity: number; unitPrice: number }

const IVA_OPTIONS = [
  { label: "21%", value: 0.21 },
  { label: "10%", value: 0.10 },
  { label: "4%",  value: 0.04 },
  { label: "0%",  value: 0    },
]

export function QuoteGenerator({
  clients,
  nextOrderNumber,
}: {
  clients: Client[]
  nextOrderNumber: string
}) {
  const router = useRouter()
  const [clientId, setClientId] = useState("")
  const [items, setItems] = useState<LineItem[]>([
    { product: "", description: "", quantity: 1, unitPrice: 0 },
  ])
  const [ivaRate, setIvaRate] = useState(0.21)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<string | null>(null)

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    )
  }

  function addItem() {
    setItems((prev) => [...prev, { product: "", description: "", quantity: 1, unitPrice: 0 }])
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
  const ivaAmount = subtotal * ivaRate
  const total = subtotal + ivaAmount

  async function generate() {
    if (!clientId || items.some((it) => !it.product)) return
    setLoading(true)

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        items: items.map((it) => ({ ...it, total: it.quantity * it.unitPrice })),
        totalAmount: total,
      }),
    })

    const data = await res.json()
    setCreated(data.id)
    setLoading(false)
    router.refresh()
  }

  async function downloadPDF() {
    if (!created) return
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    const jsPDF = (await import("jspdf")).default
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(15, 118, 110)
    doc.text("IDENTIKGLOBAL", 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("Personalización textil B2B", 14, 30)
    doc.text(`Presupuesto: ${nextOrderNumber}`, 14, 38)
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 14, 44)

    // Client info
    doc.setFontSize(11)
    doc.setTextColor(30)
    doc.text("Cliente:", 14, 58)
    doc.setFontSize(10)
    doc.setTextColor(80)
    doc.text(client.companyName, 14, 65)
    doc.text(client.contactName, 14, 71)
    doc.text(client.email, 14, 77)

    const ivaLabel = IVA_OPTIONS.find((o) => o.value === ivaRate)?.label ?? `${(ivaRate * 100).toFixed(0)}%`

    autoTable(doc, {
      startY: 90,
      head: [["Producto", "Descripción", "Cant.", "P. Unit.", "Total"]],
      body: items.map((it) => [
        it.product,
        it.description,
        it.quantity,
        formatCurrency(it.unitPrice),
        formatCurrency(it.quantity * it.unitPrice),
      ]),
      foot: [
        ["", "", "", "Base imponible", formatCurrency(subtotal)],
        ["", "", "", `IVA (${ivaLabel})`,  formatCurrency(ivaAmount)],
        ["", "", "", "TOTAL",              formatCurrency(total)],
      ],
      headStyles: { fillColor: [15, 118, 110] },
      footStyles: { fillColor: [240, 253, 250], textColor: [15, 118, 110], fontStyle: "bold" },
      styles: { fontSize: 9 },
      // Only make the last foot row bold
      didParseCell: (data) => {
        if (data.section === "foot") {
          if (data.row.index < 2) {
            data.cell.styles.fontStyle = "normal"
            data.cell.styles.textColor = [80, 80, 80]
            data.cell.styles.fillColor = [250, 250, 250]
          }
        }
      },
    })

    doc.save(`${nextOrderNumber}.pdf`)
  }

  const ivaLabel = IVA_OPTIONS.find((o) => o.value === ivaRate)?.label ?? ""

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            Número de pedido: <span className="text-teal-600">{nextOrderNumber}</span>
          </h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Seleccionar cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Líneas del presupuesto</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium"
          >
            <Plus size={14} />
            Añadir línea
          </button>
        </div>

        <div className="p-4 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                <input
                  value={item.product}
                  onChange={(e) => updateItem(i, "product", e.target.value)}
                  placeholder="Producto *"
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="col-span-3">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  placeholder="Descripción"
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                  placeholder="Cant."
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                  placeholder="P. unit"
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end pt-2">
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(i)}
                    className="text-slate-300 hover:text-red-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals block */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-2">
          {/* IVA selector */}
          <div className="flex items-center justify-end gap-3">
            <span className="text-sm text-slate-500">Tipo de IVA:</span>
            <div className="flex gap-1">
              {IVA_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setIvaRate(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    ivaRate === opt.value
                      ? "bg-teal-600 text-white border-teal-600"
                      : "border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotal */}
          <div className="flex justify-end gap-4 text-sm text-slate-500">
            <span>Base imponible</span>
            <span className="w-28 text-right">{formatCurrency(subtotal)}</span>
          </div>

          {/* IVA */}
          <div className="flex justify-end gap-4 text-sm text-slate-500">
            <span>IVA ({ivaLabel})</span>
            <span className="w-28 text-right">{formatCurrency(ivaAmount)}</span>
          </div>

          {/* Total */}
          <div className="flex justify-end gap-4 border-t border-slate-100 pt-2">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className="w-28 text-right text-sm font-semibold text-slate-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={generate}
          disabled={loading || !clientId || items.some((it) => !it.product)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Generando..." : "Crear presupuesto"}
        </button>

        {created && (
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 border border-teal-600 text-teal-600 hover:bg-teal-50 font-medium text-sm px-5 py-2.5 rounded-lg transition"
          >
            <FileDown size={15} />
            Descargar PDF
          </button>
        )}
      </div>

      {created && (
        <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm px-4 py-3 rounded-lg">
          ✓ Presupuesto {nextOrderNumber} creado correctamente.
        </div>
      )}
    </div>
  )
}
