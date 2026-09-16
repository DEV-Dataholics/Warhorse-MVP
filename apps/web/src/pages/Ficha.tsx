import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Camion from '../components/Camion'
import { 
  getFicha, 
  getUnidades, 
  getOrdenesTrabajo,
  type FichaApi, 
  type UnidadApi,
  type OrdenTrabajoApi
} from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, estadoUnidadColors, FD, fmt, h2Titulo, h3Titulo, tdCell, thCell, theadRow } from '../lib/estilos'
import { 
  Truck, 
  Container, 
  FileText, 
  Wrench, 
  CheckCircle2, 
  ExternalLink,
  ClipboardList
} from 'lucide-react'
import { obtenerHistorialLocal } from '../lib/inspeccionStorage'
import type { OrdenInspeccionForm } from '../lib/inspeccionSchema'
import { OrdenTrabajoModal, type DetalleOT } from '../components/taller/OrdenTrabajoModal'
import { OrdenInspeccionModal } from '../components/patio/OrdenInspeccionModal'

export default function Ficha() {
  const { id } = useParams()
  const { unidades } = useDemo()
  const navigate = useNavigate()
  const [ficha, setFicha] = useState<FichaApi | null>(null)
  const [unidadesLocales, setUnidadesLocales] = useState<UnidadApi[]>([])

  // Trazabilidad adicional
  const [inspeccionesPatio, setInspeccionesPatio] = useState<OrdenInspeccionForm[]>([])
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajoApi[]>([])

  // Modales
  const [otSeleccionada, setOtSeleccionada] = useState<DetalleOT | null>(null)
  const [modalOTAbierto, setModalOTAbierto] = useState(false)
  const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState<OrdenInspeccionForm | null>(null)
  const [modalInspeccionAbierto, setModalInspeccionAbierto] = useState(false)

  const listaEfectiva = unidades && unidades.length > 0 ? unidades : unidadesLocales
  // La URL trae el id de flota (WH125) o el id numérico; el catálogo vivo resuelve la unidad
  const unidad = listaEfectiva.find((u) => u.id_unidad === id || String(u.id) === id)

  useEffect(() => {
    if (!unidades || unidades.length === 0) {
      getUnidades().then(setUnidadesLocales).catch(() => {})
    }
  }, [unidades])

  useEffect(() => {
    if (!unidad) return
    void getFicha(unidad.id).then(setFicha)

    // Cargar historial de inspecciones de patio vinculadas
    obtenerHistorialLocal().then(historial => {
      const deEstaUnidad = historial.filter(i => 
        i.unidad_id.toLowerCase() === unidad.id_unidad.toLowerCase() ||
        i.unidad_id.toLowerCase() === String(unidad.id).toLowerCase()
      )
      setInspeccionesPatio(deEstaUnidad)
    }).catch(() => {})

    // Cargar OTs de taller vinculadas
    getOrdenesTrabajo().then(ots => {
      const deEstaUnidad = ots.filter(ot => 
        ot.unidad?.id === unidad.id || 
        ot.unidad?.id_unidad.toLowerCase() === unidad.id_unidad.toLowerCase()
      )
      setOrdenesTrabajo(deEstaUnidad)
    }).catch(() => {})
  }, [unidad])

  if (!ficha) {
    return (
      <div className="p-8 text-center text-xs text-[#B8B2A6] animate-pulse font-['Barlow_Condensed'] uppercase tracking-wider">
        Cargando expediente y ficha técnica de la unidad...
      </div>
    )
  }

  const ft = ficha.unidad
  const esYonke = ft.estado === 'Yonke'
  const fc = estadoUnidadColors[ft.estado] ?? estadoUnidadColors.Activo

  // Detección especializada de Remolque / Caja Seca vs Tractor
  const esRemolque = ft.tipo === 'Caja' || ft.tipo === 'Thermo' || ft.id_unidad.toUpperCase().startsWith('CJ') || ft.id_unidad.toUpperCase().startsWith('REM')

  // KPIs adaptados: Las cajas/remolques no tienen motor ni gasto de diésel de tracción
  const fichaKpis = [
    ...(esRemolque ? [
      { 
        label: ft.tipo === 'Thermo' ? 'Horas / Termo Autónomo' : 'Configuración Ejes', 
        valor: ft.tipo === 'Thermo' ? 'Refrigeración Thermo' : 'Tándem 8 Ruedas (11-18)' 
      }
    ] : [
      { label: 'Gasto Diésel', valor: fmt(ficha.kpis.diesel) }
    ]),
    { label: 'Gasto Refacciones', valor: fmt(ficha.kpis.refacciones) },
    { label: 'Gasto Taller', valor: fmt(ficha.kpis.taller) },
    { label: 'Valor estimado de la unidad', valor: ft.valor_referencia ? fmt(ft.valor_referencia) : '—' },
  ]

  const selloEstimado = (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: '#FDE8DC', color: '#B4430A', border: '1px dashed #C5A059', borderRadius: 5, padding: '3px 8px' }}>
      Estimado
    </span>
  )

  const abrirDetalleOT = (otApi: OrdenTrabajoApi) => {
    const detalle: DetalleOT = {
      id: otApi.id,
      folio: otApi.folio || `OT-${String(otApi.id).padStart(5, '0')}`,
      tipo: otApi.diagnostico.toLowerCase().includes('preventiv') ? 'Preventivo' : 'Correctivo',
      estado: (otApi.estado as DetalleOT['estado']) || 'Activa',
      unidad_id: ft.id_unidad,
      tipo_unidad: esRemolque ? (ft.tipo === 'Thermo' ? 'Thermo' : 'Caja') : 'Tractor',
      responsable_nombre: otApi.responsable?.nombre || 'Carlos Méndez',
      responsable_rol: otApi.responsable?.rol || 'Mecánico A',
      diagnostico: otApi.diagnostico,
      fecha_ingreso: otApi.created_at ? otApi.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
      materiales: otApi.materiales || [],
    }
    setOtSeleccionada(detalle)
    setModalOTAbierto(true)
  }

  return (
    <>
      {/* Cabecera Principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <button
          onClick={() => navigate('/catalogo')}
          className="hv-borde-naranja"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '9px 14px', fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
        >
          ← Catálogo Flota
        </button>
        <div className="flex items-center gap-2">
          {esRemolque ? (
            <Container className="h-6 w-6 text-[#C5A059]" />
          ) : (
            <Truck className="h-6 w-6 text-[#F2620F]" />
          )}
          <h2 style={h2Titulo}>Ficha · {ft.id_unidad}</h2>
        </div>
        <span style={{ ...badge(fc[0], fc[1], fc[2]), fontSize: 13, padding: '5px 14px' }}>{ft.estado}</span>

        {/* Badge Especializado de Tipo */}
        <span className={`rounded-lg px-3 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider ${
          esRemolque 
            ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40' 
            : 'bg-[#F2620F]/20 text-[#F2620F] border border-[#F2620F]/40'
        }`}>
          {esRemolque ? (ft.tipo === 'Thermo' ? 'Remolque Thermo' : 'Caja Seca / Remolque') : 'Tractocamión Quinta Rueda'}
        </span>

        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontFamily: FD, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Costo total acumulado
          </div>
          <div style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {fmt(ficha.kpis.costo_real_acumulado)}
          </div>
        </div>
      </div>

      {/* Banner Informativo para Cajas / Remolques */}
      {esRemolque && (
        <div className="rounded-2xl border border-[#C5A059]/30 bg-[#C5A059]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059] text-[#16191E] shrink-0 font-bold font-['Barlow_Condensed']">
              478
            </div>
            <div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Equipo de Arrastre · Formato Oficial Nº 478</span>
                <span className="rounded bg-[#C5A059] px-2 py-0.2 text-[10px] font-black text-[#16191E]">CAJA SECA / TÁNDEM</span>
              </div>
              <p className="text-xs text-[#B8B2A6] mt-0.5">
                Esta unidad no registra consumo de diésel de motor. Inspección especializada: Rodado tándem (posiciones 11 a 18), perno rey (kingpin), patines y suspensión.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/taller/ingreso', { state: { id_unidad: ft.id_unidad, criticidad: 'Media' } })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#C5A059] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#B38F46] transition-all cursor-pointer shrink-0"
          >
            <Wrench className="h-4 w-4" />
            <span>Ingreso Taller Remolque (№ 478)</span>
          </button>
        </div>
      )}

      {!esYonke && (
        <>
          {/* Tarjetas KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, animation: 'fadeUp 0.4s ease' }}>
            {fichaKpis.map((k) => (
              <div key={k.label} style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 2px rgba(20,24,29,0.05)' }}>
                <div style={{ fontFamily: FD, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{k.label}</div>
                <div style={{ fontFamily: FD, fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{k.valor}</div>
              </div>
            ))}
          </div>

          {/* Historial de Órdenes de Trabajo / Reparaciones */}
          <div style={card}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ ...h3Titulo, margin: 0 }}>Historial de Órdenes de Trabajo (Taller)</h3>
              <button
                type="button"
                onClick={() => navigate('/taller/ordenes')}
                className="text-xs font-['Barlow_Condensed'] uppercase tracking-wider text-[#F2620F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver módulo taller</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr style={theadRow}>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Ingreso</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Diagnóstico</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Criticidad</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Liberación</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Días en taller</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Costo taller</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.reparaciones.map((r, i) => {
                    const otCorrespondiente = ordenesTrabajo[i]

                    return (
                      <tr key={r.fecha_ingreso + '-' + i} className="hv-fila">
                        <td style={{ ...tdCell, padding: 10, whiteSpace: 'nowrap' }}>{r.fecha_ingreso}</td>
                        <td style={{ ...tdCell, padding: 10, fontWeight: 600 }}>
                          {r.diagnostico}
                          {r.es_reincidencia && (
                            <span style={{ marginLeft: 8 }}>
                              <span style={badge('#FDE8DC', '#B4430A', '#C5A059')}>Reincidencia</span>
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdCell, padding: 10 }}>
                          <span style={critStyle(r.criticidad)}>{r.criticidad}</span>
                        </td>
                        <td style={{ ...tdCell, padding: 10 }}>
                          {r.tipo_liberacion === null ? (
                            <span style={badge('#EAE6DC', '#4A4438', '#C9C2B2')}>En taller</span>
                          ) : (
                            <span style={r.tipo_liberacion === 'Total' ? badge('#E5F3E9', '#2C7A44', '#9FD4B0') : badge('#FDE8DC', '#B4430A', '#C5A059')}>
                              {r.tipo_liberacion === 'Total' ? 'Total' : 'Mejoralito'}
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdCell, padding: 10, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: (r.dias_en_taller ?? 0) >= 30 ? 700 : 400 }}>
                          {r.dias_en_taller === null ? '—' : r.dias_en_taller + (r.dias_en_taller === 1 ? ' día' : ' días')}
                        </td>
                        <td style={{ ...tdCell, padding: 10, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(r.costo_taller)}
                        </td>
                        <td style={{ ...tdCell, padding: 10, textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (otCorrespondiente) {
                                abrirDetalleOT(otCorrespondiente)
                              } else {
                                setOtSeleccionada({
                                  id: i + 1,
                                  folio: `OT-${String(i + 1).padStart(5, '0')}`,
                                  tipo: r.diagnostico.toLowerCase().includes('preventiv') ? 'Preventivo' : 'Correctivo',
                                  estado: r.tipo_liberacion ? 'Liberada' : 'Activa',
                                  unidad_id: ft.id_unidad,
                                  tipo_unidad: esRemolque ? 'Caja' : 'Tractor',
                                  responsable_nombre: 'Carlos Méndez',
                                  responsable_rol: 'Mecánico A',
                                  diagnostico: r.diagnostico,
                                  fecha_ingreso: r.fecha_ingreso,
                                  costo_taller: r.costo_taller,
                                })
                                setModalOTAbierto(true)
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2.5 py-1 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{esRemolque ? 'Formato 478' : 'Formato OT'}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {ficha.reparaciones.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
                  Sin reparaciones registradas para esta unidad.
                </div>
              )}
            </div>
          </div>

          {/* Trazabilidad de Inspecciones de Patio */}
          <div style={card}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 style={{ ...h3Titulo, margin: 0 }}>Inspecciones Físicas de Patio (Operadores)</h3>
                <p className="text-xs text-[#B8B2A6] mt-0.5">
                  Checklist y dictamen físico de ingreso realizado en patio de maniobras.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patio/historial')}
                className="text-xs font-['Barlow_Condensed'] uppercase tracking-wider text-[#F2620F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver historial patio</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
                <thead>
                  <tr style={theadRow}>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Folio</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Operador</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Fecha</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Resultado</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>OT Taller</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {inspeccionesPatio.map((insp) => {
                    const tieneCritico = insp.items.some(i => i.estado === 'Crítico')
                    const tieneWarning = insp.items.some(i => i.estado === 'Regular')

                    return (
                      <tr key={insp.folio} className="hv-fila">
                        <td style={{ ...tdCell, padding: 10 }} className="font-mono font-bold text-[#F2620F]">
                          {insp.folio}
                        </td>
                        <td style={{ ...tdCell, padding: 10, fontWeight: 600 }}>
                          {insp.operador_nombre}
                        </td>
                        <td style={{ ...tdCell, padding: 10, whiteSpace: 'nowrap' }}>
                          {insp.fecha ? `${insp.fecha} ${insp.hora || ''}`.trim() : '—'}
                        </td>
                        <td style={{ ...tdCell, padding: 10 }}>
                          {tieneCritico ? (
                            <span className="rounded bg-red-950/40 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold text-red-400 border border-red-900/40">
                              Crítico / Falla
                            </span>
                          ) : tieneWarning ? (
                            <span className="rounded bg-amber-950/40 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold text-amber-400 border border-amber-900/40">
                              Warning / Regular
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-950/40 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold text-emerald-400 border border-emerald-900/40">
                              100% Conforme
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdCell, padding: 10 }}>
                          {insp.ot_generada ? (
                            <span className="font-mono text-xs font-bold text-[#3FA65C] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {insp.ot_generada}
                            </span>
                          ) : (
                            <span className="text-xs text-[#B8B2A6]">Sin OT requerida</span>
                          )}
                        </td>
                        <td style={{ ...tdCell, padding: 10, textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setInspeccionSeleccionada(insp)
                              setModalInspeccionAbierto(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2.5 py-1 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
                          >
                            <ClipboardList className="h-3 w-3" />
                            <span>Ver Inspección</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {inspeccionesPatio.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                  No se han registrado inspecciones físicas de patio para la unidad {ft.id_unidad}.
                </div>
              )}
            </div>
          </div>

          {/* Piezas instaladas */}
          <div style={card}>
            <h3 style={{ ...h3Titulo, margin: '0 0 4px' }}>Piezas instaladas</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)' }}>
              Las piezas de Yonke llevan costo <em>estimado</em>: es una asignación interna, no una factura.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ficha.piezas_instaladas.map((q, i) => (
                <div key={q.descripcion_pieza + '-' + i} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: '1px solid #EFEAE0', borderRadius: 10, padding: '12px 16px' }}>
                  <span style={q.origen === 'Yonke' ? badge('#FDE8DC', '#B4430A', '#C5A059') : badge('#EAE6DC', '#16191E', '#C9C2B2')}>
                    {q.origen}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14.5 }}>{q.descripcion_pieza}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {q.origen === 'Yonke' ? 'donada por ' + (q.unidad_donante_id ?? '—') : 'compra a proveedor'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: FD, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>
                      {q.costo !== null ? fmt(q.costo) : 'Pendiente'}
                    </span>
                    {q.es_estimado && selloEstimado}
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {q.estado} · {q.fecha}
                  </span>
                </div>
              ))}
              {ficha.piezas_instaladas.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
                  Sin piezas registradas para esta unidad.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {esYonke && (
        <div style={card}>
          <h3 style={{ ...h3Titulo, margin: '0 0 4px' }}>Piezas donadas a otras unidades</h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)' }}>
            Esta unidad es donante del yonke interno. Cada pieza que sale lleva un costo estimado asignado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ficha.piezas_donadas.map((q, i) => (
              <div key={q.descripcion_pieza + '-' + i} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: '1px solid #EFEAE0', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{q.descripcion_pieza}</span>
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                  → instalada en <strong style={{ color: 'var(--accent-gold)' }}>{q.unidad_destino}</strong>
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FD, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>
                    {fmt(q.costo_estimado)}
                  </span>
                  {selloEstimado}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{q.fecha}</span>
              </div>
            ))}
            {ficha.piezas_donadas.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 28, color: 'var(--text-muted)', fontSize: 14 }}>
                <Camion stroke="#16191E" strokeWidth={3} style={{ width: 120, opacity: 0.35 }} />
                Aún no hay piezas donadas registradas de esta unidad.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Oficial de Orden de Trabajo */}
      <OrdenTrabajoModal
        ot={otSeleccionada}
        abierto={modalOTAbierto}
        alCerrar={() => setModalOTAbierto(false)}
      />

      {/* Modal Oficial de Inspección de Patio */}
      <OrdenInspeccionModal
        inspeccion={inspeccionSeleccionada}
        abierto={modalInspeccionAbierto}
        alCerrar={() => setModalInspeccionAbierto(false)}
      />
    </>
  )
}
