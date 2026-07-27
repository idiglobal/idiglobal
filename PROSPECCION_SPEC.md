# Spec: Módulo de Prospección B2B integrado en IdentikGlobal

> Para implementar en una sesión de Claude Code en esta carpeta (`idiglobal/`).
> Autor del spec: sesión de Cosmonatura (2026-07-07). El motor de referencia ya
> funciona en producción en `C:\Users\pc\Desktop\Leinn\cosmetics-outreach\` —
> REUTILIZAR ese código, no reescribirlo desde cero.

## Objetivo

Que Eric pueda ejecutar TODA la prospección (scrapear leads, cualificarlos,
generar emails y enviarlos) **desde la propia app de IdentikGlobal ya desplegada**
(Next.js 16 + Prisma 7 + Neon + NextAuth v5, en producción en Vercel), con la
estética de la app, sin herramientas aparte. La app da las órdenes; un worker en
el PC de Eric ejecuta lo que necesita navegador.

## Arquitectura (patrón cola de trabajos)

```
App IdentikGlobal (Vercel)                    PC de Eric
┌──────────────────────────┐                 ┌──────────────────────────┐
│ /dashboard/prospeccion   │   Neon Postgres │ Worker Python            │
│  - botones "Scrapear",   │  ┌───────────┐  │  (bucle: lee jobs        │
│    "Cualificar","Enviar" │─▶│ jobs      │◀─│   pendientes, ejecuta,   │
│  - tabla leads + ultra   │  │ leads     │  │   actualiza estado)      │
│  - stats                 │  │ send_logs │  │  Reutiliza el motor de   │
│  (lee/escribe via Prisma)│  │ suppress  │  │  cosmetics-outreach      │
└──────────────────────────┘  └───────────┘  └──────────────────────────┘
```

- **Enviar emails (Resend API) SÍ puede ejecutarse desde Vercel** (es HTTP puro):
  el botón "Enviar lote" puede funcionar serverless sin worker. PERO los delays
  anti-spam de 30-120s entre emails superan el timeout de las funciones de
  Vercel → implementarlo como job del worker igualmente (más simple y uniforme).
- **Scraping (Playwright), enriquecimiento y verificación SMTP** requieren el
  worker del PC (navegador real + puerto 25 + IP residencial).
- Si el PC está apagado, los jobs quedan `pending` y el worker los ejecuta al
  arrancar. La app muestra el estado del job ("en cola", "ejecutando", "hecho").

## 1. Modelos Prisma nuevos (misma BD Neon de la app)

Añadir a `prisma/schema.prisma` (nombres de tabla/columna EXACTOS para que el
worker Python los comparta; usar `@@map`/`@map` snake_case):

```prisma
model ProspectLead {   // @@map("prospect_leads")
  id, name, category?, address?, city?, phone?, website?, rating?,
  reviewsCount?, searchKeyword?, segment (string, ver segmentos abajo),
  email?, contactName?, emailStatus ("no_verificado"|"valido"|"riesgoso"|"invalido"),
  emailCheckedAt?, emailSubject?, emailBody?,
  intentScore Int @default(0), intentSignals String?,
  status ("nuevo"|"enriquecido"|"enriquecimiento_fallido"|"borrador_generado"|
          "contactado"|"envio_fallido"|"respondido"|"reunion_agendada"|"descartado"),
  lastSentAt?, createdAt, updatedAt
  @@unique([name, address])
}
model ProspectJob {    // @@map("prospect_jobs")  ← la cola
  id, type ("scrape"|"scrape_intent"|"enrich"|"filter"|"verify"|"generate"|"send"),
  params Json?,        // {keyword, city, limit, segment} | {limit} | {dryRun}
  status ("pending"|"running"|"done"|"error") @default("pending"),
  log String?,         // salida resumida para mostrar en la app
  createdAt, startedAt?, finishedAt?
}
model ProspectSendLog { /* igual que send_logs de cosmetics-outreach */ }
model ProspectSuppression { /* email unique, reason, note, createdAt */ }
```

## 2. UI en la app (estética IdentikGlobal, NO la verde de Cosmonatura)

Nueva sección `/dashboard/prospeccion` (proteger con el rol admin existente):

- **Pestaña Pipeline**: contadores por estado (clicables como filtro), tabla de
  leads con búsqueda/filtro ciudad, indicador de verificación de email (punto de
  color), email generado desplegable, botones por fila: Respondió / Reunión /
  Descartar. Diseño: mismos componentes/tokens que el resto del dashboard.
- **Pestaña 🔥 Ultracualificados**: tarjetas con procedencia legible y desglose
  de señales explicadas con puntos (copiar la lógica SIGNAL_META y _lead_origin
  de `cosmetics-outreach/dashboard/app.py`).
- **Pestaña Acciones**: botones que crean jobs:
  - "Buscar leads" (formulario keyword+ciudad+segmento+límite ≤25)
  - "Cualificar pendientes" (enrich+filter+verify+generate encadenados)
  - "Previsualizar envío" (dry-run: muestra emails con pie legal)
  - "Enviar lote" (con límite, pide confirmación, muestra cuota diaria restante)
  - Estado de la cola: jobs pendientes/en ejecución/últimos logs.
- **Móvil**: la app ya es PWA responsive; mantener eso.

## 3. Worker en el PC (reutilizar el motor de Cosmonatura)

Nuevo directorio `worker/` DENTRO de cosmetics-outreach o carpeta hermana
`idiglobal-worker/` (decidir en la implementación; recomendado: carpeta propia
que importe cosmetics-outreach como librería vía sys.path):

- Bucle: cada 30s consulta `prospect_jobs` con status=pending (SQLAlchemy sobre
  la MISMA DATABASE_URL de idiglobal), marca running, ejecuta, guarda log, done/error.
- Reutiliza de `cosmetics-outreach`: `scraper/google_maps.py`,
  `scraper/intent_search.py`, `enricher/website_crawler.py`, `mailer/verifier.py`,
  `mailer/sender.py`, `scripts/filter_relevance.py`, `messaging/generator.py` —
  parametrizando: los módulos leen config de empresa desde variables; crear un
  `config_identik.py` o variable de entorno COMPANY_PROFILE que cargue el perfil
  de IdentikGlobal (ver abajo). Los modelos SQLAlchemy del worker deben mapear
  a las tablas prospect_* de Prisma.
- Registrar como tarea de Windows al estilo "Cosmonatura - Prospección diaria"
  (pythonw, sin ventana, al iniciar sesión + reintento si estaba apagado).

## 4. Perfil de empresa IdentikGlobal (para los emails generados)

- Empresa: IdentikGlobal — personalización textil B2B (serigrafía/bordado/DTF;
  confirmar con Eric el detalle de servicios y propuesta de valor).
- CTA: pedir presupuesto / llamada breve (confirmar con Eric; no hay "visita
  con muestras" necesariamente — preguntar).
- **PENDIENTE Eric**: datos legales de IdentikGlobal para el pie LSSI (razón
  social, CIF, domicilio) y el remitente de email (dominio + Resend propio;
  NO reutilizar el dominio de Cosmonatura).
- Emails en castellano. Guardarraíles idénticos a Cosmonatura (verificación,
  supresión, límite 50/día, pie legal + baja, OK explícito antes de enviar).
  El endpoint de baja vive en la propia app: `/api/prospeccion/baja/[token]`.

## 5. Segmentos y keywords de IdentikGlobal (lista de Eric, 2026-07-07)

Organizar como catálogo en BD o constante, con keywords de Maps por segmento:

- **Eventos**: empresas organización de eventos, eventos deportivos, eventos de
  ocio, eventos socioculturales, promotoras de ocio nocturno/fiestas, bodas y
  despedidas de soltero (agencias/organizadores).
- **Deporte/educación**: clubes deportivos, gimnasios, escuelas de baile,
  artes marciales, colegios y academias, casales de verano, talleres.
- **Empresas con uniforme**: construcción y reformas, servicios de limpieza,
  seguridad privada, logística, concesionarios, heladerías, hostelería,
  peluquerías, spas y centros de estética, discotecas.
- **Institucional**: ayuntamientos, administraciones públicas, ONG y asociaciones.
- **Otros**: startups (merchandising), comercio.

Señales de intención específicas de este sector (además de las genéricas):
"recién inaugurado" (+3), próximos eventos anunciados en su web (+3, patrón
"próximo evento/torneo/gala"), ofertas de empleo publicadas (+2, señal de
crecimiento = necesitan uniformes).

## 6. Orden de implementación sugerido

1. Modelos Prisma + migración (cuidado: BD de producción compartida con pedidos).
2. UI /dashboard/prospeccion con datos vacíos (leer/escribir leads y jobs).
3. Worker mínimo (scrape + enrich) apuntando a las tablas nuevas.
4. Cualificación completa (filter IA + verify + generate con perfil IdentikGlobal).
5. Envío (Resend de IdentikGlobal) + baja LSSI + supresión.
6. Tarea de Windows del worker + rotación diaria por segmentos.

## Referencias de código (leer antes de implementar)

- Motor completo: `C:\Users\pc\Desktop\Leinn\cosmetics-outreach\` (cada módulo
  tiene docstrings; el README explica el pipeline).
- Skill con guardarraíles y playbook de estrategia:
  `cosmetics-outreach\.claude\skills\prospeccion-cosmonatura\`.
- IMPORTANTE entorno: usar `py` (nunca `python`) en este PC; Next.js de esta app
  tiene cambios de API — leer `node_modules/next/dist/docs/` como dice AGENTS.md.
