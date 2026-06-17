import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PortalShell } from "@/components/client/PortalShell"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as { role?: string; clientId?: string | null } | undefined

  if (!session || user?.role !== "CLIENT") redirect("/login")

  const client = user?.clientId
    ? await prisma.client.findUnique({ where: { id: user.clientId } })
    : null

  return (
    <PortalShell companyName={client?.companyName ?? "Cliente"}>
      {children}
    </PortalShell>
  )
}
