"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

type LineItem = { product: string; description: string; quantity: number; unitPrice: number }

export function NewOrderForm() {
  const router = useRouter()
  const [items, setItems] = useState<LineItem[]>([
    { product: "", description: "", quantity: 1, unitPrice: 0 },
  ])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some((it) => !it.product)) {
      setError("Todos los productos deben tener nombre")
      return
    }
    setLoading(true)
    setError("")

    const res = await fetch("/api/portal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((it) => ({ ...it, total: it.quantity * it.unitPrice })),
        totalAmount: total,
        clientNotes: notes,
      }),
    })

    if (!res.ok) {
      setError("Error al crear el pedido")
      setLoading(false)
      return
    }

    router.push("/portal")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl">
      {/* Line items */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Productos</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium"
          >
            <Plus size={14} />
            Añadir producto
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide px-0.5">
            <span className="col-span-4">Producto</span>
            <span className="col-span-3">Descripción / especificación</span>
            <span className="col-span-2">Cant.</span>
            <span className="col-span-2">Precio ref.</span>
            <span className="col-span-1" />
          </div>

          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                <input
                  value={item.product}
                  onChange={(e) => updateItem(i, "product", e.target.value)}
                  placeholder="Nombre del producto *"
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="col-span-3">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  placeholder="Talla, color, técnica..."
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
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
                  placeholder="0.00"
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end pt-2">
                {items.length > 1 && (
                  <button
                    type="button"
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

        <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            * Los precios son orientativos. IdentiGlobal confirmará el presupuesto final.
          </span>
          <span className="text-sm font-semibold text-slate-900">
            Estimado: {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 text-sm mb-3">Notas e instrucciones</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Indicaciones especiales, referencia de diseño, colores, fecha límite..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1.5">
          También puedes enviar archivos de diseño por email a pedidos@idiglobal.com
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Enviando pedido..." : "Enviar pedido"}
      </button>
    </form>
  )
}
