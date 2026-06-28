import { OrderStatus } from "@/app/generated/prisma/client"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function generateOrderNumber(year: number, sequence: number): string {
  return `IG-${year}-${String(sequence).padStart(3, "0")}`
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTE_SENT: "Presupuesto por hacer",
  BUDGET_SENT: "Presupuesto enviado",
  CONFIRMED: "Confirmado",
  IN_PRODUCTION: "En producción",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  QUOTE_SENT: "bg-slate-100 text-slate-700",
  BUDGET_SENT: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PRODUCTION: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-teal-100 text-teal-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export const STATUS_PIPELINE: OrderStatus[] = [
  "QUOTE_SENT",
  "BUDGET_SENT",
  "CONFIRMED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
]
