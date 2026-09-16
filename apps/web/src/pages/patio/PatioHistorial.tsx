import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  Search, 
  ArrowUpRight, 
  FileText, 
  Wifi, 
  Truck, 
  RotateCw, 
  Home,
  LayoutGrid,
  List,
  Calendar,
  User,
  Gauge,
  Fuel,
  CheckCircle2,
  Lock,
  Shield,
  Plus
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { 
  obtenerHistorialLocal, 
  inicializarDatosMuestraPatio 
} from '../../lib/inspeccionStorage'
import type { OrdenInspeccionForm } from '../../lib/inspeccionSchema'
import { OrdenInspeccionModal } from '../../components/patio/OrdenInspeccionModal'

export const PatioHistorial: React.FC = () => {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const esSupervisor = usuario?.rol === 'admin' || usuario?.rol === 'taller'

  const [inspecciones, setInspecciones] = useState<OrdenInspeccionForm[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Critico' | 'Warning' | 'Bueno'>('Todos')
  const [modoVista, setModoVista] = useState<'tarjetas' | 'tabla'>('tarjetas')
  const [verTodaFlota, setVerTodaFlota] = useState(false)
  const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState<OrdenInspeccionForm | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)

  const cargarDatos = async () => {
    setCargando(true)
    try {
      await inicializarDatosMuestraPatio()
      const lista = await obtenerHistorialLocal()
      setInspecciones(lista)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // 1. Filtrado de Privacidad RBAC (Historial Propio obligatorio para operadores)
  const inspeccionesBase = inspecciones.filter(item => {
    // Los supervisores pueden alternar entre su historial propio o toda la flota
    if (esSupervisor && verTodaFlota) return true
    if (!usuario) return false

    const userNum = (usuario.numeroEmpleado || '').trim().toLowerCase()
    const userName = (usuario.nombre || '').trim().toLowerCase()

    const itemOpId = (item.operador_id || '').trim().toLowerCase()
    const itemOpNombre = (item.operador_nombre || '').trim().toLowerCase()

    // REGLA DE SEGURIDAD ESTRICTA:
    // Si el nombre del operador en el documento no coincide con el usuario autenticado, NO pertenece a su historial personal
    if (userName && itemOpNombre && userName !== itemOpNombre) {
      return false
    }

    // Pertenencia validada por coincidencia estricta de nombre o número de empleado
    const coincideNombre = Boolean(userName && itemOpNombre && userName === itemOpNombre)
    const coincideId = Boolean(userNum && itemOpId && userNum === itemOpId)

    return coincideNombre || coincideId
  })

  // 2. Filtrado reactivo por texto y estado sobre las inspecciones autorizadas
  const inspeccionesFiltradas = inspeccionesBase.filter(item => {
    const coincideTexto = 
      item.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.unidad_id.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.operador_nombre.toLowerCase().includes(busqueda.toLowerCase())

    if (!coincideTexto) return false

    const tieneCritico = item.items.some(i => i.estado === 'Crítico')
    const tieneRegular = item.items.some(i => i.estado === 'Regular')

    if (filtroEstado === 'Critico') return tieneCritico
    if (filtroEstado === 'Warning') return tieneRegular && !tieneCritico
    if (filtroEstado === 'Bueno') return !tieneCritico && !tieneRegular

    return true
  })

  return (
    <div className="space-y-5 pb-10">
      {/* Encabezado con Indicador de Privacidad RBAC */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded bg-[#F2620F]/15 text-[#F2620F] px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Lock className="h-3 w-3" />
              {esSupervisor && verTodaFlota ? 'Modo Supervisión: Flota Completa' : `Historial Personal (${usuario?.nombre || 'Operador'})`}
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              {usuario?.numeroEmpleado || 'EMP-409'}
            </span>
            <span className="rounded bg-[#3FA65C]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#3FA65C] flex items-center gap-1">
              <Wifi className="h-3 w-3" /> Offline / IndexDB
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-white">
            {esSupervisor && verTodaFlota ? 'Bitácora Global de Inspecciones de Patio' : 'Mi Historial de Inspecciones'}
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            {esSupervisor && verTodaFlota
              ? 'Supervisión de todas las órdenes de inspección física registradas por la flota.'
              : `Registro personal de folios emitidos y fallas reportadas por ti en patio.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {esSupervisor && (
            <button
              type="button"
              onClick={() => setVerTodaFlota(!verTodaFlota)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                verTodaFlota
                  ? 'border-[#F2620F] bg-[#F2620F]/15 text-[#F2620F]'
                  : 'border-[rgba(243,239,231,0.15)] bg-[#14181D] text-[#B8B2A6] hover:text-white'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>{verTodaFlota ? 'Solo Mis Folios' : 'Ver Toda la Flota'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/patio/inspeccion')}
            className="flex items-center gap-1.5 rounded-xl bg-[#F2620F] px-3.5 py-2 text-xs font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva Inspección</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/patio')}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-[#C5A059] hover:text-[#C5A059] transition-all cursor-pointer"
          >
            <Home className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Menú Patio</span>
          </button>
          <button
            type="button"
            onClick={cargarDatos}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#F2620F]" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de KPIs de Resumen Personal de Bitácora para iPad Pro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/90 p-3.5 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed']">
            {esSupervisor && verTodaFlota ? 'Total Hojas de Patio' : 'Mis Hojas Registradas'}
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-2xl font-black text-white font-mono">
            {inspeccionesBase.length}
          </div>
        </div>
        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/90 p-3.5 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#3FA65C] font-['Barlow_Condensed']">
            {esSupervisor && verTodaFlota ? 'Flota Aprobada 100%' : 'Mis Folios Conformes'}
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-2xl font-black text-[#3FA65C] font-mono">
            {inspeccionesBase.filter(i => !i.items.some(it => it.estado === 'Crítico' || it.estado === 'Regular')).length}
          </div>
        </div>
        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/90 p-3.5 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] font-['Barlow_Condensed']">
            {esSupervisor && verTodaFlota ? 'Con Advertencias' : 'Mis Warnings'}
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-2xl font-black text-[#C5A059] font-mono">
            {inspeccionesBase.filter(i => i.items.some(it => it.estado === 'Regular') && !i.items.some(it => it.estado === 'Crítico')).length}
          </div>
        </div>
        <div className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/90 p-3.5 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#F2620F] font-['Barlow_Condensed']">
            {esSupervisor && verTodaFlota ? 'Fallas Críticas (OT)' : 'Mis Alertas a Taller'}
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-2xl font-black text-[#F2620F] font-mono">
            {inspeccionesBase.filter(i => i.items.some(it => it.estado === 'Crítico')).length}
          </div>
        </div>
      </div>

      {/* Panel de Búsqueda, Filtros y Conmutador de Vista */}
      <div className="rounded-3xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#B8B2A6]" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por folio o tracto (WH-101)..."
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 w-full lg:w-auto">
            {/* Filtros de Estado */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFiltroEstado('Todos')}
                className={`h-9 rounded-xl px-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filtroEstado === 'Todos'
                    ? 'bg-[#F2620F] text-[#16191E] shadow-md'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                }`}
              >
                Todos ({inspeccionesBase.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('Critico')}
                className={`h-9 rounded-xl px-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filtroEstado === 'Critico'
                    ? 'bg-[#F2620F] text-[#16191E] shadow-md'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-[#F2620F]'
                }`}
              >
                Críticos
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('Warning')}
                className={`h-9 rounded-xl px-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filtroEstado === 'Warning'
                    ? 'bg-[#C5A059] text-[#16191E] shadow-md'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-[#C5A059]'
                }`}
              >
                Warnings
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('Bueno')}
                className={`h-9 rounded-xl px-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filtroEstado === 'Bueno'
                    ? 'bg-[#3FA65C] text-[#16191E] shadow-md'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-[#3FA65C]'
                }`}
              >
                Conformes
              </button>
            </div>

            {/* Conmutador de Vista: Tarjetas Táctiles vs Tabla */}
            <div className="flex items-center gap-1 rounded-xl bg-[#0f0f10] p-1 border border-[rgba(243,239,231,0.08)]">
              <button
                type="button"
                onClick={() => setModoVista('tarjetas')}
                className={`flex items-center gap-1 h-8 px-2.5 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase transition-all cursor-pointer ${
                  modoVista === 'tarjetas'
                    ? 'bg-[#C5A059] text-[#16191E] shadow-sm'
                    : 'text-[#B8B2A6] hover:text-white'
                }`}
                title="Vista Cuadrícula Táctil (iPad Pro)"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVista('tabla')}
                className={`flex items-center gap-1 h-8 px-2.5 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase transition-all cursor-pointer ${
                  modoVista === 'tabla'
                    ? 'bg-[#C5A059] text-[#16191E] shadow-sm'
                    : 'text-[#B8B2A6] hover:text-white'
                }`}
                title="Vista Tabla Densa"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* VISTA 1: TARJETAS TÁCTILES EN 2 COLUMNAS (iPad Pro Landscape & Portrait) */}
        {modoVista === 'tarjetas' ? (
          <div className="space-y-4">
            {cargando ? (
              <div className="py-12 text-center text-xs text-[#B8B2A6]">
                Cargando hojas de inspección desde IndexedDB...
              </div>
            ) : inspeccionesFiltradas.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-[rgba(243,239,231,0.1)] p-8">
                <FileText className="h-8 w-8 text-[#C5A059]/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No tienes inspecciones registradas con este criterio.</p>
                <p className="text-xs text-[#B8B2A6] mt-1">
                  Las órdenes que tú emitas como {usuario?.nombre || 'operador'} aparecerán aquí para tu consulta personal.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/patio/inspeccion')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#F2620F] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Realizar Primera Inspección</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inspeccionesFiltradas.map((item, idx) => {
                  const tieneCritico = item.items.some(i => i.estado === 'Crítico')
                  const tieneRegular = item.items.some(i => i.estado === 'Regular')
                  const fallas = item.items.filter(i => i.estado !== 'Bueno')

                  const estadoTexto = tieneCritico
                    ? 'Inactivo en Reparación'
                    : tieneRegular
                    ? 'Activo con Warning'
                    : 'Activo al 100%'

                  const badgeBorder = tieneCritico
                    ? 'border-[#F2620F]/50 bg-[#B4430A]/15 text-[#F2620F]'
                    : tieneRegular
                    ? 'border-[#C5A059]/50 bg-[#C5A059]/15 text-[#C5A059]'
                    : 'border-[#3FA65C]/50 bg-[#3FA65C]/15 text-[#3FA65C]'

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#101317] p-4 flex flex-col justify-between hover:border-[rgba(243,239,231,0.2)] transition-all shadow-md"
                    >
                      <div>
                        {/* Cabecera de la Tarjeta */}
                        <div className="flex items-start justify-between gap-2 border-b border-[rgba(243,239,231,0.08)] pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#F2620F]">
                              {item.folio}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-['Barlow_Condensed'] text-xl font-bold text-white flex items-center gap-1.5">
                                <Truck className="h-4 w-4 text-[#C5A059]" />
                                {item.unidad_id}
                              </span>
                              <span className="rounded bg-[#1C1C1C] px-2 py-0.5 text-[11px] text-[#B8B2A6]">
                                {item.tipo_operacion}
                              </span>
                            </div>
                          </div>

                          <span className={`rounded-xl px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wide border ${badgeBorder}`}>
                            {estadoTexto}
                          </span>
                        </div>

                        {/* Datos Operativos */}
                        <div className="grid grid-cols-2 gap-2.5 py-3 text-xs border-b border-[rgba(243,239,231,0.06)]">
                          <div className="flex items-center gap-1.5 text-[#B8B2A6]">
                            <User className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span className="text-white truncate font-medium">{item.operador_nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#B8B2A6]">
                            <Calendar className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span className="truncate">{item.fecha.substring(0, 16)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#B8B2A6]">
                            <Gauge className="h-3.5 w-3.5 text-[#F2620F]" />
                            <span className="font-['Barlow_Condensed'] font-bold text-white tabular-nums">
                              {item.tipo_vehiculo === 'caja' ? 'N/A (Traila)' : `${(item.kilometraje || 0).toLocaleString()} KM`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#B8B2A6]">
                            <Fuel className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span>Tanque: <strong className="text-white">{item.nivel_combustible}</strong></span>
                          </div>
                        </div>

                        {/* Extracto de Fallas si Existen */}
                        {fallas.length > 0 ? (
                          <div className="py-2.5 space-y-1">
                            <span className="text-[10px] font-['Barlow_Condensed'] font-bold uppercase text-[#B8B2A6]">
                              {fallas.length} anomalía(s) reportada(s):
                            </span>
                            <div className="space-y-1">
                              {fallas.slice(0, 2).map((f, fIdx) => (
                                <div key={fIdx} className="text-[11px] text-[#f3f4f6]/80 flex items-center justify-between rounded bg-[#1C1C1C] px-2 py-0.5">
                                  <span className="truncate max-w-[180px]">{f.componente}</span>
                                  <span className={`font-['Barlow_Condensed'] text-[10px] font-bold ${
                                    f.estado === 'Crítico' ? 'text-[#F2620F]' : 'text-[#C5A059]'
                                  }`}>
                                    [{f.estado}]
                                  </span>
                                </div>
                              ))}
                              {fallas.length > 2 && (
                                <div className="text-[10px] text-[#B8B2A6] italic">
                                  +{fallas.length - 2} componente(s) más...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="py-2.5 flex items-center gap-1.5 text-[11px] text-[#3FA65C]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Inspección limpia · Unidad liberada al 100%</span>
                          </div>
                        )}
                      </div>

                      {/* Botón Táctil de Acción (Thumb Zone 44px) */}
                      <div className="pt-3 mt-2 border-t border-[rgba(243,239,231,0.08)]">
                        <button
                          type="button"
                          onClick={() => {
                            setInspeccionSeleccionada(item)
                            setModalAbierto(true)
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1C1C1C] border border-[rgba(243,239,231,0.15)] h-11 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
                        >
                          <FileText className="h-4 w-4 text-[#C5A059]" />
                          <span>Ver Mi Hoja Oficial</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* VISTA 2: TABLA DENSA INDUSTRIAL */
          <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
            <table className="w-full text-left text-xs text-[#f3f4f6]">
              <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
                <tr>
                  <th className="px-4 py-3">Folio Oficial</th>
                  <th className="px-4 py-3">Fecha de Captura</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Operador</th>
                  <th className="px-4 py-3">Odómetro</th>
                  <th className="px-4 py-3">Estado de Salud</th>
                  <th className="px-4 py-3">Alerta OT</th>
                  <th className="px-4 py-3 text-right">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
                {cargando ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                      Cargando repositorio IndexedDB...
                    </td>
                  </tr>
                ) : inspeccionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                      No se encontraron órdenes de inspección que coincidan con tu búsqueda.
                    </td>
                  </tr>
                ) : (
                  inspeccionesFiltradas.map((item, idx) => {
                    const tieneCritico = item.items.some(i => i.estado === 'Crítico')
                    const tieneRegular = item.items.some(i => i.estado === 'Regular')

                    const estadoTexto = tieneCritico
                      ? 'Inactivo en Reparación'
                      : tieneRegular
                      ? 'Activo con Warning'
                      : 'Activo al 100%'

                    const badgeColor = tieneCritico
                      ? 'bg-[#B4430A]/20 text-[#F2620F]'
                      : tieneRegular
                      ? 'bg-[#E0C36A]/20 text-[#E0C36A]'
                      : 'bg-[#3FA65C]/20 text-[#3FA65C]'

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#F2620F]">
                          {item.folio}
                        </td>
                        <td className="px-4 py-3 text-[#B8B2A6]">
                          {item.fecha}
                        </td>
                        <td className="px-4 py-3 font-bold text-white">
                          <span className="inline-flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5 text-[#C5A059]" />
                            {item.unidad_id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{item.operador_nombre}</div>
                          <div className="text-[10px] text-[#B8B2A6]">{item.licencia}</div>
                        </td>
                        <td className="px-4 py-3 font-['Barlow_Condensed'] font-bold tabular-nums text-white">
                          {item.tipo_vehiculo === 'caja' ? 'N/A (Traila)' : `${(item.kilometraje || 0).toLocaleString()} KM`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${badgeColor}`}>
                            {estadoTexto}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.requiere_ot ? (
                            <span className="font-['Barlow_Condensed'] font-semibold text-[#F2620F] uppercase">
                              ⚠️ Alerta Taller
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#3FA65C]">
                              ✓ Sin Falla
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setInspeccionSeleccionada(item)
                              setModalAbierto(true)
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span>Ver Hoja</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal del Documento Oficial */}
      <OrdenInspeccionModal
        inspeccion={inspeccionSeleccionada}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
      />
    </div>
  )
}

export default PatioHistorial
