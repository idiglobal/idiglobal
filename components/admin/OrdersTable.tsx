"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate, STATUS_LABELS } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect"
import { OrderTableActions } from "@/components/admin/OrderTableActions"
import { ChevronDown, ChevronRight, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react"

type Expense = { id: string; concept: string; amount: number; notes: string | null }
type Order = {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: Date
  client: { companyName: string }
  supplier: { name: string } | null
  expenses: Expense[]
}

const STATUS_COLORS: Record<string, string> = {
  QUOTE_SENT:    "bg-slate-100 text-slate-600",
  CONFIRMED:     "bg-blue-50 text-blue-700",
  IN_PRODUCTION: "bg-amber-50 text-amber-700",
  SHIPPED:       "bg-purple-50 text-purple-700",
  DELIVERED:     "bg-teal-50 text-teal-700",
  CANCELLED:     "bg-red-50 text-red-600",
}

function ExpenseRow({
  orderId,
  totalAmount,
  initialExpenses,
}: {
  orderId: string
  totalAmount: number
  initialExpenses: Expense[]
}) {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [concept, setConcept] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const profit = totalAmount - totalExpenses
  const margin = totalAmount > 0 ? (profit / totalAmount) * 100 : 0

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!concept.trim() || isNaN(parsed)) return
    setSaving(true)
    const res = await fetch(`/api/orders/${orderId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept: concept.trim(), amount: parsed, notes: notes.trim() || null }),
    })
    if (res.ok) {
      const exp = await res.json()
      setExpenses((p) => [...p, exp])
      setConcept(""); setAmount(""); setNotes("")
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete(expenseId: string) {
    await fetch(`/api/orders/${orderId}/expenses/${expenseId}`, { method: "DELETE" })
    setExpenses((p) => p.filter((e) => e.id !== expenseId))
    router.refresh()
  }

  return (
    <tr className="bg-slate-50">
      <td colSpan={8} className="px-6 py-4">
        <div className="flex gap-6">
          {/* Left: expense list + form */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gastos</p>
            <div className="space-y-1 mb-3">
              {expenses.length === 0 && (
                <p className="text-xs text-slate-400 italic">Sin gastos registrados</p>
              )}
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-slate-700">{exp.concept}</span>
                  {exp.notes && <span className="text-xs text-slate-400 truncate max-w-[160px]">{exp.notes}</span>}
                  <span className="font-medium text-red-600 shrink-0">-{formatCurrency(exp.amount)}</span>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="text-slate-300 hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add form */}
            <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Concepto</label>
                <input
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej: Proveedor, transporte…"
                  required
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 w-44"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Importe (€)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 w-24"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Notas (opcional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles…"
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 w-36"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                <Plus size={11} />
                {saving ? "…" : "Añadir"}
              </button>
            </form>
          </div>

          {/* Right: profit summary */}
          <div className="shrink-0 w-52 bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 self-start">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Ingresos</span>
              <span className="font-medium text-slate-700">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Gastos</span>
              <span className="font-medium text-red-500">-{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-1">
                {profit > 0
                  ? <TrendingUp size={12} className="text-teal-500" />
                  : profit < 0
                  ? <TrendingDown size={12} className="text-red-500" />
                  : <Minus size={12} className="text-slate-400" />}
                <span className="text-xs font-semibold text-slate-700">Beneficio</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${profit > 0 ? "text-teal-600" : profit < 0 ? "text-red-600" : "text-slate-500"}`}>
                  {formatCurrency(profit)}
                </span>
                <span className={`text-xs px-1 py-0.5 rounded-full font-medium ${profit > 0 ? "bg-teal-50 text-teal-600" : profit < 0 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-8 px-3 py-3" />
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Pedido</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Proveedor</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Importe</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Beneficio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Fecha</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400 text-sm">
                  No se encontraron pedidos
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const isOpen = expanded.has(order.id)
              const totalExpenses = order.expenses.reduce((s, e) => s + e.amount, 0)
              const profit = order.totalAmount - totalExpenses
              const hasExpenses = order.expenses.length > 0

              return (
                <>
                  <tr
                    key={order.id}
                    className={`border-t border-slate-50 hover:bg-slate-50 transition ${isOpen ? "bg-slate-50" : ""}`}
                  >
                    {/* Expand toggle */}
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggle(order.id)}
                        className="text-slate-400 hover:text-slate-600 transition"
                        title="Ver / añadir gastos"
                      >
                        {isOpen
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{order.client.companyName}</td>
                    <td className="px-4 py-3">
                      <OrderStatusSelect
                        orderId={order.id}
                        currentStatus={order.status as OrderStatus}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{order.supplier?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    {/* Profit column */}
                    <td className="px-4 py-3 text-right">
                      {hasExpenses ? (
                        <span className={`text-sm font-semibold ${profit > 0 ? "text-teal-600" : "text-red-600"}`}>
                          {formatCurrency(profit)}
                        </span>
                      ) : (
                        <button
                          onClick={() => toggle(order.id)}
                          className="text-xs text-slate-400 hover:text-teal-600 transition"
                        >
                          + gastos
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-teal-600 hover:text-teal-700 text-xs font-medium"
                        >
                          Ver →
                        </Link>
                        <OrderTableActions orderId={order.id} orderNumber={order.orderNumber} />
                      </div>
                    </td>
                  </tr>

                  {isOpen && (
                    <ExpenseRow
                      key={`exp-${order.id}`}
                      orderId={order.id}
                      totalAmount={order.totalAmount}
                      initialExpenses={order.expenses}
                    />
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
