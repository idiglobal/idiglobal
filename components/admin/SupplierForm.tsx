"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type SupplierData = {
  id?: string
  name: string
  contactEmail: string
  contactPhone: string
  products: string
  leadTimeDays: number
  priceTier: string
  notes: string
}

export function SupplierForm({ initial }: { initial?: SupplierData }) {
  const router = useRouter()
  const [data, setData] = useState<SupplierData>({
    name: initial?.name ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactPhone: initial?.contactPhone ?? "",
    products: initial?.products ?? "",
    leadTimeDays: initial?.leadTimeDays ?? 14,
    priceTier: initial?.priceTier ?? "STANDARD",
    notes: initial?.notes ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set<K extends keyof SupplierData>(field: K, value: SupplierData[K]) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const url = initial?.id ? `/api/suppliers/${initial.id}` : "/api/suppliers"
    const method = initial?.id ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      setError("Error al guardar")
      setLoading(false)
      return
    }

    router.push("/dashboard/suppliers")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
          <input
            value={data.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Productos <span className="text-red-500">*</span>
        </label>
        <input
          value={data.products}
          onChange={(e) => set("products", e.target.value)}
          required
          placeholder="Ej: Camisetas, Polos, Sudaderas"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Plazo (días)</label>
          <input
            type="number"
            min={1}
            value={data.leadTimeDays}
            onChange={(e) => set("leadTimeDays", parseInt(e.target.value))}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nivel de precio</label>
          <select
            value={data.priceTier}
            onChange={(e) => set("priceTier", e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="ECONOMY">Económico</option>
            <option value="STANDARD">Estándar</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
        <textarea
          value={data.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Guardando..." : initial?.id ? "Guardar cambios" : "Crear proveedor"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm px-5 py-2.5 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
