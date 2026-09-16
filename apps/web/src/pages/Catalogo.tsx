import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Camion from '../components/Camion'
import Kicker from '../components/Kicker'
import { SortTh, TablaFooter, TablaToolbar } from '../components/TablaControls'
import { ApiError, actualizarUnidad, crearUnidad, getUnidades, type UnidadApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { useAuthStore } from '../store/useAuthStore'
import { badge, card, estadoUnidadColors, FD, fmt, h2Titulo, subTitulo, tdCell, theadRow } from '../lib/estilos'
import { useTabla } from '../lib/useTabla'
import type { EstadoUnidad, TipoUnidad } from '../lib/types'

type FiltroEstado = 'Todos' | EstadoUnidad
type FiltroTipo   = 'Todos' | TipoUnidad

const campo: CSSProperties = { padding: 12, border: '1px solid rgba(243,239,231,0.18)', borderRadius: 9, fontSize: 14, background: '#1C2128', color: '#FFFFFF', width: '100%', outline: 'none' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#D8D2C4' }

interface Alta {
  id_unidad: string
  tipo: TipoUnidad
  operacion: string
  estado: EstadoUnidad
  fecha_alta: string
  valor_referencia: string
  vencimiento_documentacion: string
  vin: string
  numero_economico: string
  marca: string
  modelo: string
  placas: string
}

const altaVacia: Alta = { id_unidad: '', tipo: 'Tractor', operacion: '', estado: 'Activo', fecha_alta: '', valor_referencia: '', vencimiento_documentacion: '', vin: '', numero_economico: '', marca: '', modelo: '', placas: '' }

const TIPOS: FiltroTipo[] = ['Todos', 'Tractor', 'Caja', 'Thermo', 'Servicio']
const ESTADOS: FiltroEstado[] = ['Todos', 'Activo', 'Yonke', 'Inactivo', 'Vendido']

const obtenerColorSemaforo = (fechaStr?: string | null): { bg: string; fg: string; label: string } | null => {
  if (!fechaStr) return null
  const hoy = new Date()
  const vencimiento = new Date(fechaStr)
  const diffTime = vencimiento.getTime() - hoy.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 14) {
    return { bg: 'rgba(197, 48, 48, 0.25)', fg: '#FEB2B2', label: `Rojo (${diffDays} días)` }
  } else if (diffDays <= 28) {
    return { bg: 'rgba(224, 195, 106, 0.25)', fg: '#E0C36A', label: `Amarillo (${diffDays} días)` }
  } else {
    return { bg: 'rgba(63, 166, 92, 0.25)', fg: '#68D391', label: `Verde (${diffDays} días)` }
  }
}

export default function Catalogo() {
  const { sesion, unidades: unidadesDemo, recargarUnidades, toast } = useDemo()
  const { usuario, tieneRol } = useAuthStore()
  const navigate = useNavigate()

  const [unidadesLocales, setUnidadesLocales] = useState<UnidadApi[]>([])
  const [cargando, setCargando] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('Todos')
  const [filtroTipo, setFiltroTipo]     = useState<FiltroTipo>('Todos')
  const [alta, setAlta]   = useState<Alta | null>(null)
  const [editar, setEditar] = useState<{ unidad: UnidadApi; operacion: string; estado: EstadoUnidad; valor: string; vencimiento_documentacion: string; vin: string; numero_economico: string; marca: string; modelo: string; placas: string } | null>(null)
  const [error, setError] = useState('')
  
  const esAdmin = tieneRol(['admin']) || sesion?.roles?.includes('admin') || usuario?.rol === 'admin'

  // Lista unificada: prioriza la respuesta directa de la API, con fallback al contexto de demo
  const listaUnidades = useMemo(() => {
    if (unidadesLocales.length > 0) return unidadesLocales
    if (unidadesDemo.length > 0) return unidadesDemo
    return []
  }, [unidadesLocales, unidadesDemo])

  const cargarUnidades = useCallback(async () => {
    try {
      setCargando(true)
      const data = await getUnidades()
      if (Array.isArray(data)) {
        setUnidadesLocales(data)
      }
      void recargarUnidades()
    } catch (err) {
      console.warn('Error cargando unidades en catálogo:', err)
    } finally {
      setCargando(false)
    }
  }, [recargarUnidades])

  useEffect(() => {
    void cargarUnidades()
  }, [cargarUnidades])

  const filtered = useMemo(
    () =>
      listaUnidades.filter(
        (t) =>
          (filtroEstado === 'Todos' || t.estado === filtroEstado) &&
          (filtroTipo   === 'Todos' || t.tipo   === filtroTipo),
      ),
    [listaUnidades, filtroEstado, filtroTipo],
  )

  const ctrl = useTabla(
    filtered,
    'id_unidad',
    'asc',
    useCallback((row, col) => {
      if (col === 'costo') return row.costo_real_acumulado ?? 0
      return (row as unknown as Record<string, unknown>)[col] as string | number
    }, []),
  )

  const guardarAlta = async () => {
    if (!alta) return
    setError('')
    try {
      await crearUnidad({
        id_unidad: alta.id_unidad.trim(),
        tipo: alta.tipo,
        operacion: alta.operacion === '' ? null : alta.operacion,
        estado: alta.estado,
        fecha_alta: alta.fecha_alta,
        valor_referencia: alta.valor_referencia === '' ? null : Number(alta.valor_referencia),
        vencimiento_documentacion: alta.vencimiento_documentacion === '' ? null : alta.vencimiento_documentacion,
        vin: alta.vin === '' ? null : alta.vin,
        numero_economico: alta.numero_economico === '' ? null : alta.numero_economico,
        marca: alta.marca === '' ? null : alta.marca,
        modelo: alta.modelo === '' ? null : alta.modelo,
        placas: alta.placas === '' ? null : alta.placas,
      })
      await cargarUnidades()
      toast(`${alta.id_unidad.trim()} dada de alta en la flota`)
      setAlta(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la unidad.')
    }
  }

  const guardarEdicion = async () => {
    if (!editar) return
    setError('')
    try {
      const cambio: { operacion?: string | null; estado?: EstadoUnidad; valor_referencia?: number; vencimiento_documentacion?: string | null; vin?: string | null; numero_economico?: string | null; marca?: string | null; modelo?: string | null; placas?: string | null } = {}
      if (editar.estado !== editar.unidad.estado) cambio.estado = editar.estado
      if (editar.operacion !== (editar.unidad.operacion || '')) cambio.operacion = editar.operacion === '' ? null : editar.operacion
      if (editar.valor !== '' && Number(editar.valor) !== editar.unidad.valor_referencia) {
        cambio.valor_referencia = Number(editar.valor)
      }
      if (editar.vencimiento_documentacion !== (editar.unidad.vencimiento_documentacion ?? '')) {
        cambio.vencimiento_documentacion = editar.vencimiento_documentacion === '' ? null : editar.vencimiento_documentacion
      }
      if (editar.vin !== (editar.unidad.vin ?? '')) cambio.vin = editar.vin === '' ? null : editar.vin
      if (editar.numero_economico !== (editar.unidad.numero_economico ?? '')) cambio.numero_economico = editar.numero_economico === '' ? null : editar.numero_economico
      if (editar.marca !== (editar.unidad.marca ?? '')) cambio.marca = editar.marca === '' ? null : editar.marca
      if (editar.modelo !== (editar.unidad.modelo ?? '')) cambio.modelo = editar.modelo === '' ? null : editar.modelo
      if (editar.placas !== (editar.unidad.placas ?? '')) cambio.placas = editar.placas === '' ? null : editar.placas

      if (Object.keys(cambio).length > 0) {
        await actualizarUnidad(editar.unidad.id, cambio)
        await cargarUnidades()
        toast(`${editar.unidad.id_unidad} actualizada`)
      }
      setEditar(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la unidad.')
    }
  }

  const modal = (titulo: string, contenido: ReactNode, onGuardar: () => void, onCerrar: () => void) => (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,15,0.75)', backdropFilter: 'blur(6px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        style={{ background: '#14181D', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(243,239,231,0.15)', borderTop: '5px solid #F2620F', animation: 'fadeUp 0.2s ease' }}
      >
        <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFFFFF', margin: '0 0 14px' }}>
          {titulo}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{contenido}</div>
        {error && (
          <div role="alert" style={{ marginTop: 12, background: 'rgba(197, 48, 48, 0.2)', border: '1px solid rgba(197, 48, 48, 0.4)', color: '#FEB2B2', borderRadius: 9, padding: '12px 14px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onCerrar}
            style={{ padding: '10px 18px', background: 'rgba(243,239,231,0.08)', border: '1px solid rgba(243,239,231,0.2)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#F3EFE7', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            style={{ padding: '10px 20px', background: '#F2620F', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#16191E', cursor: 'pointer' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Catálogos" />
          <h2 style={{ ...h2Titulo, color: '#FFFFFF' }}>Gestión de Catálogos</h2>
          <p style={{ ...subTitulo, color: '#B8B2A6' }}>
            Administración centralizada de la flota de unidades y existencias límites del almacén general.
          </p>
        </div>
      </div>

      {/* Banner de Navegación Unificado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(243,239,231,0.12)', paddingBottom: 12, marginTop: 12, marginBottom: 18, animation: 'fadeUp 0.38s ease', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#F2620F' }}>
            🚚 Flota de Unidades Activas y en Taller
          </span>
          <span style={{ fontSize: 12, background: 'rgba(242,98,15,0.2)', color: '#F2620F', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
            {cargando ? 'Sincronizando...' : `${listaUnidades.length} unidades`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/compras/inventario')}
          className="hover:border-white transition-all cursor-pointer"
          style={{
            padding: '8px 14px',
            background: 'rgba(243,239,231,0.08)',
            border: '1px solid rgba(243,239,231,0.2)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            color: '#F3EFE7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>📦 Ir a Inventario y Kardex de Almacén</span>
          <span>→</span>
        </button>
      </div>

      <div data-tour="catalogo" style={{ ...card, background: '#14181D', border: '1px solid rgba(243,239,231,0.12)', padding: '14px 20px', overflowX: 'auto', animation: 'fadeUp 0.4s ease' }}>
          <TablaToolbar
            ctrl={ctrl}
            filtros={ESTADOS.map((f) => ({ value: f }))}
            filtroActivo={filtroEstado}
            onFiltro={(f) => setFiltroEstado(f as FiltroEstado)}
            rightSlot={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {TIPOS.filter(t => t !== 'Todos').map((t) => (
                  <button
                    key={t}
                    onClick={() => { setFiltroTipo(filtroTipo === t ? 'Todos' : t); ctrl.resetPage() }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: filtroTipo === t ? '#F2620F' : 'rgba(243,239,231,0.06)',
                      color: filtroTipo === t ? '#16191E' : '#D8D2C4',
                      border: filtroTipo === t ? '1px solid #F2620F' : '1px solid rgba(243,239,231,0.15)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t === 'Servicio' ? 'Servicio' : t}
                  </button>
                ))}
                {esAdmin && (
                  <button
                    onClick={() => { setError(''); setAlta({ ...altaVacia }) }}
                    style={{ padding: '9px 18px', background: '#F2620F', color: '#16191E', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,98,15,0.25)' }}
                  >
                    + Agregar unidad
                  </button>
                )}
                <button
                  onClick={() => {
                    import('../lib/csv').then(({ descargarCSV }) => {
                      const headers = ['ID Unidad', 'VIN', 'Tipo', 'Vehículo', 'Placas', 'Estado', 'Fecha de Alta', 'Valor de Referencia (MXN)', 'Costo Acumulado (MXN)']
                      const rows = listaUnidades.map(u => [
                        String(u.id_unidad),
                        String(u.vin || '-'),
                        String(u.tipo === 'Servicio' ? 'UTILITARIO' : u.tipo),
                        String(u.marca || '-'),
                        String(u.placas || '-'),
                        String(u.estado),
                        String(u.fecha_alta ?? '—'),
                        u.valor_referencia !== null ? String(u.valor_referencia) : '—',
                        String(u.costo_real_acumulado ?? 0),
                      ])
                      const filename = `Reporte_Flota_${new Date().toISOString().split('T')[0]}.csv`
                      descargarCSV(headers, rows, filename)
                      toast(`Reporte ${filename} descargado exitosamente.`)
                    })
                  }}
                  style={{
                    padding: '9px 14px',
                    background: 'rgba(243,239,231,0.06)',
                    color: '#F3EFE7',
                    border: '1px solid rgba(243,239,231,0.15)',
                    borderRadius: 8,
                    fontFamily: FD,
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ⬇️ Exportar CSV
                </button>
              </div>
            }
          />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={{ ...theadRow, color: '#C5A059', borderBottom: '2px solid rgba(197, 160, 89, 0.4)' }}>
                <SortTh col="id_unidad" label="ID Unidad"               sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ color: '#C5A059' }} />
                <SortTh col="vin"       label=" VIN"                    sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ color: '#C5A059' }} />
                <SortTh col="tipo"      label="Tipo"                    sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ color: '#C5A059' }} />
                <SortTh col="marca"     label="Vehículo"                sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ color: '#C5A059' }} />
                <SortTh col="placas"    label="Placas"                  sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ color: '#C5A059' }} />
                <SortTh col="estado"    label="Estado"                  sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ color: '#C5A059' }} />
                <SortTh col="vencimiento" label="Vigencia Trámites"     sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ color: '#C5A059' }} />
                <SortTh col="costo"     label="Costo total acumulado"   sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} style={{ textAlign: 'right', color: '#C5A059' }} />
                <th style={{ padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.4)' }} />
              </tr>
            </thead>
            <tbody>
              {ctrl.filasPagina.map((t) => {
                const c = estadoUnidadColors[t.estado] ?? estadoUnidadColors.Activo
                const semaforo = obtenerColorSemaforo(t.vencimiento_documentacion)
                return (
                  <tr key={t.id_unidad} style={{ borderBottom: '1px solid rgba(243,239,231,0.08)' }}>
                    <td style={{ ...tdCell, fontWeight: 700, color: '#FFFFFF' }}>
                      <span style={{ fontFamily: FD, fontSize: 16, color: '#FFFFFF' }}>{t.id_unidad}</span>
                    </td>
                    <td style={{ ...tdCell, color: '#B8B2A6', fontFamily: 'monospace', fontSize: 12 }}>
                      {t.vin || '—'}
                    </td>
                    <td style={{ ...tdCell, color: '#E0DDD5' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        background: t.tipo === 'Caja' || t.tipo === 'Thermo' ? 'rgba(197,160,89,0.2)' : 'rgba(242,98,15,0.2)',
                        color: t.tipo === 'Caja' || t.tipo === 'Thermo' ? '#E0C36A' : '#F2620F'
                      }}>
                        {t.tipo === 'Servicio' ? 'UTILITARIO' : t.tipo}
                      </span>
                    </td>
                    <td style={{ ...tdCell, color: '#FFFFFF' }}>
                      <span style={{ color: '#FFFFFF', fontWeight: 500 }}>{t.marca ? `${t.marca} ${t.modelo || ''}` : '—'}</span>
                      {t.numero_economico && <span style={{ fontSize: 11, color: '#C5A059', marginLeft: 4 }}>({t.numero_economico})</span>}
                    </td>
                    <td style={{ ...tdCell, color: '#E0DDD5' }}>{t.placas || '—'}</td>
                    <td style={tdCell}>
                      <span style={{ ...badge(c[0], c[1], c[2]), fontWeight: 700 }}>{t.estado}</span>
                    </td>
                    <td style={tdCell}>
                      {semaforo ? (
                        <span style={{ ...badge(semaforo.bg, semaforo.fg), fontWeight: 700, fontSize: 11 }}>
                          {semaforo.label}
                        </span>
                      ) : (
                        <span style={{ color: '#7C7567', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', fontWeight: 700, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                      {t.costo_real_acumulado ? fmt(t.costo_real_acumulado) : '—'}
                    </td>
                    <td style={{ ...tdCell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {esAdmin && (
                        <button
                          onClick={() => { setError(''); setEditar({ unidad: t, operacion: t.operacion ?? '', estado: t.estado, valor: t.valor_referencia === null ? '' : String(t.valor_referencia), vencimiento_documentacion: t.vencimiento_documentacion ?? '', vin: t.vin ?? '', numero_economico: t.numero_economico ?? '', marca: t.marca ?? '', modelo: t.modelo ?? '', placas: t.placas ?? '' }) }}
                          className="hover:border-white transition-all cursor-pointer"
                          style={{ padding: '7px 12px', background: 'rgba(243,239,231,0.08)', border: '1px solid rgba(243,239,231,0.2)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#F3EFE7', cursor: 'pointer', marginRight: 8 }}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/ficha/' + t.id_unidad)}
                        className="hover:border-[#C5A059] transition-all cursor-pointer"
                        style={{ padding: '7px 12px', background: 'rgba(197,160,89,0.15)', border: '1px solid rgba(197,160,89,0.4)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#E0C36A', cursor: 'pointer' }}
                      >
                        Ver ficha
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {ctrl.total === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 30, color: '#B8B2A6', fontSize: 14 }}>
              <Camion stroke="#F2620F" strokeWidth={2.5} style={{ width: 120, opacity: 0.6 }} />
              {cargando ? 'Sincronizando flota de unidades...' : 'Aún no hay unidades en esta vista.'}
            </div>
          )}

          <TablaFooter ctrl={ctrl} />
        </div>

      {/* Modals */}
      {alta &&
        modal(
          'Agregar unidad',
          <>
            <label style={etiqueta}>
              ID de la unidad
              <input style={campo} value={alta.id_unidad} placeholder="Ej. WH130" onChange={(e) => setAlta({ ...alta, id_unidad: e.target.value })} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Tipo
                <select style={campo} value={alta.tipo} onChange={(e) => setAlta({ ...alta, tipo: e.target.value as TipoUnidad })}>
                  <option value="Tractor">Tractor</option>
                  <option value="Caja">Caja</option>
                  <option value="Thermo">Thermo</option>
                  <option value="Servicio">UTILITARIO</option>
                </select>
              </label>
              <label style={etiqueta}>
                Operación
                <select style={campo} value={alta.operacion} onChange={(e) => setAlta({ ...alta, operacion: e.target.value })}>
                  <option value="">Seleccione...</option>
                  <option value="LOCAL">LOCAL</option>
                  <option value="CRUCE">CRUCE</option>
                  <option value="UTILITARIO">UTILITARIO</option>
                  <option value="FORANEO">FORANEO</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Estado
                <select style={campo} value={alta.estado} onChange={(e) => setAlta({ ...alta, estado: e.target.value as EstadoUnidad })}>
                  <option value="Activo">Activo</option>
                  <option value="Yonke">Yonke</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Vendido">Vendido</option>
                </select>
              </label>
            </div>
            <label style={etiqueta}>
              Fecha de alta
              <input type="date" style={campo} value={alta.fecha_alta} onChange={(e) => setAlta({ ...alta, fecha_alta: e.target.value })} />
            </label>
            <label style={etiqueta}>
                Vencimiento Documentos (Placas/Vigencia)
                <input type="date" style={campo} value={alta.vencimiento_documentacion} onChange={(e) => setAlta({ ...alta, vencimiento_documentacion: e.target.value })} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  VIN
                  <input type="text" style={campo} value={alta.vin} onChange={(e) => setAlta({ ...alta, vin: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Número Económico
                  <input type="text" style={campo} value={alta.numero_economico} onChange={(e) => setAlta({ ...alta, numero_economico: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Marca
                  <input type="text" style={campo} value={alta.marca} onChange={(e) => setAlta({ ...alta, marca: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Modelo
                  <input type="text" style={campo} value={alta.modelo} onChange={(e) => setAlta({ ...alta, modelo: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Placas
                  <input type="text" style={campo} value={alta.placas} onChange={(e) => setAlta({ ...alta, placas: e.target.value })} />
                </label>
              </div>

            <label style={etiqueta}>
              Valor de referencia (MXN)
              <input type="number" min={0} placeholder="Opcional; sin él el veredicto queda pendiente" style={campo} value={alta.valor_referencia} onChange={(e) => setAlta({ ...alta, valor_referencia: e.target.value })} />
            </label>
          </>,
          () => void guardarAlta(),
          () => setAlta(null),
        )}

      {editar &&
        modal(
          'Editar ' + editar.unidad.id_unidad,
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Operación
                <select style={campo} value={editar.operacion} onChange={(e) => setEditar({ ...editar, operacion: e.target.value })}>
                  <option value="">Seleccione...</option>
                  <option value="LOCAL">LOCAL</option>
                  <option value="CRUCE">CRUCE</option>
                  <option value="UTILITARIO">UTILITARIO</option>
                  <option value="FORANEO">FORANEO</option>
                </select>
              </label>
              <label style={etiqueta}>
                Estado
                <select style={campo} value={editar.estado} onChange={(e) => setEditar({ ...editar, estado: e.target.value as EstadoUnidad })}>
                  <option value="Activo">Activo</option>
                  <option value="Yonke">Yonke</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Vendido">Vendido</option>
                </select>
              </label>
            </div>
            <label style={etiqueta}>
                Vencimiento Documentos (Placas/Vigencia)
                <input type="date" style={campo} value={editar.vencimiento_documentacion} onChange={(e) => setEditar({ ...editar, vencimiento_documentacion: e.target.value })} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  VIN
                  <input type="text" style={campo} value={editar.vin || ''} onChange={(e) => setEditar({ ...editar, vin: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Número Económico
                  <input type="text" style={campo} value={editar.numero_economico || ''} onChange={(e) => setEditar({ ...editar, numero_economico: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Marca
                  <input type="text" style={campo} value={editar.marca || ''} onChange={(e) => setEditar({ ...editar, marca: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Modelo
                  <input type="text" style={campo} value={editar.modelo || ''} onChange={(e) => setEditar({ ...editar, modelo: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Placas
                  <input type="text" style={campo} value={editar.placas || ''} onChange={(e) => setEditar({ ...editar, placas: e.target.value })} />
                </label>
              </div>

            <label style={etiqueta}>
              Valor de referencia (MXN)
              <input type="number" min={0} style={campo} value={editar.valor} onChange={(e) => setEditar({ ...editar, valor: e.target.value })} />
            </label>
          </>,
          () => void guardarEdicion(),
          () => setEditar(null),
        )}
    </>
  )
}
