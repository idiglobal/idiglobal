import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
  }

  // Limitar tamaño: 20 MB
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo supera los 20 MB" }, { status: 400 })
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const pathname = `designs/${timestamp}-${safeName}`

  const blob = await put(pathname, file, { access: "public" })

  return NextResponse.json({
    url: blob.url,
    name: file.name,
    size: file.size,
  })
}
