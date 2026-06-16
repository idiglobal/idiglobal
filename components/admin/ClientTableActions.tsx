"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2, Loader2 } from "lucide-react"

export function ClientTableActions({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/clients/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/dashboard/clients/${id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-teal-300 hover:text-teal-600 transition"
        >
          <Pencil size={11} />
          Editar
        </Link>
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
        >
          <Trash2 size={11} />
          Eliminar
        </button>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-slate-900 text-base mb-2">¿Eliminar cliente?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Vas a eliminar a <span className="font-medium text-slate-800">{name}</span>. Sus pedidos
              existentes se conservarán pero el cliente quedará desvinculado. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
