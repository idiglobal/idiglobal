"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export function OrderTableActions({
  orderId,
  orderNumber,
}: {
  orderId: string
  orderNumber: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" })
    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      setLoading(false)
      alert("Error al eliminar el pedido")
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
        title="Eliminar pedido"
      >
        <Trash2 size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Eliminar pedido</h3>
            <p className="text-sm text-slate-500 mb-5">
              ¿Estás seguro de que quieres eliminar el pedido{" "}
              <span className="font-medium text-slate-700">{orderNumber}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
