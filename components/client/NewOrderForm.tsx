"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Trash2, Upload, X, FileText, ImageIcon, Loader2, Package, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type Product = {
  id: string
  reference: string
  name: string
  description: string | null
  category: string | null
  unitPrice: number
  colors: string | null
  sizes: string | null
  minQuantity: number
  imageUrl: string | null
  supplier: { name: string } | null
}

type CartItem = {
  productId: string
  product: string
  unitPrice: number
  color: string
  size: string
  quantity: number
  colors: string[]
  sizes: string[]
}

type UploadedFile = { url: string; name: string; size: number }

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function NewOrderForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState("")
  const [designPlacement, setDesignPlacement] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoadingCatalog(false) })
      .catch(() => setLoadingCatalog(false))
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(filtered.map((p) => p.category ?? "Sin categoría"))]

  function addToCart(p: Product) {
    const colors: string[] = p.colors ? JSON.parse(p.colors) : []
    const sizes: string[] = p.sizes ? JSON.parse(p.sizes) : []
    setCart((prev) => [
      ...prev,
      {
        productId: p.id,
        product: p.name,
        unitPrice: p.unitPrice,
        color: colors[0] ?? "",
        size: sizes[0] ?? "",
        quantity: p.minQuantity,
        colors,
        sizes,
      },
    ])
  }

  function updateCart(i: number, field: keyof CartItem, value: string | number) {
    setCart((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function removeFromCart(i: number) {
    setCart((prev) => prev.filter((_, idx) => idx !== i))
  }

  const total = cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError("")
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { setError(`"${file.name}" supera los 20 MB`); continue }
      setUploadingFiles((prev) => [...prev, file.name])
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error()
        const data: UploadedFile = await res.json()
        setUploadedFiles((prev) => [...prev, data])
      } catch {
        setError(`Error al subir "${file.name}"`)
      } finally {
        setUploadingFiles((prev) => prev.filter((n) => n !== file.name))
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (cart.length === 0) { setError("Añade al menos un producto al pedido"); return }
    if (uploadingFiles.length > 0) { setError("Espera a que terminen de subirse los archivos"); return }
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/portal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((it) => ({
          productId: it.productId,
          product: it.product,
          description: [it.color, it.size].filter(Boolean).join(" / "),
          color: it.color || null,
          size: it.size || null,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.unitPrice * it.quantity,
        })),
        totalAmount: total,
        clientNotes: notes || null,
        designPlacement: designPlacement || null,
        referenceFiles: uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null,
      }),
    })

    if (!res.ok) { setError("Error al crear el pedido"); setSubmitting(false); return }
    router.push("/portal")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-4xl">

      {/* Catalog */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Catálogo de productos</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, referencia o categoría..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="p-4 max-h-[520px] overflow-y-auto">
          {loadingCatalog ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando catálogo...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <Package size={28} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm text-slate-400">
                {search ? "No se encontraron productos" : "El catálogo está vacío"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {categories.map((cat) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{cat}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.filter((p) => (p.category ?? "Sin categoría") === cat).map((p) => {
                      const inCart = cart.some((c) => c.productId === p.id)
                      return (
                        <div key={p.id} className={`border rounded-xl overflow-hidden transition ${inCart ? "border-teal-300 bg-teal-50/30" : "border-slate-200 hover:border-teal-200"}`}>
                          <div className="h-32 bg-slate-50 flex items-center justify-center overflow-hidden">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                              : <Package size={24} className="text-slate-200" />
                            }
                          </div>
                          <div className="p-2.5 space-y-1">
                            <p className="text-xs text-slate-400 font-mono leading-none">{p.reference}</p>
                            <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{p.name}</p>
                            <p className="text-sm font-bold text-teal-600">{formatCurrency(p.unitPrice)}</p>
                            {p.minQuantity > 1 && (
                              <p className="text-xs text-slate-400">Mín. {p.minQuantity} uds</p>
                            )}
                            <button
                              type="button"
                              onClick={() => addToCart(p)}
                              className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition mt-1 ${
                                inCart
                                  ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                                  : "bg-teal-600 text-white hover:bg-teal-700"
                              }`}
                            >
                              <Plus size={11} />
                              {inCart ? "Añadir otra vez" : "Añadir al pedido"}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <ShoppingCart size={15} className="text-teal-600" />
          <h2 className="font-semibold text-slate-800 text-sm">Tu pedido</h2>
          {cart.length > 0 && (
            <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {cart.length} {cart.length === 1 ? "línea" : "líneas"}
            </span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            Selecciona productos del catálogo para añadirlos aquí
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {cart.map((item, i) => (
              <div key={i} className="px-5 py-3 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-medium text-slate-800">{item.product}</p>
                  <p className="text-xs text-teal-600 font-semibold">{formatCurrency(item.unitPrice)} / ud</p>
                </div>

                {item.colors.length > 0 && (
                  <div className="min-w-[120px]">
                    <label className="text-xs text-slate-400 block mb-1">Color</label>
                    <select value={item.color} onChange={(e) => updateCart(i, "color", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                      {item.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {item.sizes.length > 0 && (
                  <div className="min-w-[100px]">
                    <label className="text-xs text-slate-400 block mb-1">Talla</label>
                    <select value={item.size} onChange={(e) => updateCart(i, "size", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                      {item.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                <div className="min-w-[80px]">
                  <label className="text-xs text-slate-400 block mb-1">Cantidad</label>
                  <input type="number" min={1} value={item.quantity}
                    onChange={(e) => updateCart(i, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-center" />
                </div>

                <div className="min-w-[70px] text-right">
                  <label className="text-xs text-slate-400 block mb-1">Total</label>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(item.unitPrice * item.quantity)}</p>
                </div>

                <button type="button" onClick={() => removeFromCart(i)}
                  className="text-slate-300 hover:text-red-500 transition mt-5">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div className="px-5 py-3 bg-slate-50 flex justify-between items-center">
              <span className="text-xs text-slate-400">* Precios orientativos. Identikglobal confirmará el presupuesto final.</span>
              <span className="text-sm font-bold text-slate-900">Total estimado: {formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Design files */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 text-sm mb-1">Archivos de diseño</h2>
        <p className="text-xs text-slate-400 mb-4">Sube los archivos de tu diseño (PNG, PDF, AI, SVG…). Máx. 20 MB por archivo.</p>

        <div onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition group">
          <Upload size={18} className="mx-auto mb-2 text-slate-300 group-hover:text-teal-500 transition" />
          <p className="text-sm text-slate-500 group-hover:text-teal-600">Haz clic o arrastra los archivos aquí</p>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.ai,.eps,.svg,.psd" className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {uploadingFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadingFiles.map((name) => (
              <div key={name} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Loader2 size={13} className="text-teal-500 animate-spin shrink-0" />
                <span className="text-xs text-slate-500 truncate">{name}</span>
              </div>
            ))}
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadedFiles.map((f) => {
              const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
              const isImg = ["jpg","jpeg","png","gif","webp","svg"].includes(ext)
              return (
                <div key={f.url} className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                  {isImg ? <ImageIcon size={13} className="text-teal-500 shrink-0" /> : <FileText size={13} className="text-slate-400 shrink-0" />}
                  <span className="text-xs text-slate-700 truncate flex-1">{f.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatSize(f.size)}</span>
                  <button type="button" onClick={() => setUploadedFiles((p) => p.filter((x) => x.url !== f.url))}
                    className="text-slate-300 hover:text-red-500 shrink-0"><X size={12} /></button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Design placement */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 text-sm mb-1">Ubicación y medidas del diseño</h2>
        <p className="text-xs text-slate-400 mb-3">¿Dónde quieres el diseño? ¿Qué tamaño y posición?</p>
        <textarea value={designPlacement} onChange={(e) => setDesignPlacement(e.target.value)}
          rows={3} placeholder="Ej: Logo en pecho izquierdo, 8×8 cm. Texto en espalda centrado, 20 cm desde el cuello..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
      </div>

      {/* Notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 text-sm mb-3">Notas adicionales</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3} placeholder="Fecha límite, instrucciones de entrega, colores específicos..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={submitting || uploadingFiles.length > 0 || cart.length === 0}
        className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50">
        {submitting ? "Enviando pedido..." : `Enviar pedido${cart.length > 0 ? ` · ${formatCurrency(total)}` : ""}`}
      </button>
    </form>
  )
}
