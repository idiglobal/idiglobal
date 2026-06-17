import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Pencil, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    include: { supplier: { select: { name: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  const byCategory = products.reduce<Record<string, typeof products>>((acc, p) => {
    const cat = p.category ?? "Sin categoría"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Catálogo de productos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} productos en total</p>
        </div>
        <Link href="/dashboard/catalog/new"
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={15} />
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">Catálogo vacío</p>
          <p className="text-sm text-slate-400 mt-1">Añade el primer producto para que los clientes puedan hacer pedidos</p>
          <Link href="/dashboard/catalog/new"
            className="inline-flex items-center gap-2 mt-4 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition">
            <Plus size={14} />
            Añadir producto
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((p) => {
                  const colors = p.colors ? JSON.parse(p.colors) as string[] : []
                  const sizes = p.sizes ? JSON.parse(p.sizes) as string[] : []
                  return (
                    <div key={p.id} className={`bg-white border rounded-xl overflow-hidden group ${!p.available ? "opacity-60" : "border-slate-200"}`}>
                      {/* Image */}
                      <div className="h-40 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                          : <Package size={32} className="text-slate-200" />
                        }
                      </div>

                      {/* Info */}
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 font-mono">{p.reference}</p>
                            <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{p.name}</p>
                          </div>
                          {!p.available && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">Inactivo</span>
                          )}
                        </div>

                        {p.supplier && (
                          <p className="text-xs text-slate-400">{p.supplier.name}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-teal-600">{formatCurrency(p.unitPrice)}</span>
                          {p.minQuantity > 1 && (
                            <span className="text-xs text-slate-400">Mín. {p.minQuantity} uds</span>
                          )}
                        </div>

                        {colors.length > 0 && (
                          <p className="text-xs text-slate-400 truncate">{colors.join(" · ")}</p>
                        )}

                        {sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sizes.slice(0, 6).map((s) => (
                              <span key={s} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                            {sizes.length > 6 && <span className="text-xs text-slate-400">+{sizes.length - 6}</span>}
                          </div>
                        )}
                      </div>

                      {/* Edit button */}
                      <div className="px-3 pb-3">
                        <Link href={`/dashboard/catalog/${p.id}`}
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-600 transition">
                          <Pencil size={11} />
                          Editar
                        </Link>
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
  )
}
