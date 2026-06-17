import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import Link from "next/link"
import { ShoppingBag, Clock, Factory, TrendingUp, DollarSign, Users, Truck } from "lucide-react"
import { StatusBadge } from "@/components/ui/Badge"

export default async function DashboardPage() {
  const [orders, clients, suppliers] = await Promise.all([
    prisma.order.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.client.count(),
    prisma.supplier.count(),
  ])

  const allOrders = await prisma.order.findMany({ include: { expenses: true } })
  const activeOrders = allOrders.filter((o) => o.status !== "CANCELLED")
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalExpenses = activeOrders.reduce(
    (sum, o) => sum + o.expenses.reduce((s, e) => s + e.amount, 0),
    0
  )
  const totalProfit = totalRevenue - totalExpenses

  const byStatus = allOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  const stats = [
    {
      label: "Total pedidos",
      value: allOrders.length,
      icon: ShoppingBag,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Pendientes / Presupuesto",
      value: (byStatus["QUOTE_SENT"] ?? 0) + (byStatus["CONFIRMED"] ?? 0),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "En producción / Enviado",
      value: (byStatus["IN_PRODUCTION"] ?? 0) + (byStatus["SHIPPED"] ?? 0),
      icon: Factory,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Facturación total",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Beneficio neto",
      value: formatCurrency(totalProfit),
      icon: DollarSign,
      color: totalProfit >= 0 ? "text-green-600" : "text-red-600",
      bg: totalProfit >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Resumen</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vista general del negocio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
              </div>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Extra stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            "QUOTE_SENT",
            "CONFIRMED",
            "IN_PRODUCTION",
            "DELIVERED",
          ] as OrderStatus[]
        ).map((s) => (
          <div key={s} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium mb-2">
              {STATUS_LABELS[s]}
            </p>
            <p className="text-xl font-bold text-slate-900">{byStatus[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Últimos pedidos</h2>
            <Link
              href="/dashboard/orders"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500 truncate">{order.client.companyName}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={order.status as OrderStatus} />
                  <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick summary */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Clientes</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{clients}</p>
            <Link
              href="/dashboard/clients"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block"
            >
              Gestionar clientes →
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Proveedores</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{suppliers}</p>
            <Link
              href="/dashboard/suppliers"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block"
            >
              Gestionar proveedores →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
