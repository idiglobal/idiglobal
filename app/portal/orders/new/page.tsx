import { NewOrderForm } from "@/components/client/NewOrderForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewOrderPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/portal" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Nuevo pedido</h1>
          <p className="text-sm text-slate-500">Indica los productos y detalles del pedido</p>
        </div>
      </div>
      <NewOrderForm />
    </div>
  )
}
