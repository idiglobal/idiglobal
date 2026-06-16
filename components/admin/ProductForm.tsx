"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"

type Supplier = { id: string; name: string }

type ProductFormProps = {
  suppliers: Supplier[]
  initial?: {
    id?: string
    reference?: string
    name?: string
    description?: string
    category?: string
    unitPrice?: number
    supplierId?: string
    colors?: string
    sizes?: string
    minQuantity?: number
    available?: boolean
    imageUrl?: string
  }
  mode: "new" | "edit"
}

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "TALLA ÚNICA"]
const CATEGORIES = [
  "Camisetas", "Polos", "Sudaderas", "Hoodies", "Chaquetas",
  "Pantalones", "Uniformes", "Ropa técnica", "Accesorios", "Otro",
]

export function ProductForm({ suppliers, initial = {}, mode }: ProductFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    reference: initial.reference ?? "",
    name: initial.name ?? "",
    description: initial.description ?? "",
    category: initial.category ?? "",
    unitPrice: initial.unitPrice ?? 0,
    supplierId: initial.supplierId ?? "",
    minQuantity: initial.minQuantity ?? 1,
    available: initial.available ?? true,
    imageUrl: initial.imageUrl ?? "",
  })

  const [selectedColors, setSelectedColors] = useState<string[]>(
    initial.colors ? JSON.parse(initial.colors) : []
  )
  const [colorInput, setColorInput] = useState("")
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initial.sizes ? JSON.parse(initial.sizes) : []
  )

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addColor() {
    const c = colorInput.trim()
    if (c && !selectedColors.includes(c)) setSelectedColors((prev) => [...prev, c])
    setColorInput("")
  }

  function removeColor(c: string) {
    setSelectedColors((prev) => prev.filter((x) => x !== c))
  }

  function toggleSize(s: string) {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function uploadImage(file: File) {
    if (file.size > 10 * 1024 * 1024) { setError("La imagen no puede superar 10 MB"); return }
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (res.ok) {
      const { url } = await res.json()
      set("imageUrl", url)
    } else {
      setError("Error al subir la imagen")
    }
    setUploading(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.reference || !form.name || form.unitPrice <= 0) {
      setError("Referencia, nombre y precio son obligatorios")
      return
    }
    setSaving(true)
    setError("")

    const payload = {
      ...form,
      unitPrice: Number(form.unitPrice),
      minQuantity: Number(form.minQuantity),
      supplierId: form.supplierId || null,
      colors: selectedColors.length ? JSON.stringify(selectedColors) : null,
      sizes: selectedSizes.length ? JSON.stringify(selectedSizes) : null,
      imageUrl: form.imageUrl || null,
    }

    const url = mode === "edit" ? `/api/catalog/${initial.id}` : "/api/catalog"
    const method = mode === "edit" ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError("Error al guardar el producto")
      setSaving(false)
      return
    }

    router.push("/dashboard/catalog")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-2xl">

      {/* Basic info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-800 text-sm">Información básica</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Referencia / SKU *</label>
            <input value={form.reference} onChange={(e) => set("reference", e.target.value)}
              placeholder="Ej: JHK-TS001" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Categoría</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option value="">Sin categoría</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre del producto *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="Ej: Camiseta manga corta algodón 180g" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            rows={3} placeholder="Material, características, etc."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
        </div>
      </div>

      {/* Pricing & supplier */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-800 text-sm">Precio y proveedor</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Precio unitario (€) *</label>
            <input type="number" min={0} step={0.01} value={form.unitPrice}
              onChange={(e) => set("unitPrice", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Mínimo de unidades</label>
            <input type="number" min={1} value={form.minQuantity}
              onChange={(e) => set("minQuantity", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Proveedor</label>
            <select value={form.supplierId} onChange={(e) => set("supplierId", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option value="">Sin asignar</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 text-sm">Colores disponibles</h2>
        <div className="flex gap-2">
          <input value={colorInput} onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor() } }}
            placeholder="Escribe un color y pulsa Enter o Añadir"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button type="button" onClick={addColor}
            className="px-3 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-sm font-medium hover:bg-teal-100 transition">
            Añadir
          </button>
        </div>
        {selectedColors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((c) => (
              <span key={c} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-sm text-slate-700">
                {c}
                <button type="button" onClick={() => removeColor(c)} className="text-slate-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sizes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 text-sm">Tallas disponibles</h2>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                selectedSizes.includes(s)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Image */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 text-sm">Foto del producto</h2>

        {form.imageUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.imageUrl} alt="producto" className="h-36 w-36 object-cover rounded-xl border border-slate-200" />
            <button type="button" onClick={() => set("imageUrl", "")}
              className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400 hover:text-red-500 shadow-sm">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadImage(f) }}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition group">
            {uploading
              ? <Loader2 size={20} className="mx-auto mb-2 text-teal-500 animate-spin" />
              : <ImageIcon size={20} className="mx-auto mb-2 text-slate-300 group-hover:text-teal-500 transition" />
            }
            <p className="text-sm text-slate-500">{uploading ? "Subiendo..." : "Haz clic o arrastra la foto aquí"}</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG — máx. 10 MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)}
            className="w-4 h-4 accent-teal-600" />
          <div>
            <p className="text-sm font-medium text-slate-800">Producto disponible</p>
            <p className="text-xs text-slate-400">Si está desmarcado, los clientes no podrán verlo en el catálogo</p>
          </div>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={saving || uploading}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50">
          {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear producto"}
        </button>
        <button type="button" onClick={() => router.push("/dashboard/catalog")}
          className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition">
          Cancelar
        </button>
      </div>
    </form>
  )
}
