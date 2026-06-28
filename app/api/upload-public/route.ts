import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400, headers: CORS })
  }

  if (file.size > 30 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo supera los 30 MB" }, { status: 400, headers: CORS })
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const pathname = `quotes/${timestamp}-${safeName}`

  const blob = await put(pathname, file, { access: "public" })

  return NextResponse.json({ url: blob.url, name: file.name, size: file.size }, { headers: CORS })
}
