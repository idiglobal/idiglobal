import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/client/ProfileForm"

export default async function ProfilePage() {
  const session = await auth()
  const clientId = (session?.user as { clientId?: string | null })?.clientId
  if (!clientId) redirect("/portal")

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) redirect("/portal")

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">Datos de tu empresa</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <ProfileForm
          initial={{
            id: client.id,
            companyName: client.companyName,
            contactName: client.contactName,
            email: client.email,
            phone: client.phone ?? "",
            address: client.address ?? "",
          }}
        />
      </div>
    </div>
  )
}
