import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Identikglobal — Gestión de Pedidos",
  description: "Plataforma B2B de personalización textil",
  appleWebApp: {
    capable: true,
    title: "Identikglobal",
    statusBarStyle: "black-translucent",
  },
  applicationName: "Identikglobal",
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}
