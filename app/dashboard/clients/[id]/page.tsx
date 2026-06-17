import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ClientForm } from "@/components/admin/ClientForm"
import { ClientTableActions } from "@/components/admin/ClientTableActions"

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) notFound()

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={16} className="text-slate-500" />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Editar cliente</h1>
        <div className="ml-auto">
          <ClientTableActions id={client.id} name={client.companyName} />
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <ClientForm
          initial={{
            id: client.id,
            companyName: client.companyName,
            contactName: client.contactName,
            email: client.email,
            phone: client.phone ?? "",
            address: client.address ?? "",
            conditions: client.conditions ?? "",
          }}
        />
      </div>
    </div>
  )
}
