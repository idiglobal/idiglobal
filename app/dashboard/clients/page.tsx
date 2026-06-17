import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ClientTableActions } from "@/components/admin/ClientTableActions"

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { companyName: "asc" },
  })

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} clientes registrados</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={15} />
          Nuevo cliente
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Empresa</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Contacto</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Teléfono</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Pedidos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800">{client.companyName}</td>
                <td className="px-4 py-3 text-slate-600">{client.contactName}</td>
                <td className="px-4 py-3 text-slate-500">{client.email}</td>
                <td className="px-4 py-3 text-slate-500">{client.phone ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                    {client._count.orders}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ClientTableActions id={client.id} name={client.companyName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
