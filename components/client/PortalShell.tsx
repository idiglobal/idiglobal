"use client"

import { useState } from "react"
import { ClientSidebar } from "./ClientSidebar"
import { Menu } from "lucide-react"

export function PortalShell({
  children,
  companyName,
}: {
  children: React.ReactNode
  companyName: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Backdrop móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:flex lg:shrink-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <ClientSidebar companyName={companyName} onClose={() => setOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header móvil */}
        <header className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700 lg:hidden shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-slate-300 hover:text-white p-1 rounded transition"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">IG</span>
            </div>
            <span className="text-white font-semibold text-sm truncate">{companyName}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
