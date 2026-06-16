import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/admin/ProductForm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, suppliers] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  if (!product) notFound()

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/catalog" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Editar producto</h1>
          <p className="text-sm text-slate-500 font-mono">{product.reference}</p>
        </div>
      </div>
      <ProductForm
        suppliers={suppliers}
        mode="edit"
        initial={{
          id: product.id,
          reference: product.reference,
          name: product.name,
          description: product.description ?? "",
          category: product.category ?? "",
          unitPrice: product.unitPrice,
          supplierId: product.supplierId ?? "",
          colors: product.colors ?? undefined,
          sizes: product.sizes ?? undefined,
          minQuantity: product.minQuantity,
          available: product.available,
          imageUrl: product.imageUrl ?? "",
        }}
      />
    </div>
  )
}
