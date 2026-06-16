import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { PriceTierBadge } from "@/components/ui/Badge"

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{suppliers.length} proveedores</p>
        </div>
        <Link
          href="/dashboard/suppliers/new"
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={15} />
          Nuevo proveedor
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-800">{s.name}</h3>
              <PriceTierBadge tier={s.priceTier} />
            </div>
            <p className="text-xs text-slate-500 mb-2 line-clamp-2">{s.products}</p>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
              <span>Plazo: {s.leadTimeDays} días</span>
              <span>{s._count.orders} pedidos</span>
            </div>
            {s.contactEmail && (
              <p className="text-xs text-slate-500 truncate mb-4">{s.contactEmail}</p>
            )}
            <Link
              href={`/dashboard/suppliers/${s.id}`}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Editar →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
