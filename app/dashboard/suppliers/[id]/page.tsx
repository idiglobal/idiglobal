import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SupplierForm } from "@/components/admin/SupplierForm"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) notFound()

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/suppliers" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Editar proveedor</h1>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <SupplierForm
          initial={{
            id: supplier.id,
            name: supplier.name,
            contactEmail: supplier.contactEmail ?? "",
            contactPhone: supplier.contactPhone ?? "",
            products: supplier.products,
            leadTimeDays: supplier.leadTimeDays,
            priceTier: supplier.priceTier,
            notes: supplier.notes ?? "",
          }}
        />
      </div>
    </div>
  )
}
