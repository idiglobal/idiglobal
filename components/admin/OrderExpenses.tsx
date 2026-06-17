"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react"

type Expense = {
  id: string
  concept: string
  amount: number
  notes: string | null
  createdAt: string
}

export function OrderExpenses({
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
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const profit = totalAmount - totalExpenses
  const margin = totalAmount > 0 ? (profit / totalAmount) * 100 : 0

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!concept.trim() || isNaN(parsedAmount) || parsedAmount < 0) return
    setAdding(true)
    const res = await fetch(`/api/orders/${orderId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept: concept.trim(), amount: parsedAmount, notes: notes.trim() || null }),
    })
    if (res.ok) {
      const newExpense = await res.json()
      setExpenses((prev) => [...prev, newExpense])
      setConcept("")
      setAmount("")
      setNotes("")
      setShowForm(false)
      router.refresh()
    }
    setAdding(false)
  }

  async function handleDelete(expenseId: string) {
    await fetch(`/api/orders/${orderId}/expenses/${expenseId}`, { method: "DELETE" })
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
    router.refresh()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-sm">Gastos del pedido</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          <Plus size={14} />
          Añadir gasto
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="px-5 py-4 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Concepto *</label>
              <input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                required
                placeholder="Ej: Coste proveedor, Transporte…"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Importe (€) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0,00"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas (opcional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales…"
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-3 py-1.5 text-xs text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition disabled:opacity-50"
            >
              {adding ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {/* Expenses list */}
      <div className="divide-y divide-slate-50">
        {expenses.length === 0 && (
          <p className="px-5 py-4 text-sm text-slate-400">Sin gastos registrados</p>
        )}
        {expenses.map((exp) => (
          <div key={exp.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{exp.concept}</p>
              {exp.notes && <p className="text-xs text-slate-400 truncate">{exp.notes}</p>}
            </div>
            <span className="text-sm font-semibold text-red-600 shrink-0">
              -{formatCurrency(exp.amount)}
            </span>
            <button
              onClick={() => handleDelete(exp.id)}
              className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition shrink-0"
              title="Eliminar gasto"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Ingresos del pedido</span>
          <span className="font-medium text-slate-700">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-500">
          <span>Total gastos</span>
          <span className="font-medium text-red-600">-{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            {profit > 0 ? (
              <TrendingUp size={15} className="text-teal-600" />
            ) : profit < 0 ? (
              <TrendingDown size={15} className="text-red-500" />
            ) : (
              <Minus size={15} className="text-slate-400" />
            )}
            <span className="text-sm font-semibold text-slate-800">Beneficio neto</span>
          </div>
          <div className="text-right">
            <span
              className={`text-base font-bold ${
                profit > 0 ? "text-teal-600" : profit < 0 ? "text-red-600" : "text-slate-500"
              }`}
            >
              {formatCurrency(profit)}
            </span>
            <span
              className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                profit > 0
                  ? "bg-teal-50 text-teal-700"
                  : profit < 0
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
