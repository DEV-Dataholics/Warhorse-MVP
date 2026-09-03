import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { SortTh, TablaFooter, TablaToolbar } from '../components/TablaControls'
import { ApiError, avanzarEstado, getColaCompras, revertirCotizacion, eliminarRequisicion, getFotoRequisicion, getDocumentoRequisicion, type FilaCompras } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, estadoReqColors, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, theadRow } from '../lib/estilos'
import { useTabla } from '../lib/useTabla'
import type { EstadoRequisicion } from '../lib/types'

const flujo: EstadoRequisicion[] = [
  'Solicitado', 'En aprobación', 'En pago', 'En recolección',
  'Más información', 'Cancelado', 'Rechazado', 'Instalado',
  'Cotizado', 'Comprado', 'En trayecto'
]

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

type FiltroEstado = 'Todos' | EstadoRequisicion
type FiltroOrigen = 'Todos' | 'Yonke' | 'Compra'

const MESES = [
  { val: '', label: 'Todos los meses' },
  { val: '01', label: 'Enero' },
  { val: '02', label: 'Febrero' },
  { val: '03', label: 'Marzo' },
  { val: '04', label: 'Abril' },
  { val: '05', label: 'Mayo' },
  { val: '06', label: 'Junio' },
  { val: '07', label: 'Julio' },
  { val: '08', label: 'Agosto' },
  { val: '09', label: 'Septiembre' },
  { val: '10', label: 'Octubre' },
  { val: '11', label: 'Noviembre' },
  { val: '12', label: 'Diciembre' },
]

const DIAS = ['', ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))]

