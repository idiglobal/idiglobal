"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    companyName: "", contactName: "", email: "", phone: "", password: "", confirm: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Error al crear la cuenta")
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-slate-200 rounded-xl p-10 shadow-sm">
            <CheckCircle size={48} className="mx-auto mb-4 text-teal-500" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">¡Cuenta creada!</h2>
            <p className="text-sm text-slate-500 mb-6">
              Tu cuenta ha sido registrada correctamente. Ya puedes iniciar sesión con tu email y contraseña.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
            >
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 mb-4">
            <span className="text-white font-bold text-xl">IG</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Identikglobal</h1>
          <p className="text-slate-500 mt-1 text-sm">Solicitar acceso como cliente</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/login" className="text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft size={16} />
            </Link>
            <h2 className="text-lg font-semibold text-slate-800">Crear cuenta</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la empresa *</label>
              <input
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                required
                placeholder="Ej: Textiles García S.L."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de contacto *</label>
              <input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                required
                placeholder="Tu nombre y apellidos"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                placeholder="tu@empresa.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña *</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                required
                placeholder="Repite la contraseña"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 mt-2"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-5">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-teal-600 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
