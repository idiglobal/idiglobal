// Verificación de tokens de baja generados por el worker Python con
// itsdangerous.URLSafeSerializer(UNSUBSCRIBE_SECRET, salt=SALT).
// Formato del token: base64url(json_payload) + "." + base64url(hmac_sha1)
// Derivación de clave (itsdangerous por defecto, "django-concat"):
//   key = sha1(salt + "signer" + secret)
import { createHash, createHmac, timingSafeEqual } from "crypto"

// Debe coincidir con el salt del módulo mailer/unsubscribe.py del motor
const SALT = "cosmonatura-baja-v1"

function deriveKey(secret: string): Buffer {
  return createHash("sha1")
    .update(SALT + "signer" + secret)
    .digest()
}

export function parseUnsubscribeToken(token: string): number | null {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) return null

  const idx = token.lastIndexOf(".")
  if (idx <= 0) return null
  const payload = token.slice(0, idx)
  const signature = token.slice(idx + 1)

  // Los payloads comprimidos (zlib) empiezan por "."; para ids enteros nunca ocurre
  if (payload.startsWith(".")) return null

  let given: Buffer
  try {
    given = Buffer.from(signature, "base64url")
  } catch {
    return null
  }

  const expected = createHmac("sha1", deriveKey(secret)).update(payload).digest()
  if (given.length !== expected.length || !timingSafeEqual(expected, given)) {
    return null
  }

  try {
    const json = Buffer.from(payload, "base64url").toString("utf8")
    const value = JSON.parse(json)
    const id = typeof value === "number" ? value : parseInt(String(value), 10)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}
