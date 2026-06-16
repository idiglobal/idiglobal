import { OrderStatus } from "@/app/generated/prisma/client"
import { STATUS_LABELS, STATUS_PIPELINE } from "@/lib/utils"

export function StatusPipeline({ currentStatus }: { currentStatus: OrderStatus }) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 py-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
        <span className="text-sm font-medium text-red-600">Pedido cancelado</span>
      </div>
    )
  }

  const currentIndex = STATUS_PIPELINE.indexOf(currentStatus)

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STATUS_PIPELINE.map((status, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex

        return (
          <div key={status} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all ${
                isDone
                  ? "bg-teal-600 border-teal-600 text-white"
                  : isCurrent
                  ? "bg-white border-teal-600 text-teal-600"
                  : "bg-white border-slate-200 text-slate-400"
              }`}>
                {isDone ? "✓" : index + 1}
              </div>
              <span className={`text-xs whitespace-nowrap font-medium ${
                isDone ? "text-teal-600" : isCurrent ? "text-slate-800" : "text-slate-400"
              }`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            {index < STATUS_PIPELINE.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 shrink-0 mb-5 ${
                index < currentIndex ? "bg-teal-600" : "bg-slate-200"
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
