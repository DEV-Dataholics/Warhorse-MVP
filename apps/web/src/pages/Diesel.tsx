import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { SortTh, TablaFooter, TablaToolbar } from '../components/TablaControls'
import { ApiError, getDiesel, registrarCarga, type CargaDieselApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { card, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, theadRow } from '../lib/estilos'
import { useTabla } from '../lib/useTabla'
import ConciliacionDiesel from './ConciliacionDiesel'

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

function RendimientoChart({ cargas, unidad }: { cargas: CargaDieselApi[], unidad: string }) {
  const points = useMemo(() => {
    return [...cargas]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((c) => ({
        fecha: c.fecha,
        kml: c.litros > 0 ? c.km_recorridos / c.litros : 0,
      }))
      .filter((p) => p.kml > 0)
  }, [cargas])

  if (points.length < 2) {
    return (
      <div style={{ ...card, padding: 22, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 12, fontSize: 14, animation: 'fadeUp 0.4s ease' }}>
        ℹ️ Se necesitan al menos 2 registros de carga para trazar la tendencia de rendimiento km/L de la unidad {unidad}.
      </div>
    )
  }

  const kmls = points.map((p) => p.kml)
  const minKml = Math.max(0, Math.min(...kmls) - 0.5)
  const maxKml = Math.max(...kmls) + 0.5
  const range = maxKml - minKml || 1

  const width = 640
  const height = 180
  const paddingX = 45
  const paddingY = 20

  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  const getX = (index: number) => paddingX + (index / (points.length - 1)) * chartWidth
  const getY = (val: number) => paddingY + chartHeight - ((val - minKml) / range) * chartHeight

  let dLine = ''
  let dArea = ''
  points.forEach((p, idx) => {
    const x = getX(idx)
    const y = getY(p.kml)
    if (idx === 0) {
      dLine = `M ${x} ${y}`
      dArea = `M ${x} ${height - paddingY} L ${x} ${y}`
    } else {
      dLine += ` L ${x} ${y}`
      dArea += ` L ${x} ${y}`
    }
    if (idx === points.length - 1) {
      dArea += ` L ${x} ${height - paddingY} Z`
    }
  })

  return (
    <div style={{ ...card, padding: '18px 22px', animation: 'fadeUp 0.4s ease' }}>
      <h3 style={{ ...h3Titulo, fontSize: 16, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Tendencia de Rendimiento: {unidad} (km/L)
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ minWidth: 580 }}>
          <defs>
            <linearGradient id="naranjaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * ratio
            const val = maxKml - ratio * range
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#E7E0D2" strokeDasharray="4 4" />
                <text x={paddingX - 12} y={y + 4} textAnchor="end" fontSize="10.5" fill="#8A8374" fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {val.toFixed(1)}
                </text>
              </g>
            )
          })}

          <path d={dArea} fill="url(#naranjaGrad)" />
          <path d={dLine} fill="none" stroke="#C5A059" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots & Labels */}
          {points.map((p, idx) => {
            const x = getX(idx)
            const y = getY(p.kml)
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="5" fill="#16191E" stroke="#C5A059" strokeWidth="2.5" />
                <text x={x} y={y - 10} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#16191E">
                  {p.kml.toFixed(1)}
                </text>
                <text x={x} y={height - 4} textAnchor="middle" fontSize="10" fill="#8A8374" fontWeight="700">
                  {p.fecha.substring(5)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

const PRECIO_REFERENCIA_DIESEL = 24.50

interface SemanaInfo {
  semanaKey: string
  semanaNum: number
  anio: number
  etiqueta: string
  rango: string
}

function getSemanaInfo(fechaStr: string): SemanaInfo {
  if (!fechaStr) return { semanaKey: 'N/A', semanaNum: 0, anio: 2026, etiqueta: 'Sin fecha', rango: '—' }
  const d = new Date(fechaStr + 'T00:00:00')
  if (isNaN(d.getTime())) return { semanaKey: 'N/A', semanaNum: 0, anio: 2026, etiqueta: 'Fecha inválida', rango: '—' }

  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7 // Lunes = 0, Domingo = 6
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  const year = d.getFullYear()

  const monday = new Date(d)
  monday.setDate(d.getDate() - dayNr)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmtFecha = (date: Date) => {
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const dia = String(date.getDate()).padStart(2, '0')
    return `${dia}/${m}`
  }

  return {
    semanaKey: `${year}-W${String(weekNum).padStart(2, '0')}`,
    semanaNum: weekNum,
    anio: year,
    etiqueta: `Semana ${weekNum} (${fmtFecha(monday)} al ${fmtFecha(sunday)})`,
    rango: `${fmtFecha(monday)} al ${fmtFecha(sunday)}`,
  }
}

interface GrupoSemanal {
  clave: string
  id_unidad: string
  semanaKey: string
  semanaEtiqueta: string
  semanaRango: string
  totalLitros: number
  totalCosto: number
  totalKm: number
  cargasCount: number
  cargas: CargaDieselApi[]
  costoPromedioLitro: number
  kml: number | null
}

export default function Diesel() {
  const { unidades, toast } = useDemo()
  const [tabActiva, setTabActiva] = useState<'cargas' | 'conciliacion'>('cargas')
  const [cargas, setCargas] = useState<CargaDieselApi[]>([])
  const [unidadId, setUnidadId] = useState('')
  const [fecha, setFecha]       = useState('')
  const [litros, setLitros]     = useState('')
  const [costo, setCosto]       = useState('')
  const [costoManual, setCostoManual] = useState(false)
  const [km, setKm]             = useState('')
  const [error, setError]       = useState('')
  const [enviando, setEnviando] = useState(false)

  // Vista y filtros
  const [vistaModo, setVistaModo] = useState<'individual' | 'semanal'>('individual')
  const [filtroUnidad, setFiltroUnidad] = useState('Todas')
  const [filtroSemana, setFiltroSemana] = useState('Todas')
  const [busqueda, setBusqueda]         = useState('')
  const [filaExpandida, setFilaExpandida] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargas(await getDiesel())
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  const unidadesEnCargas = useMemo(() => {
    const seen = new Set<string>()
    cargas.forEach((c) => seen.add(c.id_unidad))
    return Array.from(seen).sort()
  }, [cargas])

  const semanasDisponibles = useMemo(() => {
    const setSem = new Map<string, string>()
    cargas.forEach((c) => {
      const info = getSemanaInfo(c.fecha)
      setSem.set(info.semanaKey, info.etiqueta)
    })
    return Array.from(setSem.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, etiqueta]) => ({ value: key, label: etiqueta }))
  }, [cargas])

  const handleLitrosChange = (val: string) => {
    setLitros(val)
    setError('')
    if (!costoManual) {
      const num = parseFloat(val)
      if (!isNaN(num) && num > 0) {
        setCosto((num * PRECIO_REFERENCIA_DIESEL).toFixed(2))
      } else {
        setCosto('')
      }
    }
  }

  const handleCostoChange = (val: string) => {
    setCosto(val)
    setCostoManual(true)
    setError('')
  }

  const recalcularCosto = () => {
    setCostoManual(false)
    const num = parseFloat(litros)
    if (!isNaN(num) && num > 0) {
      setCosto((num * PRECIO_REFERENCIA_DIESEL).toFixed(2))
    }
  }

  const cargasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return cargas.filter((c) => {
      if (filtroUnidad !== 'Todas' && c.id_unidad !== filtroUnidad) return false
      if (filtroSemana !== 'Todas' && getSemanaInfo(c.fecha).semanaKey !== filtroSemana) return false
      if (q && !c.id_unidad.toLowerCase().includes(q)) return false
      return true
    })
  }, [cargas, filtroUnidad, filtroSemana, busqueda])

  const gruposSemanales = useMemo(() => {
    const mapa = new Map<string, GrupoSemanal>()

    cargasFiltradas.forEach((c) => {
      const sem = getSemanaInfo(c.fecha)
      const clave = `${c.id_unidad}__${sem.semanaKey}`
      const existing = mapa.get(clave)
      if (!existing) {
        mapa.set(clave, {
          clave,
          id_unidad: c.id_unidad,
          semanaKey: sem.semanaKey,
          semanaEtiqueta: sem.etiqueta,
          semanaRango: sem.rango,
          totalLitros: c.litros,
          totalCosto: c.costo_total,
          totalKm: c.km_recorridos || 0,
          cargasCount: 1,
          cargas: [c],
          costoPromedioLitro: 0,
          kml: null,
        })
      } else {
        existing.totalLitros += c.litros
        existing.totalCosto += c.costo_total
        existing.totalKm += (c.km_recorridos || 0)
        existing.cargasCount += 1
        existing.cargas.push(c)
      }
    })

    const lista = Array.from(mapa.values()).map((g) => {
      g.totalLitros = Math.round(g.totalLitros * 100) / 100
      g.totalCosto = Math.round(g.totalCosto * 100) / 100
      g.costoPromedioLitro = g.totalLitros > 0 ? g.totalCosto / g.totalLitros : 0
      g.kml = g.totalLitros > 0 && g.totalKm > 0 ? g.totalKm / g.totalLitros : null
      return g
    })

    return lista.sort((a, b) => b.semanaKey.localeCompare(a.semanaKey) || a.id_unidad.localeCompare(b.id_unidad))
  }, [cargasFiltradas])

  const ctrl = useTabla(
    cargasFiltradas,
    'fecha',
    'desc',
    useCallback((row, col) => {
      if (col === 'kml') return row.litros > 0 ? row.km_recorridos / row.litros : 0
      return (row as unknown as Record<string, unknown>)[col] as string | number
    }, []),
  )

  const registrar = async () => {
    setError('')
    if (!unidadId) return setError('Selecciona la unidad que cargó diésel.')
    if (!fecha)    return setError('Captura la fecha de la carga.')
    if (litros === '') return setError('Captura los litros cargados.')
    if (costo === '')  return setError('Captura el costo total de la carga.')
    setEnviando(true)
    try {
      const carga = await registrarCarga({
        unidad_id: Number(unidadId),
        fecha,
        litros: Number(litros),
        costo_total: Number(costo),
        km_recorridos: km ? Number(km) : 0,
      })
      setUnidadId(''); setFecha(''); setLitros(''); setCosto(''); setKm('')
      setCostoManual(false)
      toast(`Carga registrada — el consolidado de ${carga.id_unidad} ya la refleja.`)
      await cargar()
    } catch (e) {
      if (e instanceof ApiError) {
        const campos = e.fields ? Object.values(e.fields).flat() : []
        setError(campos[0] ?? e.message)
      } else {
        setError('No se pudo registrar la carga. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #D8D2C4', paddingBottom: 0, marginTop: 12, marginBottom: 18 }}>
        <button
          onClick={() => setTabActiva('cargas')}
          style={{
            padding: '12px 18px', background: 'transparent', border: 'none',
            borderBottom: tabActiva === 'cargas' ? '3px solid #C5A059' : '3px solid transparent',
            color: tabActiva === 'cargas' ? '#C5A059' : '#6F6A60', fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FD
          }}
        >
          ⛽ Control de Cargas
        </button>
        <button
          onClick={() => setTabActiva('conciliacion')}
          style={{
            padding: '12px 18px', background: 'transparent', border: 'none',
            borderBottom: tabActiva === 'conciliacion' ? '3px solid #C5A059' : '3px solid transparent',
            color: tabActiva === 'conciliacion' ? '#C5A059' : '#6F6A60', fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FD
          }}
        >
          📡 Conciliación Samsara, MPG & Tanques
        </button>
      </div>

      {tabActiva === 'cargas' ? (
        <>
          <div style={{ animation: 'fadeUp 0.35s ease' }}>
            <Kicker texto="Combustible" />
            <h2 style={h2Titulo}>Control de Diésel</h2>
            <p style={subTitulo}>
              Cada carga suma al costo real de su unidad. El costo se calcula automáticamente a $24.50/L con opción a ajuste manual según ticket.
              El kilometraje es opcional en cargas individuales y se cruza semanalmente con Samsara.
            </p>
          </div>

          {/* ── Registrar carga ── */}
          <div data-tour="diesel" style={{ ...card, animation: 'fadeUp 0.4s ease', marginTop: 14 }}>
            <h3 style={{ ...h3Titulo, margin: '0 0 14px' }}>Registrar carga</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'end' }}>
              <label style={etiqueta}>
                Unidad
                <select style={campo} value={unidadId} onChange={(e) => { setUnidadId(e.target.value); setError('') }}>
                  <option value="">Selecciona unidad…</option>
                  {unidades
                    .filter((u) => u.estado === 'Activo')
                    .map((u) => (
                      <option key={u.id} value={String(u.id)}>{u.id_unidad + ' · ' + (u.tipo === 'Servicio' ? 'UTILITARIO' : u.tipo)}</option>
                    ))}
                </select>
              </label>
              <label style={etiqueta}>
                Fecha de la carga
                <input type="date" style={campo} value={fecha} onChange={(e) => { setFecha(e.target.value); setError('') }} />
              </label>
              <label style={etiqueta}>
                <span>Litros cargados</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  style={campo}
                  placeholder="Ej. 320.5"
                  value={litros}
                  onChange={(e) => handleLitrosChange(e.target.value)}
                />
              </label>
              <label style={etiqueta}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Costo total (MXN)</span>
                  {costoManual ? (
                    <button
                      type="button"
                      onClick={recalcularCosto}
                      title="Restablecer al cálculo automático"
                      style={{ background: 'none', border: 'none', color: '#C5A059', fontSize: 11.5, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      ↺ Auto ($24.50/L)
                    </button>
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#8A8374', fontWeight: 500 }}>Auto ($24.50/L)</span>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  style={campo}
                  placeholder="8975.00"
                  value={costo}
                  onChange={(e) => handleCostoChange(e.target.value)}
                />
              </label>
              <label style={etiqueta}>
                <span>
                  Kilómetros <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(Opcional)</span>
                </span>
                <input
                  type="number"
                  min={0}
                  style={campo}
                  placeholder="Opcional (Ej. 410)"
                  value={km}
                  onChange={(e) => { setKm(e.target.value); setError('') }}
                />
              </label>
              <button
                onClick={() => void registrar()}
                disabled={enviando}
                className="hv-naranja"
                style={{ padding: '12px 20px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 9, fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: enviando ? 0.7 : 1 }}
              >
                Registrar carga
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>💡 <strong>Cálculo reactivo:</strong> Al ingresar litros se multiplica por $24.50/L. Si el ticket físico difiere, puedes sobreescribirlo libremente.</span>
              <span>🛰️ <strong>Samsara:</strong> El odómetro y kilometraje real se auditan y cruzan semanalmente.</span>
            </div>

            {error && (
              <div role="alert" style={{ marginTop: 14, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {error}
              </div>
            )}
          </div>

          {/* ── Rendimiento Chart (Only when a specific unit is filtered) ── */}
          {filtroUnidad !== 'Todas' && (
            <RendimientoChart cargas={cargasFiltradas} unidad={filtroUnidad} />
          )}

          {/* ── Cargas recientes y Agrupación Semanal ── */}
          <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', animation: 'fadeUp 0.45s ease', marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ ...h3Titulo, margin: 0 }}>Historial de Combustible</h3>
              
              {/* Selector de modo de vista */}
              <div style={{ display: 'inline-flex', background: 'rgba(20,24,29,0.06)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setVistaModo('individual')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 13,
                    fontFamily: FD,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    background: vistaModo === 'individual' ? '#C5A059' : 'transparent',
                    color: vistaModo === 'individual' ? '#14181D' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📋 Detalle Individual ({cargasFiltradas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVistaModo('semanal')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 13,
                    fontFamily: FD,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    background: vistaModo === 'semanal' ? '#C5A059' : 'transparent',
                    color: vistaModo === 'semanal' ? '#14181D' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📅 Concentrado Semanal por Unidad ({gruposSemanales.length})
                </button>
              </div>
            </div>

            <TablaToolbar
              ctrl={ctrl}
              filtros={[{ value: 'Todas' }, ...unidadesEnCargas.map((u) => ({ value: u }))]}
              filtroActivo={filtroUnidad}
              onFiltro={(f) => setFiltroUnidad(f)}
              busqueda={busqueda}
              onBusqueda={setBusqueda}
              busquedaPlaceholder="Buscar unidad…"
              rightSlot={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {semanasDisponibles.length > 0 && (
                    <select
                      value={filtroSemana}
                      onChange={(e) => setFiltroSemana(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                      }}
                      title="Filtrar por semana calendario"
                    >
                      <option value="Todas">Todas las semanas</option>
                      {semanasDisponibles.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => {
                      import('../lib/csv').then(({ descargarCSV }) => {
                        if (vistaModo === 'semanal') {
                          const headers = ['Unidad', 'Semana', 'Rango Fechas', 'No. Cargas', 'Total Litros', 'Costo Total (MXN)', 'Precio Prom/L (MXN)', 'Km Recorridos', 'Rendimiento (km/L)']
                          const rows = gruposSemanales.map((g) => [
                            g.id_unidad,
                            g.semanaKey,
                            g.semanaRango,
                            String(g.cargasCount),
                            String(g.totalLitros),
                            String(g.totalCosto),
                            g.costoPromedioLitro.toFixed(2),
                            String(g.totalKm),
                            g.kml !== null ? g.kml.toFixed(2) : '—',
                          ])
                          const filename = `Concentrado_Semanal_Diesel_${new Date().toISOString().split('T')[0]}.csv`
                          descargarCSV(headers, rows, filename)
                          toast(`Reporte ${filename} descargado exitosamente.`)
                        } else {
                          const headers = ['Unidad', 'Fecha', 'Litros', 'Costo (MXN)', 'Odómetro', 'Rendimiento (km/L)', 'Semana']
                          const rows = cargasFiltradas.map((c) => {
                            const sem = getSemanaInfo(c.fecha)
                            return [
                              String(c.id_unidad),
                              String(c.fecha),
                              String(c.litros),
                              String(c.costo_total),
                              c.km_recorridos > 0 ? String(c.km_recorridos) : '— (Samsara)',
                              c.litros > 0 && c.km_recorridos > 0 ? String((c.km_recorridos / c.litros).toFixed(2)) : '—',
                              sem.semanaKey,
                            ]
                          })
                          const filename = `Reporte_Individual_Diesel_${new Date().toISOString().split('T')[0]}.csv`
                          descargarCSV(headers, rows, filename)
                          toast(`Reporte ${filename} descargado exitosamente.`)
                        }
                      })
                    }}
                    className="hv-borde-ink"
                    style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ⬇️ Exportar CSV
                  </button>
                </div>
              }
            />

            {vistaModo === 'individual' ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
                  <thead>
                    <tr style={theadRow}>
                      <SortTh col="id_unidad"    label="Unidad"         sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                      <SortTh col="fecha"        label="Fecha"          sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                      <SortTh col="litros"       label="Litros"         sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                      <SortTh col="costo_total"  label="Costo Total"    sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'right' }}>Precio/L</th>
                      <SortTh col="km_recorridos" label="Km Carga"      sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                      <SortTh col="kml"          label="km/L"           sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {ctrl.filasPagina.map((c) => {
                      const precioPorLitro = c.litros > 0 ? (c.costo_total / c.litros).toFixed(2) : '—'
                      return (
                        <tr key={c.id} className="hv-fila">
                          <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{c.id_unidad}</td>
                          <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>
                            {c.fecha}
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                              {getSemanaInfo(c.fecha).semanaKey}
                            </span>
                          </td>
                          <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.litros} L</td>
                          <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.costo_total)}</td>
                          <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>${precioPorLitro}</td>
                          <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {c.km_recorridos > 0 ? (
                              `${c.km_recorridos} km`
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— (Samsara)</span>
                            )}
                          </td>
                          <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {c.litros > 0 && c.km_recorridos > 0 ? (c.km_recorridos / c.litros).toFixed(2) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {ctrl.total === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
                    Sin cargas que coincidan con los filtros.
                  </div>
                )}

                <TablaFooter ctrl={ctrl} />
              </>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 700 }}>
                  <thead>
                    <tr style={theadRow}>
                      <th style={{ ...theadRow, padding: '12px 10px' }}>Unidad</th>
                      <th style={{ ...theadRow, padding: '12px 10px' }}>Semana Calendario</th>
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'center' }}>Cargas</th>
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'right' }}>Litros Semanales</th>
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'right' }}>Costo Semanal</th>
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'right' }}>Precio Prom/L</th>
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'right' }}>Km Acumulados</th>
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'right' }}>Rendimiento Semanal</th>
                      <th style={{ ...theadRow, padding: '12px 10px', textAlign: 'center' }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gruposSemanales.map((g) => {
                      const expandida = filaExpandida === g.clave
                      return (
                        <tr key={g.clave} style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
                          <td colSpan={9} style={{ padding: 0 }}>
                            <div
                              onClick={() => setFilaExpandida(expandida ? null : g.clave)}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1.6fr 0.8fr 1.2fr 1.2fr 1.1fr 1.2fr 1.3fr 0.8fr',
                                alignItems: 'center',
                                padding: '11px 10px',
                                cursor: 'pointer',
                                background: expandida ? 'rgba(197, 160, 89, 0.08)' : 'transparent',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{g.id_unidad}</div>
                              <div>
                                <strong style={{ color: 'var(--text-main)', display: 'block' }}>{g.semanaKey}</strong>
                                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{g.semanaRango}</span>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ background: '#EAE6DC', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#4A4438' }}>
                                  {g.cargasCount} {g.cargasCount === 1 ? 'carga' : 'cargas'}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                                {g.totalLitros.toLocaleString('es-MX')} L
                              </div>
                              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                                {fmt(g.totalCosto)}
                              </div>
                              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                                ${g.costoPromedioLitro.toFixed(2)}
                              </div>
                              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                {g.totalKm > 0 ? `${g.totalKm.toLocaleString('es-MX')} km` : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— (Samsara)</span>}
                              </div>
                              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: g.kml ? '#C5A059' : 'inherit' }}>
                                {g.kml !== null ? `${g.kml.toFixed(2)} km/L` : '—'}
                              </div>
                              <div style={{ textAlign: 'center', fontSize: 12, color: '#C5A059', fontWeight: 600 }}>
                                {expandida ? '▲ Cerrar' : '▼ Ver'}
                              </div>
                            </div>

                            {/* Detalle desplegable de cargas individuales de la semana */}
                            {expandida && (
                              <div style={{ background: 'rgba(20,24,29,0.03)', padding: '12px 18px', borderTop: '1px dashed rgba(197, 160, 89, 0.25)', borderBottom: '1px dashed rgba(197, 160, 89, 0.25)' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
                                  Cargas individuales que integran esta semana ({g.cargas.length}):
                                </div>
                                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                                      <th style={{ padding: '4px 8px' }}>Fecha</th>
                                      <th style={{ padding: '4px 8px', textAlign: 'right' }}>Litros</th>
                                      <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo</th>
                                      <th style={{ padding: '4px 8px', textAlign: 'right' }}>Precio/L</th>
                                      <th style={{ padding: '4px 8px', textAlign: 'right' }}>Km Carga</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {g.cargas.map((sc) => (
                                      <tr key={sc.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                        <td style={{ padding: '6px 8px' }}>📅 {sc.fecha}</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{sc.litros} L</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(sc.costo_total)}</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                                          ${sc.litros > 0 ? (sc.costo_total / sc.litros).toFixed(2) : '—'}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                          {sc.km_recorridos > 0 ? `${sc.km_recorridos} km` : <span style={{ color: 'var(--text-muted)' }}>Opcional</span>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {gruposSemanales.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
                    Sin concentrados semanales que coincidan con los filtros.
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <ConciliacionDiesel />
      )}
    </>
  )
}
