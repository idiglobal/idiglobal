import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientSidebar } from "@/components/client/ClientSidebar"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as { role?: string; clientId?: string | null } | undefined

  if (!session || user?.role !== "CLIENT") redirect("/login")

  const client = user?.clientId
    ? await prisma.client.findUnique({ where: { id: user.clientId } })
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <ClientSidebar companyName={client?.companyName ?? "Cliente"} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
