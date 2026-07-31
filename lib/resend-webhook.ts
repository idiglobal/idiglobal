import crypto from "node:crypto"

// Resend firma sus webhooks con Svix. La firma se calcula sobre el cuerpo CRUDO
// y sobre el id y el timestamp de la cabecera, así que hay que verificarla antes
// de parsear nada.
export const TOLERANCIA_SEGUNDOS = 60 * 5

/**
 * Comprueba la firma Svix de un webhook.
 *
 * `cuerpo` tiene que ser el texto exacto recibido: si se parsea y se vuelve a
 * serializar, el JSON cambia y la firma deja de cuadrar.
 */
export function firmaValida(
  secreto: string,
  cuerpo: string,
  headers: Headers,
  ahoraMs: number = Date.now(),
): boolean {
  const id = headers.get("svix-id")
  const timestamp = headers.get("svix-timestamp")
  const firmas = headers.get("svix-signature")
  if (!id || !timestamp || !firmas) return false

  // Ventana temporal: sin esto, una petición capturada valdría para siempre.
  const edad = Math.abs(ahoraMs / 1000 - Number(timestamp))
  if (!Number.isFinite(edad) || edad > TOLERANCIA_SEGUNDOS) return false

  // El secreto viene como "whsec_<base64>"; se firma con los bytes decodificados.
  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64")
  const esperada = crypto
    .createHmac("sha256", clave)
    .update(`${id}.${timestamp}.${cuerpo}`)
    .digest("base64")
  const esperadaBuf = Buffer.from(esperada)

  // La cabecera puede traer varias firmas separadas por espacio ("v1,xxx v1,yyy")
  // durante una rotación de secreto: basta con que una cuadre.
  return firmas.split(" ").some((entrada) => {
    const valor = entrada.split(",")[1]
    if (!valor) return false
    const buf = Buffer.from(valor)
    // timingSafeEqual lanza si las longitudes difieren, de ahí la comprobación.
    return buf.length === esperadaBuf.length && crypto.timingSafeEqual(buf, esperadaBuf)
  })
}

/** Estado que guardamos según el tipo de evento que manda Resend. */
export const ESTADO_POR_EVENTO: Record<string, string> = {
  "email.sent": "enviado",
  "email.delivered": "entregado",
  "email.delivery_delayed": "retrasado",
  "email.bounced": "rebotado",
  "email.complained": "spam",
  "email.opened": "abierto",
  "email.clicked": "clicado",
}

/** Eventos que obligan a no volver a escribir a esa dirección nunca más. */
export const MOTIVO_SUPRESION: Record<string, string> = {
  "email.bounced": "rebote",
  "email.complained": "queja",
}
