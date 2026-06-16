import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Identikglobal — Gestión de Pedidos",
  description: "Plataforma B2B de personalización textil",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}
