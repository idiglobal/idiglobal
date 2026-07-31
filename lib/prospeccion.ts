// Constantes del módulo de prospección B2B.
// El worker Python (idiglobal-worker) tiene un espejo de SEGMENTS en segments.py.

export const LEAD_STATUSES = [
  "nuevo",
  "enriquecido",
  "enriquecimiento_fallido",
  "borrador_generado",
  "contactado",
  "envio_fallido",
  "respondido",
  "reunion_agendada",
  "descartado",
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  enriquecido: "Enriquecido",
  enriquecimiento_fallido: "Sin contacto",
  borrador_generado: "Borrador listo",
  contactado: "Contactado",
  envio_fallido: "Envío fallido",
  respondido: "Respondió",
  reunion_agendada: "Reunión",
  descartado: "Descartado",
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  nuevo: "bg-slate-100 text-slate-600",
  enriquecido: "bg-blue-50 text-blue-700",
  enriquecimiento_fallido: "bg-slate-100 text-slate-400",
  borrador_generado: "bg-purple-50 text-purple-700",
  contactado: "bg-amber-50 text-amber-700",
  envio_fallido: "bg-red-50 text-red-600",
  respondido: "bg-teal-50 text-teal-700",
  reunion_agendada: "bg-green-50 text-green-700",
  descartado: "bg-slate-50 text-slate-400",
}

export const EMAIL_STATUS_COLORS: Record<string, string> = {
  no_verificado: "bg-slate-300",
  valido: "bg-teal-500",
  riesgoso: "bg-amber-400",
  invalido: "bg-red-500",
}

export const EMAIL_STATUS_LABELS: Record<string, string> = {
  no_verificado: "Email sin verificar",
  valido: "Email verificado",
  riesgoso: "Email dudoso (catch-all)",
  invalido: "Email inválido",
}

// Señales de intención: clave → [etiqueta, explicación, puntos]
export const SIGNAL_META: Record<string, { label: string; explain: string; points: number }> = {
  busqueda_activa: {
    label: "Búsqueda activa",
    explain: "Publicó en internet que busca proveedor de personalización textil",
    points: 5,
  },
  ropa_escolar: {
    label: "Gestiona ropa del colegio",
    explain:
      "Su web o su AMPA ya vende sudaderas, chándal, batas o uniforme: compra prendas cada curso",
    points: 5,
  },
  solicita_proveedores: {
    label: "Pide proveedores",
    explain: "Su propia web pide proveedores o colaboradores",
    points: 4,
  },
  apertura_reciente: {
    label: "Recién abierto",
    explain: "Negocio recién inaugurado: está montando su equipamiento ahora",
    points: 3,
  },
  proximo_evento: {
    label: "Evento próximo",
    explain: "Anuncia un próximo evento, torneo o gala en su web: necesitará merchandising",
    points: 3,
  },
  oferta_empleo: {
    label: "Contratando",
    explain: "Tiene ofertas de empleo publicadas: crecen y necesitarán uniformes",
    points: 2,
  },
  tienda_online: {
    label: "Tienda online",
    explain: "Tiene tienda online activa: compra material con regularidad",
    points: 2,
  },
  pagina_mayorista: {
    label: "Sección B2B",
    explain: "Su web tiene sección mayorista/profesional: compra B2B habitual",
    points: 2,
  },
}