export default function Compras() {
  const { sesion, setConfirmar, toast } = useDemo()
  const [todasFilas, setTodasFilas] = useState<FilaCompras[]>([])
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('Todos')
  const [filtroOrigen, setFiltroOrigen] = useState<FiltroOrigen>('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroDestino, setFiltroDestino] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [filtroFechaSol, setFiltroFechaSol] = useState('')
  
  // Date Filters
  const [filtroDia, setFiltroDia] = useState('')
  const [filtroMes, setFiltroMes] = useState('')

  // Modals state
  const [comprar, setComprar]   = useState<FilaCompras | null>(null)
  const [archivoFactura, setArchivoFactura] = useState<File | null>(null)

  const [cotizar, setCotizar] = useState<FilaCompras | null>(null)
  const [archivoCotizacion, setArchivoCotizacion] = useState<File | null>(null)

  const [revertirReq, setRevertirReq] = useState<FilaCompras | null>(null)
  const [origenRefaccion, setOrigenRefaccion] = useState('')
  const [motivoReversion, setMotivoReversion] = useState('')
  const [costoReal, setCostoReal] = useState('')
  const [factura, setFactura]   = useState('')
  const [errorModal, setErrorModal] = useState('')

  // Gallery modal state
  const [galeriaReq, setGaleriaReq] = useState<FilaCompras | null>(null)
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>([])
  const [cargandoGaleria, setCargandoGaleria] = useState(false)
  const [galeriaIndex, setGaleriaIndex] = useState(0)

  const esAdmin = sesion?.rol === 'admin'

  const cargar = useCallback(async () => {
    setTodasFilas(await getColaCompras())
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  const filasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return todasFilas.filter((f) => {
      if (filtroEstado !== 'Todos' && f.estado !== filtroEstado) return false
      if (filtroOrigen !== 'Todos' && f.origen !== filtroOrigen) return false
      if (q && !f.unidad_destino.toLowerCase().includes(q) && !f.descripcion_pieza.toLowerCase().includes(q)) return false
      
      // Local Day/Month Filter
      if (filtroDia) {
        const dia = f.fecha_solicitud.split('-')[2]
        if (dia !== filtroDia) return false
      }
      if (filtroMes) {
        const mes = f.fecha_solicitud.split('-')[1]
        if (mes !== filtroMes) return false
      }
      
      return true
    })
  }, [todasFilas, filtroEstado, filtroOrigen, busqueda, filtroDia, filtroMes])

  const ctrl = useTabla(
    filasFiltradas,
    'fecha_solicitud',
    'desc',
    useCallback((row, col) => {
      if (col === 'costo') return Number(row.costo_real ?? row.costo_estimado ?? 0)
      return (row as unknown as Record<string, unknown>)[col] as string | number
    }, []),
  )

  const avanzar = async (q: FilaCompras, nuevo: EstadoRequisicion, extra: any = {}) => {
    try {
      await avanzarEstado(q.id, { estado: nuevo, ...extra })
      toast(q.descripcion_pieza + ' → ' + nuevo)
      await cargar()
      return true
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'No se pudo avanzar el estado.')
      return false
    }
  }

  const registrarCotizacion = async () => {
    if (!cotizar) return
    setErrorModal('')
    try {
      await avanzarEstado(cotizar.id, {
        estado: 'Cotizado',
        archivo_cotizacion: archivoCotizacion,
      })
      toast(cotizar.descripcion_pieza + ' → Cotizado')
      setCotizar(null)
      setArchivoCotizacion(null)
      await cargar()
    } catch (e) {
      setErrorModal(e instanceof ApiError ? e.message : 'No se pudo registrar la cotización.')
    }
  }

  const registrarCompra = async () => {
    if (!comprar) return
    setErrorModal('')
    try {
      await avanzarEstado(comprar.id, {
        estado: 'Comprado',
          origen_refaccion: origenRefaccion.trim() || undefined,
        costo_real: costoReal === '' ? undefined : Number(costoReal),
        numero_factura: factura || undefined,
        archivo_factura: archivoFactura,
      })
      toast(comprar.descripcion_pieza + ' → Comprado (factura ' + factura + ')')
      setComprar(null)
      setArchivoFactura(null)
      await cargar()
    } catch (e) {
      setErrorModal(e instanceof ApiError ? e.message : 'No se pudo registrar la compra.')
    }
  }

  const ejecutarReversion = async () => {
    if (!revertirReq) return
    if (!motivoReversion.trim()) return setErrorModal('El motivo es obligatorio.')
    setErrorModal('')
    try {
      await revertirCotizacion(revertirReq.id, { motivo: motivoReversion })
      toast(revertirReq.descripcion_pieza + ' reversión registrada.')
      setRevertirReq(null)
      setMotivoReversion('')
      await cargar()
    } catch (e) {
      setErrorModal(e instanceof ApiError ? e.message : 'No se pudo revertir la cotización.')
    }
  }

  const ejecutarEliminacion = (q: FilaCompras) => {
    setConfirmar({
      pieza: `ELIMINAR REQUISICIÓN: ${q.descripcion_pieza}`,
      destino: `¿Estás seguro de eliminar permanentemente esta requisición para la unidad ${q.unidad_destino}?`,
      alConfirmar: async () => {
        try {
          await eliminarRequisicion(q.id)
          toast('Requisición eliminada con éxito.')
          await cargar()
        } catch (e) {
          toast(e instanceof ApiError ? e.message : 'No se pudo eliminar la requisición.')
        }
      }
    })
  }

  const abrirGaleria = async (q: FilaCompras) => {
    setGaleriaReq(q)
    setGaleriaIndex(0)
    setGaleriaUrls([])
    setCargandoGaleria(true)
    try {
      const fotosCount = q.foto_pieza_url.split(',').length
      const urls: string[] = []
      for (let i = 0; i < fotosCount; i++) {
        try {
          const url = await getFotoRequisicion(q.id, i)
          urls.push(url)
        } catch (err) {
          console.error("Failed to load photo", i, err)
        }
      }
      setGaleriaUrls(urls)
    } catch (e) {
      toast('No se pudieron cargar las fotografías.')
    } finally {
      setCargandoGaleria(false)
    }
  }

  const verDocumento = async (id: number, tipo: 'cotizacion' | 'factura') => {
    try {
      const url = await getDocumentoRequisicion(id, tipo)
      window.open(url, '_blank')
    } catch (e) {
      toast('No se pudo abrir el documento adjunto.')
    }
  }

  const accionDe = (q: FilaCompras): { texto: string; ejecutar: () => void } | null => {
    if (q.origen === 'Yonke') {
      if (q.estado !== 'Solicitado') return null
      return {
        texto: '→ Instalado',
        ejecutar: () =>
          setConfirmar({
            pieza: q.descripcion_pieza,
            destino: q.unidad_destino,
            alConfirmar: () => void avanzar(q, 'Instalado'),
          }),
      }
    }
    switch (q.estado) {
      case 'Solicitado':
        return { texto: '→ En aprobación', ejecutar: () => void avanzar(q, 'En aprobación') }
      case 'En aprobación':
        return { texto: '→ En pago', ejecutar: () => void avanzar(q, 'En pago') }
      case 'En pago':
        return null // Handled with dual buttons in the TD
      case 'En recolección':
      case 'Bajo pedido':
        return {
          texto: '→ Cotizado',
          ejecutar: () => {
            setErrorModal('')
            setArchivoCotizacion(null)
            setCotizar(q)
          }
        }
      case 'Cotizado':
        return {
          texto: '→ Comprado',
          ejecutar: () => {
            setErrorModal('')
            setCostoReal('')
            setFactura('')
            setArchivoFactura(null)
            setComprar(q)
          },
        }
      case 'Comprado':
        return {
          texto: '→ En trayecto',
          ejecutar: () => void avanzar(q, 'En trayecto')
        }
      case 'En trayecto':
        return {
          texto: '→ Instalado',
          ejecutar: () =>
            setConfirmar({
              pieza: q.descripcion_pieza,
              destino: q.unidad_destino,
              alConfirmar: () => void avanzar(q, 'Instalado'),
            })
        }
      default:
        return null
    }
  }

  return (
    <>
      <div style={{ animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Compras" />
        <h2 style={h2Titulo}>Panel de Compras</h2>
        <p style={subTitulo}>
          Vista de Montzay · ciclo: Solicitado → Cotizado → Comprado → En trayecto → Instalado.
        </p>
      </div>

      <div data-tour="compras" style={{ ...card, padding: '14px 20px', overflowX: 'auto', animation: 'fadeUp 0.4s ease' }}>
        <TablaToolbar
          ctrl={ctrl}
          filtros={(['Todos', ...flujo] as FiltroEstado[]).map((f) => ({ value: f }))}
          filtroActivo={filtroEstado}
          onFiltro={(f) => setFiltroEstado(f as FiltroEstado)}
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          busquedaPlaceholder="Buscar unidad o pieza…"
          rightSlot={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Origen</span>
                {(['Todos', 'Yonke', 'Compra'] as FiltroOrigen[]).map((o) => (
                  <button
                    key={o}
                    onClick={() => { setFiltroOrigen(o); ctrl.resetPage() }}
                    className="hv-borde-ink"
                    style={{
                      padding: '6px 11px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      background: filtroOrigen === o ? '#16191E' : '#fff',
                      color: filtroOrigen === o ? '#F3EFE7' : '#4A4438',
                      border: filtroOrigen === o ? '1px solid #16191E' : '1px solid #D8D2C4',
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              
              {/* Day Filter */}
              <select
                value={filtroDia}
                onChange={(e) => { setFiltroDia(e.target.value); ctrl.resetPage() }}
                style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 12.5, background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', fontWeight: 600 }}
              >
                <option value="">Todos los días</option>
                {DIAS.filter(Boolean).map((d) => (
                  <option key={d} value={d}>Día {d}</option>
                ))}
              </select>

              {/* Month Filter */}
              <select
                value={filtroMes}
                onChange={(e) => { setFiltroMes(e.target.value); ctrl.resetPage() }}
                style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 12.5, background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', fontWeight: 600 }}
              >
                {MESES.map((m) => (
                  <option key={m.val} value={m.val}>{m.label}</option>
                ))}
              </select>
            </div>
          }
        />

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 850 }}>
            <thead>
              <tr style={theadRow}>
                <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => ctrl.toggleSort('unidad_destino')}>Destino {ctrl.sortCol === 'unidad_destino' && (ctrl.sortDir === 'asc' ? '↑' : '↓')}</div>
                    <input type="text" placeholder="Filtrar..." value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)} style={{ padding: '4px 6px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
                  </div>
                </th>
                <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)', textAlign: 'left' }}>Cant.</th>
                <SortTh col="descripcion_pieza" label="Pieza"     sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <SortTh col="origen"            label="Origen"    sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <SortTh col="costo"             label="Costo"     sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right' }} />
                <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => ctrl.toggleSort('urgencia')}>Urgencia {ctrl.sortCol === 'urgencia' && (ctrl.sortDir === 'asc' ? '↑' : '↓')}</div>
                    <select value={filtroUrgencia} onChange={(e) => setFiltroUrgencia(e.target.value)} style={{ padding: '4px 2px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                      <option value="">Todas</option>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                </th>
                <SortTh col="estado"            label="Estado"    sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => ctrl.toggleSort('fecha_solicitud')}>Solicitud {ctrl.sortCol === 'fecha_solicitud' && (ctrl.sortDir === 'asc' ? '↑' : '↓')}</div>
                    <input type="date" value={filtroFechaSol} onChange={(e) => setFiltroFechaSol(e.target.value)} style={{ padding: '4px 6px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
                  </div>
                </th>
                <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }}>Acción</th>
              </tr>
            </thead>
          <tbody>
            {ctrl.filasPagina.map((q) => {
              const yk = q.origen === 'Yonke'
              const ec = estadoReqColors[q.estado] ?? estadoReqColors.Solicitado
              const accion = accionDe(q)
              const esEstimado = yk && q.costo_real === null
              const costo = q.costo_real ?? q.costo_estimado
              return (
                <tr key={q.id} className="hv-fila">
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: 'var(--text-main)' }}>
                    {q.unidad_destino}
                  </td>
                  <td style={{ ...tdCell, fontWeight: 600 }}>
                    {q.cantidad > 1 ? `(x${q.cantidad}) ` : ''}{q.descripcion_pieza}
                    <div style={{ fontWeight: 400, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                      <span>{yk ? 'Donante: ' + (q.unidad_donante ?? '—') + ' (yonke)' : 'Compra externa'}</span>
                      <button
                        onClick={() => void abrirGaleria(q)}
                        className="hv-op85"
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        📷 Ver Fotos ({q.foto_pieza_url ? q.foto_pieza_url.split(',').length : 0})
                      </button>
                      {q.archivo_cotizacion_url && (
                        <button
                          onClick={() => void verDocumento(q.id, 'cotizacion')}
                          className="hv-op85"
                          style={{ background: 'transparent', border: 'none', color: '#2C7A44', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          📄 Cotización
                        </button>
                      )}
                      {q.archivo_factura_url && (
                        <button
                          onClick={() => void verDocumento(q.id, 'factura')}
                          className="hv-op85"
                          style={{ background: 'transparent', border: 'none', color: '#1B4E8C', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          📄 Factura
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={tdCell}>
                    <span style={yk ? badge('#FDE8DC', '#B4430A', '#C5A059') : badge('#EAE6DC', '#16191E', '#C9C2B2')}>
                      {q.origen}
                    </span>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {costo !== null ? fmt(Number(costo)) : 'Por cotizar'}{' '}
                    {esEstimado && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: '#FDE8DC', color: '#B4430A', border: '1px dashed #C5A059', borderRadius: 4, padding: '2px 5px' }}>
                        Est.
                      </span>
                    )}
                  </td>
                  <td style={tdCell}>
                    <span style={critStyle(q.urgencia)}>{q.urgencia}</span>
                  </td>
                  <td style={tdCell}>
                    <span style={badge(ec[0], ec[1], ec[2])}>{q.estado}</span>
                  </td>
                  <td style={{ ...tdCell, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{q.fecha_solicitud}</td>
                  <td style={{ ...tdCell, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {q.estado === 'En pago' ? (
                      <>
                        <button
                          onClick={() => void avanzar(q, 'En recolección')}
                          className="hv-op85"
                          style={{ padding: '7px 12px', background: 'transparent', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-gold)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          → Recolección
                        </button>
                        <button
                          onClick={() => void avanzar(q, 'Bajo pedido')}
                          className="hv-op85"
                          style={{ padding: '7px 12px', background: 'transparent', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-gold)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          → Bajo pedido
                        </button>
                      </>
                    ) : accion ? (
                      <button
                        onClick={accion.ejecutar}
                        className="hv-op85"
                        style={{ padding: '7px 12px', background: 'transparent', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-gold)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {accion.texto}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12.5, color: '#2C7A44', fontWeight: 700 }}>✓ Cerrado</span>
                    )}
                    {q.estado !== 'Solicitado' && (
                      <button
                        onClick={() => {
                          setErrorModal('')
                          setMotivoReversion('')
                          setRevertirReq(q)
                        }}
                        className="hv-crema"
                        style={{ padding: '7px 12px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#C53030', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Revertir
                      </button>
                    )}
                    {esAdmin && (
                      <button
                        onClick={() => ejecutarEliminacion(q)}
                        className="hv-crema"
                        style={{ padding: '7px 12px', background: '#FFF5F5', border: '1px solid #E53E3E', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#E53E3E', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {ctrl.total === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
            Sin registros que coincidan con los filtros.
          </div>
        )}

        <TablaFooter ctrl={ctrl} />
      </div>

      {/* ── Modal registrar cotización ── */}
      {cotizar && (
        <div
          onClick={() => setCotizar(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Registrar cotización"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 10px' }}>
              Registrar cotización
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.55, color: 'var(--text-muted)' }}>
              Registra la cotización de la refacción <strong style={{ color: 'var(--text-main)' }}>{cotizar.descripcion_pieza}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={etiqueta}>
                Adjuntar archivo de cotización (PDF / Imagen)
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  style={campo}
                  onChange={(e) => setArchivoCotizacion(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {errorModal && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {errorModal}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setCotizar(null)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void registrarCotizacion()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal registrar compra ── */}
      {comprar && (
        <div
          onClick={() => setComprar(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Registrar compra"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 10px' }}>
              Registrar compra
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.55, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{comprar.descripcion_pieza}</strong> para el tracto{' '}
              <strong style={{ color: 'var(--accent-gold)' }}>{comprar.unidad_destino}</strong>: captura el costo real
              facturado para pasar a <strong style={{ color: '#1B4E8C' }}>Comprado</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={etiqueta}>
                Costo Real (MXN)
                <input type="number" min={0} style={campo} value={costoReal} onChange={(e) => setCostoReal(e.target.value)} />
              </label>
              <label style={etiqueta}>
                Origen de la compra y ETA
                <select style={campo} value={origenRefaccion} onChange={(e) => setOrigenRefaccion(e.target.value)}>
                  <option value="">Selecciona origen/tiempo...</option>
                  <option value="Local (Mismo día)">Local (Mismo día)</option>
                  <option value="Foránea (1-3 días)">Foránea (ETA 1-3 días)</option>
                  <option value="Foránea (1 semana)">Foránea (ETA 1 semana)</option>
                  <option value="Foránea (2+ semanas)">Foránea (ETA 2+ semanas)</option>
                  <option value="Agencia / Planta (Indefinido)">Agencia / Planta (Indefinido)</option>
                </select>
              </label>
              <label style={etiqueta}>
                Número de factura
                <input type="text" style={campo} value={factura} placeholder="Ej. F-10233" onChange={(e) => setFactura(e.target.value)} />
              </label>
              <label style={etiqueta}>
                Adjuntar archivo de factura (PDF / Imagen / XML)
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,text/xml,application/xml"
                  onChange={(e) => setArchivoFactura(e.target.files?.[0] || null)}
                  style={{ ...campo, background: '#fff', border: '1px dashed var(--border-color)', padding: 10, cursor: 'pointer' }}
                />
              </label>
            </div>
            {errorModal && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {errorModal}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setComprar(null)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void registrarCompra()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal revertir aceptación ── */}
      {revertirReq && (
        <div
          onClick={() => setRevertirReq(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Revertir cotización"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #E53E3E', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#E53E3E', margin: '0 0 10px' }}>
              Revertir Cotización
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.55, color: 'var(--text-muted)' }}>
              Regresarás la requisición <strong style={{ color: 'var(--text-main)' }}>{revertirReq.descripcion_pieza}</strong> al estado <strong style={{ color: 'var(--accent-gold)' }}>Solicitado</strong>. Captura el motivo de la reversión para el historial de auditoría.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={etiqueta}>
                Motivo de reversión
                <textarea
                  style={{ ...campo, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                  value={motivoReversion}
                  placeholder="Explica la razón del cambio..."
                  onChange={(e) => setMotivoReversion(e.target.value)}
                />
              </label>
            </div>
            {errorModal && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {errorModal}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setRevertirReq(null)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void ejecutarReversion()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: '#E53E3E', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Confirmar Reversión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Galería de Fotos ── */}
      {galeriaReq && (
        <div
          onClick={() => setGaleriaReq(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,29,0.75)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Evidencias fotográficas"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 540, width: '100%', padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.2s ease' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={h3Titulo}>Evidencias fotográficas</h3>
              <button
                onClick={() => setGaleriaReq(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 24, fontWeight: 700, cursor: 'pointer', color: 'var(--text-main)', padding: 0 }}
              >
                ×
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
              {galeriaReq.descripcion_pieza} (unidad: {galeriaReq.unidad_destino})
            </p>

            {cargandoGaleria ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: 10, color: 'var(--text-muted)' }}>
                Cargando fotografías...
              </div>
            ) : galeriaUrls.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative', width: '100%', height: 320, background: 'var(--accent-gold)', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={galeriaUrls[galeriaIndex]}
                    alt={`Evidencia ${galeriaIndex + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                  
                  {galeriaUrls.length > 1 && (
                    <>
                      <button
                        onClick={() => setGaleriaIndex((prev) => (prev === 0 ? galeriaUrls.length - 1 : prev - 1))}
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(20,24,29,0.7)', border: 'none', color: 'var(--text-main)', fontSize: 20, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setGaleriaIndex((prev) => (prev === galeriaUrls.length - 1 ? 0 : prev + 1))}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(20,24,29,0.7)', border: 'none', color: 'var(--text-main)', fontSize: 20, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>
                  <span>Foto {galeriaIndex + 1} de {galeriaUrls.length}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {galeriaUrls.map((_, idx) => (
                      <span
                        key={idx}
                        onClick={() => setGaleriaIndex(idx)}
                        style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: galeriaIndex === idx ? '#C5A059' : '#D8D2C4',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: 10, color: '#C53030', fontWeight: 600 }}>
                No se pudieron cargar las fotografías de evidencia.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
