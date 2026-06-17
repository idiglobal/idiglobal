import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/admin/ProductForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewProductPage() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/catalog" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Nuevo producto</h1>
          <p className="text-sm text-slate-500">Añade un artículo al catálogo</p>
        </div>
      </div>
      <ProductForm suppliers={suppliers} mode="new" />
    </div>
  )
}
