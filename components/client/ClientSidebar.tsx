"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Plus, User, LogOut, X } from "lucide-react"

const links = [
  { href: "/portal", label: "Mis pedidos", icon: LayoutDashboard },
  { href: "/portal/orders/new", label: "Nuevo pedido", icon: Plus },
  { href: "/portal/profile", label: "Mi perfil", icon: User },
]

export function ClientSidebar({
  companyName,
  onClose,
}: {
  companyName: string
  onClose?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside className="w-64 lg:w-56 bg-slate-900 flex flex-col h-full">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">IG</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">Identikglobal</p>
            <p className="text-slate-400 text-xs truncate">{companyName}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded transition"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-teal-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all w-full"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
