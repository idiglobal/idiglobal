"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ClientData = {
  id?: string
  companyName: string
  contactName: string
  email: string
  phone: string
  address: string
  conditions: string
}

export function ClientForm({ initial }: { initial?: ClientData }) {
  const router = useRouter()
  const [data, setData] = useState<ClientData>({
    companyName: initial?.companyName ?? "",
    contactName: initial?.contactName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    conditions: initial?.conditions ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(field: keyof ClientData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const url = initial?.id ? `/api/clients/${initial.id}` : "/api/clients"
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

    router.push("/dashboard/clients")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      {[
        { field: "companyName" as const, label: "Nombre empresa", required: true },
        { field: "contactName" as const, label: "Persona de contacto", required: true },
        { field: "email" as const, label: "Email", required: true, type: "email" },
        { field: "phone" as const, label: "Teléfono" },
        { field: "address" as const, label: "Dirección" },
      ].map(({ field, label, required, type }) => (
        <div key={field}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={type ?? "text"}
            value={data[field] as string}
            onChange={(e) => set(field, e.target.value)}
            required={required}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Condiciones comerciales
        </label>
        <textarea
          value={data.conditions}
          onChange={(e) => set("conditions", e.target.value)}
          rows={3}
          placeholder="Ej: Pago a 30 días. Descuento 5% pedidos > 5000€"
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
          {loading ? "Guardando..." : initial?.id ? "Guardar cambios" : "Crear cliente"}
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