// Segmentos comerciales de IdentikGlobal con keywords de Google Maps sugeridas
export const SEGMENTS: Record<string, { label: string; keywords: string[] }> = {
  eventos: {
    label: "Eventos",
    keywords: [
      "empresa organización de eventos",
      "eventos deportivos",
      "organización eventos de ocio",
      "eventos socioculturales",
      "promotora ocio nocturno",
      "organización de bodas",
      "despedidas de soltero",
    ],
  },
  deporte_educacion: {
    label: "Deporte y educación",
    keywords: [
      "club deportivo",
      "gimnasio",
      "escuela de baile",
      "artes marciales",
      "colegio",
      "academia",
      "casal de verano",
      "talleres infantiles",
    ],
  },
  uniformes: {
    label: "Empresas con uniforme",
    keywords: [
      "empresa construcción y reformas",
      "empresa de limpieza",
      "seguridad privada",
      "empresa logística",
      "concesionario",
      "heladería",
      "restaurante",
      "peluquería",
      "spa",
      "centro de estética",
      "discoteca",
    ],
  },
  institucional: {
    label: "Institucional",
    keywords: ["ayuntamiento", "ONG", "asociación cultural"],
  },
  otros: {
    label: "Otros",
    keywords: ["startup", "comercio local"],
  },
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  scrape: "Buscar leads",
  scrape_intent: "Rastreo de intención",
  enrich: "Enriquecer contactos",
  filter: "Filtrar relevancia",
  verify: "Verificar emails",
  generate: "Generar borradores",
  send: "Enviar emails",
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "En cola",
  running: "Ejecutando",
  done: "Completado",
  error: "Error",
}

export function leadOrigin(searchKeyword: string | null, city: string | null): string {
  const kw = searchKeyword ?? ""
  if (kw.startsWith("intent:")) {
    return `Rastreo de intención activa — consulta: ${kw.slice(7).trim()}`
  }
  if (kw) return `Google Maps — búsqueda «${kw}» en ${city ?? "?"}`
  return "Origen manual"
}

export function leadSignals(intentSignals: string | null) {
  return (intentSignals ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s in SIGNAL_META)
    .map((s) => ({ key: s, ...SIGNAL_META[s] }))
}

export const MAX_EMAILS_PER_DAY = 50
export const MAX_SCRAPE_LIMIT = 25

/**
 * Campaña temporal: colegios/AMPAs y equipos deportivos, en pausa mientras
 * los colegios están cerrados. El worker asigna esta etiqueta al crear el
 * lead según la keyword de búsqueda (ver idiglobal-worker/campanas.py) y
 * excluye estos leads del envío general por defecto.
 */
export const CAMPANA_SEPTIEMBRE = "septiembre"
export const CAMPANA_SEPTIEMBRE_LABEL = "Campaña Septiembre"

/** Tope de leads por envío selectivo. Espejo del límite validado en la API. */
export const MAX_LEAD_IDS = 200

/**
 * Normaliza la lista de ids de un envío selectivo.
 *
 * Espejo en la app de `_normalizar_lead_ids` del worker, pero más estricto: el
 * worker solo se defiende de una fila corrupta en la BD, aquí es donde se
 * valida de verdad (ver CONTRATO_ENVIO_SELECTIVO.md).
 *
 * Devuelve error en vez de una lista vacía a propósito: el worker interpreta
 * "leadIds presente pero vacío" como "no enviar a nadie", así que encolar eso
 * sería crear un trabajo que no hace nada.
 */
export function normalizarLeadIds(
  entrada: unknown
): { ok: true; ids: number[] } | { ok: false; error: string } {
  if (!Array.isArray(entrada))
    return { ok: false, error: "leadIds debe ser un array de ids de lead" }

  const ids = [
    ...new Set(
      entrada
        .map((v) => (typeof v === "number" || typeof v === "string" ? Number(v) : NaN))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ]

  if (ids.length === 0)
    return { ok: false, error: "La selección no contiene ningún lead válido" }

  if (ids.length > MAX_LEAD_IDS)
    return {
      ok: false,
      error: `Demasiados leads seleccionados (${ids.length}); el máximo es ${MAX_LEAD_IDS}`,
    }

  return { ok: true, ids }
}

/**
 * Réplica de los descartes que hace el worker antes de enviar
 * (ver CONTRATO_ENVIO_SELECTIVO.md en idiglobal-worker).
 *
 * Es una estimación optimista a propósito: desde el navegador no se puede
 * consultar la lista de supresión, así que el worker todavía puede excluir
 * alguno más. Sirve para avisar al usuario, no para decidir el envío.
 */
export function esEnviable(lead: {
  status: string
  email: string | null
  emailBody: string | null
  emailStatus: string
}): boolean {
  return (
    lead.status === "borrador_generado" &&
    !!lead.email &&
    !!lead.emailBody &&
    lead.emailStatus !== "invalido"
  )
}
