import { SupplierForm } from "@/components/admin/SupplierForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewSupplierPage() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/suppliers" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Nuevo proveedor</h1>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <SupplierForm />
      </div>
    </div>
  )
}
