"use client"

import { useState } from "react"

type ProfileData = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  address: string
}

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  function set(field: keyof ProfileData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/clients/${data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setMsg("Cambios guardados")
    setLoading(false)
    setTimeout(() => setMsg(""), 3000)
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      {[
        { field: "companyName" as const, label: "Nombre empresa", disabled: true },
        { field: "contactName" as const, label: "Persona de contacto" },
        { field: "email" as const, label: "Email", type: "email", disabled: true },
        { field: "phone" as const, label: "Teléfono" },
        { field: "address" as const, label: "Dirección" },
      ].map(({ field, label, type, disabled }) => (
        <div key={field}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
          <input
            type={type ?? "text"}
            value={data[field]}
            onChange={(e) => set(field, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        {msg && <span className="text-sm text-teal-600 font-medium">✓ {msg}</span>}
      </div>
    </form>
  )
}
