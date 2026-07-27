"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  EMAIL_STATUS_COLORS,
  EMAIL_STATUS_LABELS,
  SEGMENTS,
  JOB_TYPE_LABELS,
  JOB_STATUS_LABELS,
  MAX_SCRAPE_LIMIT,
  leadOrigin,
  leadSignals,
  type LeadStatus,
} from "@/lib/prospeccion"
import {
  Flame,
  ListChecks,
  Play,
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CalendarCheck,
  Trash2,
  RefreshCw,
  Loader2,
  Mail,
  Sparkles,
  Send,
  Eye,
  Clock,
} from "lucide-react"

type Lead = {
  id: number
  name: string
  category: string | null
  address: string | null
  city: string | null
  phone: string | null
  website: string | null
  segment: string
  intentScore: number
  intentSignals: string | null
  email: string | null
  contactName: string | null
  emailStatus: string
  emailSubject: string | null
  emailBody: string | null
  searchKeyword: string | null
  status: string
  createdAt: string
}

type Job = {
  id: number
  type: string
  params: Record<string, unknown>
  status: string
  log: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

type Quota = { sentToday: number; remaining: number; max: number }

export function ProspeccionPanel({
  initialLeads,
  initialJobs,
  quota,
}: {
  initialLeads: Lead[]
  initialJobs: Job[]
  quota: Quota
}) {
  const [tab, setTab] = useState<"pipeline" | "ultra" | "acciones">("pipeline")
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const [lr, jr] = await Promise.all([
        fetch("/api/prospeccion/leads"),
        fetch("/api/prospeccion/jobs"),
      ])
      if (lr.ok) setLeads(await lr.json())
      if (jr.ok) setJobs(await jr.json())
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Refresco automático mientras haya jobs activos
  const hasActiveJobs = jobs.some((j) => j.status === "pending" || j.status === "running")
  useEffect(() => {
    if (!hasActiveJobs) return
    const t = setInterval(refresh, 15000)
    return () => clearInterval(t)
  }, [hasActiveJobs, refresh])

  const ultra = useMemo(
    () =>
      leads
        .filter((l) => l.intentScore >= 4 && l.status !== "descartado")
        .sort((a, b) => b.intentScore - a.intentScore),
    [leads]
  )

  const tabs = [
    { id: "pipeline" as const, label: "Pipeline", icon: ListChecks },
    { id: "ultra" as const, label: `Ultracualificados (${ultra.length})`, icon: Flame },
    { id: "acciones" as const, label: "Acciones", icon: Play },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              tab === id
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
        <button
          onClick={refresh}
          className="ml-auto p-2 text-slate-400 hover:text-teal-600 transition shrink-0"
          title="Actualizar"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {tab === "pipeline" && <PipelineTab leads={leads} onChanged={refresh} />}
      {tab === "ultra" && <UltraTab leads={ultra} onChanged={refresh} />}
      {tab === "acciones" && (
        <AccionesTab jobs={jobs} quota={quota} onCreated={refresh} />
      )}
    </div>
  )
}

/* ─── Pipeline ─────────────────────────────────────────────────────────── */

function PipelineTab({ leads, onChanged }: { leads: Lead[]; onChanged: () => void }) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [city, setCity] = useState("")
  const [openLead, setOpenLead] = useState<number | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1
    return c
  }, [leads])

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (statusFilter && l.status !== statusFilter) return false
        if (city && !(l.city ?? "").toLowerCase().includes(city.toLowerCase())) return false
        if (q) {
          const needle = q.toLowerCase()
          const hay = `${l.name} ${l.email ?? ""} ${l.category ?? ""}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      }),
    [leads, statusFilter, q, city]
  )

  return (
    <div className="space-y-4">
      {/* Contadores por estado */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            statusFilter === null
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
          }`}
        >
          Todos ({leads.length})
        </button>
        {LEAD_STATUSES.filter((s) => counts[s]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              statusFilter === s
                ? "bg-teal-600 text-white border-teal-600"
                : `${LEAD_STATUS_COLORS[s as LeadStatus]} border-transparent hover:opacity-80`
            }`}
          >
            {LEAD_STATUS_LABELS[s as LeadStatus]} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar negocio, email o categoría…"
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="relative w-40">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad"
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 && (
          <p className="text-center py-10 text-sm text-slate-400">
            {leads.length === 0
              ? "Aún no hay leads. Lanza una búsqueda desde la pestaña Acciones."
              : "Ningún lead coincide con el filtro."}
          </p>
        )}
        <div className="divide-y divide-slate-50">
          {filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              open={openLead === lead.id}
              onToggle={() => setOpenLead(openLead === lead.id ? null : lead.id)}
              onChanged={onChanged}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadRow({
  lead,
  open,
  onToggle,
  onChanged,
}: {
  lead: Lead
  open: boolean
  onToggle: () => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const signals = leadSignals(lead.intentSignals)

  async function setStatus(status: string) {
    setBusy(true)
    await fetch(`/api/prospeccion/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setBusy(false)
    onChanged()
  }

  return (
    <div className={open ? "bg-slate-50" : ""}>
      <div
        className="flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
        onClick={onToggle}
      >
        {open ? (
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-slate-400 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-800 truncate">{lead.name}</p>
            {lead.intentScore > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full shrink-0">
                <Flame size={10} />
                {lead.intentScore}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">
            {[lead.category, lead.city, SEGMENTS[lead.segment]?.label].filter(Boolean).join(" · ")}
          </p>
        </div>

        {/* Email con indicador de verificación */}
        <div className="hidden sm:flex items-center gap-1.5 max-w-48 shrink-0" title={EMAIL_STATUS_LABELS[lead.emailStatus]}>
          {lead.email && (
            <>
              <span className={`w-2 h-2 rounded-full shrink-0 ${EMAIL_STATUS_COLORS[lead.emailStatus] ?? "bg-slate-300"}`} />
              <span className="text-xs text-slate-500 truncate">{lead.email}</span>
            </>
          )}
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
            LEAD_STATUS_COLORS[lead.status as LeadStatus] ?? "bg-slate-100 text-slate-500"
          }`}
        >
          {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
        </span>
      </div>

      {open && (
        <div className="px-4 sm:px-10 pb-4 space-y-3">
          <p className="text-xs text-slate-400">{leadOrigin(lead.searchKeyword, lead.city)}</p>

          {signals.length > 0 && (
            <div className="space-y-1">
              {signals.map((s) => (
                <p key={s.key} className="text-xs text-slate-600">
                  <span className="font-semibold text-orange-600">+{s.points}</span> {s.explain}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {lead.phone && <span>📞 {lead.phone}</span>}
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.website.replace(/^https?:\/\//, "").slice(0, 40)}
              </a>
            )}
            {lead.contactName && <span>👤 {lead.contactName}</span>}
            {lead.email && (
              <span className="sm:hidden inline-flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${EMAIL_STATUS_COLORS[lead.emailStatus] ?? "bg-slate-300"}`} />
                {lead.email}
              </span>
            )}
          </div>

          {lead.emailBody && (
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Mail size={12} className="text-teal-600" />
                <p className="text-xs font-semibold text-slate-700">{lead.emailSubject}</p>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {lead.emailBody}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatus("respondido")}
              disabled={busy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 transition disabled:opacity-50"
            >
              <CheckCircle2 size={12} />
              Respondió
            </button>
            <button
              onClick={() => setStatus("reunion_agendada")}
              disabled={busy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
            >
              <CalendarCheck size={12} />
              Reunión
            </button>
            {lead.status !== "descartado" ? (
              <button
                onClick={() => setStatus("descartado")}
                disabled={busy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
              >
                <Trash2 size={12} />
                Descartar
              </button>
            ) : (
              <button
                onClick={() => setStatus("enriquecido")}
                disabled={busy}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
              >
                Recuperar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Ultracualificados ────────────────────────────────────────────────── */

function UltraTab({ leads, onChanged }: { leads: Lead[]; onChanged: () => void }) {
  if (leads.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <Flame size={32} className="mx-auto mb-3 text-slate-200" />
        <p className="text-sm text-slate-400">
          Aún no hay leads ultracualificados. Aparecerán aquí los que acumulen señales
          fuertes de intención de compra (puntuación ≥ 4).
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {leads.map((lead) => {
        const signals = leadSignals(lead.intentSignals)
        return (
          <div key={lead.id} className="bg-white border border-orange-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{lead.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {[lead.category, lead.city].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg shrink-0">
                <Flame size={13} />
                {lead.intentScore}
              </span>
            </div>

            <p className="text-xs text-slate-400 italic">
              {leadOrigin(lead.searchKeyword, lead.city)}
            </p>

            <div className="space-y-1.5">
              {signals.map((s) => (
                <div key={s.key} className="flex items-start gap-2 text-xs">
                  <span className="font-bold text-orange-600 shrink-0">+{s.points}</span>
                  <span className="text-slate-600">{s.explain}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0">
                {lead.email && (
                  <>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${EMAIL_STATUS_COLORS[lead.emailStatus] ?? "bg-slate-300"}`} />
                    <span className="text-xs text-slate-500 truncate">{lead.email}</span>
                  </>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  LEAD_STATUS_COLORS[lead.status as LeadStatus] ?? "bg-slate-100 text-slate-500"
                }`}
              >
                {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Acciones ─────────────────────────────────────────────────────────── */

function AccionesTab({
  jobs,
  quota,
  onCreated,
}: {
  jobs: Job[]
  quota: Quota
  onCreated: () => void
}) {
  const [segment, setSegment] = useState("eventos")
  const [keyword, setKeyword] = useState(SEGMENTS.eventos.keywords[0])
  const [scrapeCity, setScrapeCity] = useState("Barcelona")
  const [limit, setLimit] = useState(15)
  const [sendLimit, setSendLimit] = useState(10)
  const [confirmSend, setConfirmSend] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [openLog, setOpenLog] = useState<number | null>(null)

  async function createJob(type: string, params: Record<string, unknown> = {}, busyKey?: string) {
    setBusy(busyKey ?? type)
    setMsg(null)
    const res = await fetch("/api/prospeccion/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, params }),
    })
    const data = await res.json()
    setBusy(null)
    if (res.ok) {
      setMsg({ ok: true, text: "Job añadido a la cola. El worker del PC lo ejecutará en breve." })
      onCreated()
    } else {
      setMsg({ ok: false, text: data.error ?? "Error creando el job" })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        {/* Buscar leads */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Search size={15} className="text-teal-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Buscar leads en Google Maps</h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Segmento</label>
              <select
                value={segment}
                onChange={(e) => {
                  setSegment(e.target.value)
                  setKeyword(SEGMENTS[e.target.value].keywords[0])
                }}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(SEGMENTS).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Qué buscar</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                list="kw-suggestions"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <datalist id="kw-suggestions">
                {SEGMENTS[segment].keywords.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ciudad</label>
              <input
                value={scrapeCity}
                onChange={(e) => setScrapeCity(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Máx. resultados ({MAX_SCRAPE_LIMIT})
              </label>
              <input
                type="number"
                min={1}
                max={MAX_SCRAPE_LIMIT}
                value={limit}
                onChange={(e) => setLimit(Math.min(MAX_SCRAPE_LIMIT, parseInt(e.target.value) || 1))}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            onClick={() => createJob("scrape", { keyword, city: scrapeCity, limit, segment })}
            disabled={busy !== null || !keyword.trim() || !scrapeCity.trim()}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {busy === "scrape" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar leads
          </button>
        </div>

        {/* Cualificar + previsualizar + enviar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-teal-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Cualificación y envío</h2>
          </div>

          <button
            onClick={() => createJob("qualify")}
            disabled={busy !== null}
            className="w-full flex items-center justify-center gap-2 border border-teal-600 text-teal-700 hover:bg-teal-50 text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {busy === "qualify" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Cualificar pendientes
          </button>
          <p className="text-xs text-slate-400 -mt-1">
            Enriquece contactos, filtra irrelevantes, verifica emails y genera borradores — todo en cadena.
          </p>

          <button
            onClick={() => createJob("send", { dryRun: true }, "send-preview")}
            disabled={busy !== null}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {busy === "send-preview" ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Previsualizar envío (no envía nada)
          </button>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Cuota de hoy</span>
              <span className="font-semibold text-slate-700">
                {quota.sentToday}/{quota.max} enviados · quedan {quota.remaining}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={quota.remaining}
                value={sendLimit}
                onChange={(e) => setSendLimit(parseInt(e.target.value) || 1)}
                className="w-24 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={() => setConfirmSend(true)}
                disabled={busy !== null || quota.remaining === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                <Send size={14} />
                Enviar lote
              </button>
            </div>
          </div>
        </div>

        {msg && (
          <div
            className={`text-sm px-4 py-3 rounded-lg border ${
              msg.ok
                ? "bg-teal-50 border-teal-200 text-teal-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>

      {/* Cola de jobs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden self-start">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800 text-sm">Cola de trabajos</h2>
        </div>
        {jobs.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Sin trabajos todavía</p>
        )}
        <div className="divide-y divide-slate-50">
          {jobs.map((job) => (
            <div key={job.id}>
              <div
                className="flex items-center gap-3 px-4 sm:px-5 py-2.5 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => setOpenLog(openLog === job.id ? null : job.id)}
              >
                <JobStatusIcon status={job.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    {JOB_TYPE_LABELS[job.type] ?? job.type}
                    {job.type === "send" && (job.params as { dryRun?: boolean })?.dryRun && (
                      <span className="text-slate-400"> (previsualización)</span>
                    )}
                    {job.type === "scrape" && (
                      <span className="text-slate-400 text-xs">
                        {" "}
                        — {String((job.params as { keyword?: string })?.keyword ?? "")} en{" "}
                        {String((job.params as { city?: string })?.city ?? "")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(job.createdAt).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {JOB_STATUS_LABELS[job.status] ?? job.status}
                  </p>
                </div>
                {job.log && (
                  openLog === job.id
                    ? <ChevronDown size={13} className="text-slate-300 shrink-0" />
                    : <ChevronRight size={13} className="text-slate-300 shrink-0" />
                )}
              </div>
              {openLog === job.id && job.log && (
                <pre className="mx-4 sm:mx-5 mb-3 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {job.log}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación de envío */}
      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Confirmar envío</h3>
            <p className="text-sm text-slate-500 mb-1">
              Se enviarán hasta <span className="font-semibold text-slate-700">{sendLimit}</span>{" "}
              emails reales a leads con borrador generado, con pausas anti-spam entre envíos.
            </p>
            <p className="text-xs text-slate-400 mb-5">
              Cuota restante hoy: {quota.remaining}/{quota.max}. Cada email incluye pie legal LSSI
              y enlace de baja.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmSend(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmSend(false)
                  createJob("send", { limit: sendLimit })
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
              >
                Sí, enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JobStatusIcon({ status }: { status: string }) {
  if (status === "running")
    return <Loader2 size={14} className="animate-spin text-teal-600 shrink-0" />
  if (status === "done") return <CheckCircle2 size={14} className="text-teal-500 shrink-0" />
  if (status === "error") return <Trash2 size={14} className="text-red-500 shrink-0" />
  return <Clock size={14} className="text-slate-300 shrink-0" />
}
