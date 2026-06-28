import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

export async function POST(req: NextRequest) {
  const { orderNumber, companyName, contactName, email, phone, items, technique, designDescription, fileUrls } = await req.json()

  if (!orderNumber || !companyName || !email) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400, headers: CORS })
  }

  const itemsHtml = (items as { product: string; quantity: number }[])
    .map((i) => `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${i.product}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${i.quantity} uds.</td>
    </tr>`)
    .join("")

  const filesHtml = fileUrls?.length
    ? `<div style="margin-top:20px;">
        <p style="font-weight:700;color:#0090b0;margin-bottom:8px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Archivos de diseño</p>
        ${(fileUrls as string[]).map((url, i) => `<a href="${url}" style="display:block;color:#00b4d8;margin-bottom:4px;font-size:14px;">📎 Archivo ${i + 1}</a>`).join("")}
      </div>`
    : ""

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#0a0a0a;padding:28px 32px;display:flex;align-items:center;gap:12px;">
      <div style="background:#00b4d8;color:#fff;font-weight:900;font-size:16px;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;line-height:36px;text-align:center;">IG</div>
      <div>
        <p style="color:#fff;font-weight:800;font-size:18px;margin:0;">Identikglobal</p>
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">Nueva solicitud de presupuesto</p>
      </div>
      <div style="margin-left:auto;background:rgba(0,180,216,0.15);border:1px solid rgba(0,180,216,0.3);color:#00b4d8;font-size:12px;font-weight:700;padding:4px 12px;border-radius:100px;">${orderNumber}</div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:13px;font-weight:700;color:#00b4d8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">Datos de contacto</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:28px;">
        <tr><td style="padding:5px 0;color:#6c757d;width:120px;">Empresa</td><td style="padding:5px 0;font-weight:600;color:#1a1a2e;">${companyName}</td></tr>
        <tr><td style="padding:5px 0;color:#6c757d;">Contacto</td><td style="padding:5px 0;color:#1a1a2e;">${contactName}</td></tr>
        <tr><td style="padding:5px 0;color:#6c757d;">Email</td><td style="padding:5px 0;"><a href="mailto:${email}" style="color:#00b4d8;">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:5px 0;color:#6c757d;">Teléfono</td><td style="padding:5px 0;color:#1a1a2e;">${phone}</td></tr>` : ""}
      </table>

      <p style="font-size:13px;font-weight:700;color:#00b4d8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Prendas solicitadas</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:28px;border:1px solid #e9ecef;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6c757d;text-transform:uppercase;letter-spacing:0.05em;">Prenda</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6c757d;text-transform:uppercase;letter-spacing:0.05em;">Cantidad</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      ${technique || designDescription ? `
      <p style="font-size:13px;font-weight:700;color:#00b4d8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Diseño</p>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;font-size:14px;color:#1a1a2e;margin-bottom:24px;">
        ${technique ? `<p style="margin:0 0 6px;"><strong>Técnica:</strong> ${technique}</p>` : ""}
        ${designDescription ? `<p style="margin:0;"><strong>Descripción:</strong> ${designDescription}</p>` : ""}
      </div>` : ""}

      ${filesHtml}

      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e9ecef;">
        <a href="https://idiglobal.vercel.app/dashboard/orders" style="display:inline-block;background:#00b4d8;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:100px;text-decoration:none;">Ver en Identikglobal →</a>
      </div>
    </div>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: "Identikglobal <onboarding@resend.dev>",
    to: ["ermaba@pm.me"],
    replyTo: email,
    subject: `Presupuesto ${orderNumber} — ${companyName}`,
    html,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
  }

  return NextResponse.json({ ok: true }, { headers: CORS })
}
