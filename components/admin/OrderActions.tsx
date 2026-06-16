"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OrderStatus } from "@/app/generated/prisma/client"
import { STATUS_LABELS } from "@/lib/utils"

type Supplier = { id: string; name: string }

export function OrderActions({
  orderId,
  currentStatus,
  currentSupplierId,
  statuses,
  suppliers,
}: {
  orderId: string
  currentStatus: OrderStatus
  currentSupplierId: string | null
  statuses: OrderStatus[]
  suppliers: Supplier[]
}) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [supplierId, setSupplierId] = useState(currentSupplierId ?? "")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  async function save() {
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, supplierId: supplierId || null }),
    })
    setMsg("Guardado")
    setLoading(false)
    router.refresh()
    setTimeout(() => setMsg(""), 2000)
  }

  async function addNote() {
    if (!note.trim()) return
    setLoading(true)
    await fetch(`/api/orders/${orderId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    })
    setNote("")
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Acciones</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Proveedor</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Sin asignar</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={save}
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
        >
          {msg || (loading ? "Guardando..." : "Guardar cambios")}
        </button>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2">
        <label className="block text-xs font-medium text-slate-600">Añadir nota interna</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Escribe una nota..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
        <button
          onClick={addNote}
          disabled={loading || !note.trim()}
          className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
        >
          Añadir nota
        </button>
      </div>
    </div>
  )
}
