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

export default function Diesel() {
  const { unidades, toast } = useDemo()
  const [tabActiva, setTabActiva] = useState<'cargas' | 'conciliacion'>('cargas')
  const [cargas, setCargas] = useState<CargaDieselApi[]>([])
  const [unidadId, setUnidadId] = useState('')
  const [fecha, setFecha]       = useState('')
  const [litros, setLitros]     = useState('')
  const [costo, setCosto]       = useState('')
  const [km, setKm]             = useState('')
  const [error, setError]       = useState('')
  const [enviando, setEnviando] = useState(false)

  // filters
  const [filtroUnidad, setFiltroUnidad] = useState('Todas')
  const [busqueda, setBusqueda]         = useState('')

  const cargar = useCallback(async () => {
    setCargas(await getDiesel())
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  const unidadesEnCargas = useMemo(() => {
    const seen = new Set<string>()
    cargas.forEach((c) => seen.add(c.id_unidad))
    return Array.from(seen).sort()
  }, [cargas])

  const cargasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return cargas.filter((c) => {
      if (filtroUnidad !== 'Todas' && c.id_unidad !== filtroUnidad) return false
      if (q && !c.id_unidad.toLowerCase().includes(q)) return false
      return true
    })
  }, [cargas, filtroUnidad, busqueda])

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
    if (km === '')     return setError('Captura los kilómetros recorridos desde la última carga.')
    setEnviando(true)
    try {
      const carga = await registrarCarga({
        unidad_id: Number(unidadId),
        fecha,
        litros: Number(litros),
        costo_total: Number(costo),
        km_recorridos: Number(km),
      })
      setUnidadId(''); setFecha(''); setLitros(''); setCosto(''); setKm('')
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
              Cada carga suma al costo real de su unidad y alimenta la eficiencia km/L del Tablero.
              Litros, costo y kilómetros se validan contra el catálogo.
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
                Litros
                <input type="number" min={0} step="0.01" style={campo} placeholder="320.5" value={litros} onChange={(e) => { setLitros(e.target.value); setError('') }} />
              </label>
              <label style={etiqueta}>
                Costo total (MXN)
                <input type="number" min={0} step="0.01" style={campo} placeholder="8975.00" value={costo} onChange={(e) => { setCosto(e.target.value); setError('') }} />
              </label>
              <label style={etiqueta}>
                Kilómetros recorridos
                <input type="number" min={0} style={campo} placeholder="410" value={km} onChange={(e) => { setKm(e.target.value); setError('') }} />
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

          {/* ── Cargas recientes ── */}
          <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', animation: 'fadeUp 0.45s ease', marginTop: 14 }}>
            <h3 style={{ ...h3Titulo, margin: '0 0 12px' }}>Cargas recientes</h3>

            <TablaToolbar
              ctrl={ctrl}
              filtros={[{ value: 'Todas' }, ...unidadesEnCargas.map((u) => ({ value: u }))]}
              filtroActivo={filtroUnidad}
              onFiltro={(f) => setFiltroUnidad(f)}
              busqueda={busqueda}
              onBusqueda={setBusqueda}
              busquedaPlaceholder="Buscar unidad…"
              rightSlot={
                <button
                  onClick={() => {
                    import('../lib/csv').then(({ descargarCSV }) => {
                      const headers = ['Unidad', 'Fecha', 'Litros', 'Costo (MXN)', 'Odómetro', 'Rendimiento', 'Estación', 'Ticket']
                      const rows = cargasFiltradas.map((c) => [
                        String(c.id_unidad),
                        String(c.fecha),
                        String(c.litros),
                        String(c.costo_total),
                        String(c.km_recorridos),
                        c.litros > 0 ? String((c.km_recorridos / c.litros).toFixed(1)) : '—',
                        '—',
                        '—',
                      ])
                      const filename = `Reporte_Diesel_${new Date().toISOString().split('T')[0]}.csv`
                      descargarCSV(headers, rows, filename)
                      toast(`Reporte ${filename} descargado exitosamente.`)
                    })
                  }}
                  className="hv-borde-ink"
                  style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  ⬇️ Exportar CSV
                </button>
              }
            />

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
              <thead>
                <tr style={theadRow}>
                  <SortTh col="id_unidad"    label="Unidad"         sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                  <SortTh col="fecha"        label="Fecha"          sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                  <SortTh col="litros"       label="Litros"         sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                  <SortTh col="costo_total"  label="Costo"          sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                  <SortTh col="km_recorridos" label="Km recorridos" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                  <SortTh col="kml"          label="km/L"           sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {ctrl.filasPagina.map((c) => (
                  <tr key={c.id} className="hv-fila">
                    <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{c.id_unidad}</td>
                    <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{c.fecha}</td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.litros} L</td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.costo_total)}</td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.km_recorridos} km</td>
                    <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {c.litros > 0 ? (c.km_recorridos / c.litros).toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ctrl.total === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
                Sin cargas que coincidan con los filtros.
              </div>
            )}

            <TablaFooter ctrl={ctrl} />
          </div>
        </>
      ) : (
        <ConciliacionDiesel />
      )}
    </>
  )
}
