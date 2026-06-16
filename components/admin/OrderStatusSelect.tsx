"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OrderStatus } from "@/app/generated/prisma/client"
import { STATUS_LABELS } from "@/lib/utils"
import { Check, Loader2 } from "lucide-react"

const STATUS_COLORS: Record<OrderStatus, string> = {
  QUOTE_SENT:    "bg-slate-100 text-slate-600 border-slate-200",
  CONFIRMED:     "bg-blue-50 text-blue-700 border-blue-200",
  IN_PRODUCTION: "bg-amber-50 text-amber-700 border-amber-200",
  SHIPPED:       "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED:     "bg-teal-50 text-teal-700 border-teal-200",
  CANCELLED:     "bg-red-50 text-red-600 border-red-200",
}

const ALL_STATUSES: OrderStatus[] = [
  "QUOTE_SENT",
  "CONFIRMED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleChange(next: OrderStatus) {
    if (next === status) return
    setSaving(true)
    setStatus(next)
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    router.refresh()
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        disabled={saving}
        className={`pl-2.5 pr-6 py-1 rounded-full text-xs font-medium border cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 transition disabled:opacity-60 ${STATUS_COLORS[status]}`}
        style={{ backgroundImage: "none" }}
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {/* chevron icon */}
      <svg
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-50"
        viewBox="0 0 12 12"
        fill="currentColor"
      >
        <path d="M6 8L2 4h8z" />
      </svg>
      {saving && <Loader2 size={12} className="animate-spin text-slate-400 shrink-0" />}
      {saved  && <Check size={12} className="text-teal-500 shrink-0" />}
    </div>
  )
}
