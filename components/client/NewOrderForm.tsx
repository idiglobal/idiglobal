"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, Upload, X, FileText, ImageIcon, Loader2 } from "lucide-react"

type LineItem = { product: string; description: string; quantity: number; unitPrice: number }
type UploadedFile = { url: string; name: string; size: number }

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) {
    return <ImageIcon size={14} className="text-teal-500 shrink-0" />
  }
  return <FileText size={14} className="text-slate-400 shrink-0" />
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function NewOrderForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<LineItem[]>([
    { product: "", description: "", quantity: 1, unitPrice: 0 },
  ])
  const [notes, setNotes] = useState("")
  const [designPlacement, setDesignPlacement] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
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

  function removeFile(url: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url))
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError("")

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        setError(`"${file.name}" supera los 20 MB permitidos`)
        continue
      }
      setUploadingFiles((prev) => [...prev, file.name])

      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: form })
        if (!res.ok) throw new Error("Error al subir el archivo")
        const data: UploadedFile = await res.json()
        setUploadedFiles((prev) => [...prev, data])
      } catch {
        setError(`Error al subir "${file.name}". Inténtalo de nuevo.`)
      } finally {
        setUploadingFiles((prev) => prev.filter((n) => n !== file.name))
      }
    }
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some((it) => !it.product)) {
      setError("Todos los productos deben tener nombre")
      return
    }
    if (uploadingFiles.length > 0) {
      setError("Espera a que terminen de subirse los archivos")
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
        designPlacement,
        referenceFiles: uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null,
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

      {/* Design files */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 text-sm mb-1">Archivos de diseño</h2>
        <p className="text-xs text-slate-400 mb-4">
          Sube los archivos de tu diseño (imágenes, PDF, AI, vectores…). Máx. 20 MB por archivo.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition group"
        >
          <Upload size={20} className="mx-auto mb-2 text-slate-300 group-hover:text-teal-500 transition" />
          <p className="text-sm text-slate-500 group-hover:text-teal-600">
            Haz clic o arrastra los archivos aquí
          </p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG, PDF, AI, EPS</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.eps,.svg,.psd"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Uploading */}
        {uploadingFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadingFiles.map((name) => (
              <div key={name} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Loader2 size={14} className="text-teal-500 animate-spin shrink-0" />
                <span className="text-xs text-slate-500 truncate">{name}</span>
                <span className="text-xs text-slate-400 ml-auto">Subiendo…</span>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadedFiles.map((f) => (
              <div key={f.url} className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                <FileIcon name={f.name} />
                <span className="text-xs text-slate-700 truncate flex-1">{f.name}</span>
                <span className="text-xs text-slate-400 shrink-0">{formatSize(f.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.url)}
                  className="text-slate-300 hover:text-red-500 transition shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Design placement */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 text-sm mb-1">Ubicación y medidas del diseño</h2>
        <p className="text-xs text-slate-400 mb-3">
          Indica dónde quieres el diseño en la prenda, el tamaño y cualquier detalle de posicionamiento.
        </p>
        <textarea
          value={designPlacement}
          onChange={(e) => setDesignPlacement(e.target.value)}
          rows={4}
          placeholder="Ej: Logo en el pecho izquierdo, 8×8 cm. Texto en la espalda centrado, altura 20 cm desde el cuello, tipografía Arial Bold..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      {/* General notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 text-sm mb-3">Notas generales</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Fecha límite, indicaciones de entrega, colores específicos..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || uploadingFiles.length > 0}
        className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Enviando pedido..." : "Enviar pedido"}
      </button>
    </form>
  )
}
