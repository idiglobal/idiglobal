import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils"
import { OrderStatus } from "@/app/generated/prisma/client"

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PriceTierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    ECONOMY: "bg-slate-100 text-slate-600",
    STANDARD: "bg-blue-100 text-blue-600",
    PREMIUM: "bg-amber-100 text-amber-600",
  }
  const labels: Record<string, string> = {
    ECONOMY: "Económico",
    STANDARD: "Estándar",
    PREMIUM: "Premium",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tier] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[tier] ?? tier}
    </span>
  )
}
