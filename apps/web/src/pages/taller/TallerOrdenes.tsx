import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  FileText, 
  Play, 
  RotateCw,
  ShieldAlert,
  Eye,
  Camera,
  X,
  ChevronRight,
  ClipboardList,
  ShoppingCart
} from 'lucide-react'
import { 
  getOrdenesTrabajo, 
  getTaller, 
  type OrdenTrabajoApi, 
  type RegistroTallerApi 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { OrdenTrabajoModal, type DetalleOT } from '../../components/taller/OrdenTrabajoModal'
import { TallerLiberacionModal } from '../../components/taller/TallerLiberacionModal'
import { OrdenInspeccionModal } from '../../components/patio/OrdenInspeccionModal'
import { obtenerHistorialLocal } from '../../lib/inspeccionStorage'
import type { OrdenInspeccionForm } from '../../lib/inspeccionSchema'

export const TallerOrdenes: React.FC = () => {
  const navigate = useNavigate()
  const { agregarToast } = useUiStore()

  // Pestaña activa: OTs tradicionales vs Bandeja de Alertas de Patio
  const [pestañaActiva, setPestañaActiva] = useState<'ots' | 'alertas'>('ots')

  // Datos de OTs del Backend
  const [ordenes, setOrdenes] = useState<OrdenTrabajoApi[]>([])
  const [registrosTaller, setRegistrosTaller] = useState<RegistroTallerApi[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todas' | 'Activa' | 'En Proceso' | 'Liberada' | 'Liberada Parcial'>('Todas')
  const [cargando, setCargando] = useState(true)

  // Datos de Inspecciones con Warning/Fallas de Patio (IndexedDB)
  const [inspeccionesConFalla, setInspeccionesConFalla] = useState<OrdenInspeccionForm[]>([])
  const [filtroAlerta, setFiltroAlerta] = useState<'Todas' | 'Crítico' | 'Regular' | 'Pendientes' | 'Atendidas'>('Todas')
  const [busquedaAlerta, setBusquedaAlerta] = useState('')

  // Modales
  const [otSeleccionada, setOtSeleccionada] = useState<DetalleOT | null>(null)
  const [modalOTAbierto, setModalOTAbierto] = useState(false)

  const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState<OrdenInspeccionForm | null>(null)
  const [modalInspeccionAbierto, setModalInspeccionAbierto] = useState(false)

  const [fotoPreview, setFotoPreview] = useState<{ url: string; titulo: string } | null>(null)

  const [registroALiberar, setRegistroALiberar] = useState<{
    id: number
    unidad_id: number
    id_unidad: string
    diagnostico: string
    folio_ot?: string
  } | null>(null)
  const [modalLiberarAbierto, setModalLiberarAbierto] = useState(false)

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [listaOTs, listaTaller, historialPatio] = await Promise.all([
        getOrdenesTrabajo().catch(() => []),
        getTaller().catch(() => []),
        obtenerHistorialLocal().catch(() => []),
      ])
      setOrdenes(listaOTs)
      setRegistrosTaller(listaTaller)

      // Filtrar únicamente inspecciones que contengan anomalías (Regular o Crítico)
      const fallas = historialPatio.filter(insp => 
        insp.items.some(item => item.estado !== 'Bueno')
      )
      setInspeccionesConFalla(fallas)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Consolidar OTs y registros de taller para la vista principal
  const ordenesConsolidadas: DetalleOT[] = ordenes.map((ot, idx) => {
    const regAsociado = registrosTaller.find(r => r.unidad_id === ot.unidad?.id)
    const estadoCalculado = regAsociado?.tipo_liberacion === 'Parcial'
      ? 'Liberada Parcial'
      : regAsociado?.tipo_liberacion === 'Total'
      ? 'Liberada'
      : ot.estado === 'Activa' && regAsociado?.fecha_ingreso
      ? 'En Proceso'
      : 'Activa'

    return {
      id: ot.id,
      folio: ot.folio || `OT-${String(ot.id).padStart(5, '0')}`,
      tipo: ot.diagnostico.toLowerCase().includes('preventiv') ? 'Preventivo' : 'Correctivo',
      estado: estadoCalculado as DetalleOT['estado'],
      unidad_id: ot.unidad?.id_unidad || `WH-${100 + idx}`,
      tipo_unidad: ot.unidad?.tipo || 'Tractor',
      responsable_nombre: ot.responsable?.nombre || 'Carlos Méndez',
      responsable_rol: ot.responsable?.rol || 'Mecánico A',
      diagnostico: ot.diagnostico,
      fecha_ingreso: ot.created_at ? ot.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
      fecha_salida: regAsociado?.fecha_salida,
      costo_taller: regAsociado?.costo_taller || 0,
      materiales: ot.materiales || [],
      pendientes: regAsociado?.pendientes || undefined,
    }
  })

  // Métricas rápidas OTs
  const totalActivas = ordenesConsolidadas.filter(o => o.estado === 'Activa').length
  const totalEnProceso = ordenesConsolidadas.filter(o => o.estado === 'En Proceso').length
  const totalParciales = ordenesConsolidadas.filter(o => o.estado === 'Liberada Parcial').length
  const totalLiberadas = ordenesConsolidadas.filter(o => o.estado === 'Liberada').length

  // Métricas rápidas Alertas de Patio
  const totalAlertas = inspeccionesConFalla.length
  const alertasPendientes = inspeccionesConFalla.filter(a => !a.ot_generada).length
  const alertasCriticas = inspeccionesConFalla.filter(a => a.items.some(i => i.estado === 'Crítico')).length
  const alertasWarnings = inspeccionesConFalla.filter(a => a.items.every(i => i.estado !== 'Crítico') && a.items.some(i => i.estado === 'Regular')).length
  const alertasAtendidas = inspeccionesConFalla.filter(a => !!a.ot_generada).length

  // Filtrado de OTs
  const ordenesFiltradas = ordenesConsolidadas.filter(ot => {
    const coincideTexto = 
      ot.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      ot.unidad_id.toLowerCase().includes(busqueda.toLowerCase()) ||
      ot.responsable_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ot.diagnostico.toLowerCase().includes(busqueda.toLowerCase())

    if (!coincideTexto) return false
    if (filtroEstado !== 'Todas' && ot.estado !== filtroEstado) return false
    return true
  })

  // Filtrado de Alertas de Patio
  const alertasFiltradas = inspeccionesConFalla.filter(insp => {
    const coincideTexto = 
      insp.folio.toLowerCase().includes(busquedaAlerta.toLowerCase()) ||
      insp.unidad_id.toLowerCase().includes(busquedaAlerta.toLowerCase()) ||
      insp.operador_nombre.toLowerCase().includes(busquedaAlerta.toLowerCase()) ||
      insp.items.some(i => i.componente.toLowerCase().includes(busquedaAlerta.toLowerCase()) || (i.observacion && i.observacion.toLowerCase().includes(busquedaAlerta.toLowerCase())))

    if (!coincideTexto) return false

    if (filtroAlerta === 'Crítico') {
      return insp.items.some(i => i.estado === 'Crítico')
    }
    if (filtroAlerta === 'Regular') {
      return insp.items.every(i => i.estado !== 'Crítico') && insp.items.some(i => i.estado === 'Regular')
    }
    if (filtroAlerta === 'Pendientes') {
      return !insp.ot_generada
    }
    if (filtroAlerta === 'Atendidas') {
      return !!insp.ot_generada
    }
    return true
  })

  const cambiarAEnProceso = (ot: DetalleOT) => {
    agregarToast({
      tipo: 'info',
      titulo: 'OT en Proceso',
      mensaje: `La unidad ${ot.unidad_id} inició labores mecánicas bajo la orden ${ot.folio}.`,
    })
    setOrdenes(prev =>
      prev.map(item =>
        item.id === ot.id ? { ...item, estado: 'En Proceso' } : item
      )
    )
  }

  const abrirLiberacion = (ot: DetalleOT) => {
    const reg = registrosTaller.find(r => r.id_unidad === ot.unidad_id) || {
      id: ot.id,
      unidad_id: 1,
      id_unidad: ot.unidad_id,
      diagnostico: ot.diagnostico,
      folio_ot: ot.folio,
    }
    setRegistroALiberar(reg)
    setModalLiberarAbierto(true)
  }

  // Navegar a Apertura de OT precargando la alerta de patio
  const generarOTDesdeAlerta = (insp: OrdenInspeccionForm) => {
    const fallas = insp.items
      .filter(i => i.estado !== 'Bueno')
      .map(i => `${i.componente} (${i.estado}): ${i.observacion || 'Falla en patio'}`)
      .join(' | ')

    const tieneCritico = insp.items.some(i => i.estado === 'Crítico')

    navigate('/taller/ingreso', {
      state: {
        id_unidad: insp.unidad_id,
        criticidad: tieneCritico ? 'Crítico' : 'Media',
        diagnostico: `[Inspección Patio ${insp.folio} - Operador ${insp.operador_nombre}]: ${fallas}`,
        folioInspeccion: insp.folio,
        operadorNombre: insp.operador_nombre,
        tipoInspeccion: insp.tipo_inspeccion,
        itemsDefectuosos: insp.items.filter(i => i.estado !== 'Bueno'),
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Taller
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Motor de Transición de Flota
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Gestión de Taller y Alertas de Patio
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Monitoreo en tiempo real de órdenes activas y recepción inmediata de inspecciones de operadores con anomalías.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarDatos}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#B8B2A6]" />
            <span>Refrescar</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/taller/ingreso')}
            className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Nueva OT Manual</span>
          </button>
        </div>
      </div>

      {/* Banner de Aviso de Alertas de Patio (Visible si hay alertas pendientes y estamos en la pestaña de OTs) */}
      {alertasPendientes > 0 && pestañaActiva === 'ots' && (
        <div className="rounded-2xl border border-[#F2620F]/50 bg-[#B4430A]/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-lg shadow-[#F2620F]/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2620F]/25 text-[#F2620F] shrink-0 animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-white">
                <span>Atención Taller: {alertasPendientes} {alertasPendientes === 1 ? 'Unidad con Alerta' : 'Unidades con Alertas'} en Patio</span>
                <span className="rounded bg-[#F2620F] px-2 py-0.2 text-[10px] font-black text-[#16191E]">URGENTE</span>
              </div>
              <p className="text-xs text-[#B8B2A6] mt-0.5">
                Se detectaron inspecciones físicas recientes con componentes críticos o desgastes que requieren apertura de OT correctiva.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPestañaActiva('alertas')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2620F] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer shrink-0"
          >
            <span>Ver Bandeja de Patio ({alertasPendientes})</span>
            <ChevronRight className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Selector de Pestañas Principales */}
      <div className="flex items-center gap-3 border-b border-[rgba(243,239,231,0.1)] pb-2">
        <button
          type="button"
          onClick={() => setPestañaActiva('ots')}
          className={`relative flex items-center gap-2 px-4 py-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            pestañaActiva === 'ots'
              ? 'text-[#F2620F] after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-0.5 after:bg-[#F2620F]'
              : 'text-[#B8B2A6] hover:text-white'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Órdenes de Trabajo Activas</span>
          <span className="ml-1 rounded-full bg-[#1C1C1C] px-2 py-0.5 text-xs text-white border border-[rgba(243,239,231,0.1)]">
            {ordenesConsolidadas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestañaActiva('alertas')}
          className={`relative flex items-center gap-2 px-4 py-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            pestañaActiva === 'alertas'
              ? 'text-[#F2620F] after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-0.5 after:bg-[#F2620F]'
              : 'text-[#B8B2A6] hover:text-white'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Bandeja de Alertas de Patio</span>
          {alertasPendientes > 0 ? (
            <span className="ml-1 rounded-full bg-[#F2620F] px-2 py-0.5 text-xs font-black text-[#16191E] animate-pulse">
              {alertasPendientes}
            </span>
          ) : (
            <span className="ml-1 rounded-full bg-[#1C1C1C] px-2 py-0.5 text-xs text-[#B8B2A6] border border-[rgba(243,239,231,0.1)]">
              {totalAlertas}
            </span>
          )}
        </button>
      </div>

      {/* VISTA 1: ÓRDENES DE TRABAJO (OTs) */}
      {pestañaActiva === 'ots' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tarjetas de Métricas Rápidas */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>OTs Activas (Ingresos)</span>
                <Clock className="h-4 w-4 text-[#F2620F]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-white tabular-nums">
                {totalActivas}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">Esperando asignación</div>
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>En Proceso Mecánico</span>
                <Wrench className="h-4 w-4 text-[#C5A059]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#C5A059] tabular-nums">
                {totalEnProceso}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">Unidades bloqueadas</div>
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>Liberadas con Warning</span>
                <AlertTriangle className="h-4 w-4 text-[#E0C36A]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#E0C36A] tabular-nums">
                {totalParciales}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">Pendientes por retomar</div>
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>Liberadas al 100%</span>
                <CheckCircle2 className="h-4 w-4 text-[#3FA65C]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#3FA65C] tabular-nums">
                {totalLiberadas}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">Restauradas a servicio</div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B8B2A6]" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por folio (OT-0001), unidad (WH-101) o mecánico..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(['Todas', 'Activa', 'En Proceso', 'Liberada Parcial', 'Liberada'] as const).map(estado => (
                  <button
                    key={estado}
                    type="button"
                    onClick={() => setFiltroEstado(estado)}
                    className={`rounded-lg px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      filtroEstado === estado
                        ? 'bg-[#F2620F] text-[#16191E]'
                        : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla Densa de Órdenes de Trabajo */}
            <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
              <table className="w-full text-left text-xs text-[#f3f4f6]">
                <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
                  <tr>
                    <th className="px-4 py-3">Folio OT</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3">Mecánico</th>
                    <th className="px-4 py-3">Diagnóstico</th>
                    <th className="px-4 py-3">Estatus OT</th>
                    <th className="px-4 py-3">Salud Flota</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
                  {cargando ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                        Cargando órdenes de trabajo desde el backend local...
                      </td>
                    </tr>
                  ) : ordenesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                        No se encontraron órdenes de trabajo para los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    ordenesFiltradas.map(ot => {
                      const esParcial = ot.estado === 'Liberada Parcial'
                      const esLiberada = ot.estado === 'Liberada'

                      const estadoSalud = esLiberada
                        ? 'Activo 100%'
                        : esParcial
                        ? 'Warning'
                        : 'Reparación'

                      const colorSalud = esLiberada
                        ? 'bg-[#3FA65C]/20 text-[#3FA65C]'
                        : esParcial
                        ? 'bg-[#E0C36A]/20 text-[#E0C36A]'
                        : 'bg-[#F2620F]/20 text-[#F2620F]'

                      return (
                        <tr key={ot.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#F2620F]">
                            {ot.folio}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase ${
                                ot.tipo === 'Correctivo'
                                  ? 'bg-[#F2620F]/15 text-[#F2620F]'
                                  : 'bg-[#3FA65C]/15 text-[#3FA65C]'
                              }`}
                            >
                              {ot.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            <span className="inline-flex items-center gap-1.5">
                              <Truck className="h-3.5 w-3.5 text-[#C5A059]" />
                              {ot.unidad_id}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white truncate max-w-[120px]">
                              {ot.responsable_nombre}
                            </div>
                            <div className="text-[10px] text-[#B8B2A6]">{ot.responsable_rol}</div>
                          </td>
                          <td className="px-4 py-3 max-w-[220px]">
                            <p className="line-clamp-1 text-[11px] text-[#B8B2A6]" title={ot.diagnostico}>
                              {ot.diagnostico}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${
                                ot.estado === 'Liberada'
                                  ? 'bg-[#3FA65C]/20 text-[#3FA65C]'
                                  : ot.estado === 'Liberada Parcial'
                                  ? 'bg-[#E0C36A]/20 text-[#E0C36A]'
                                  : ot.estado === 'En Proceso'
                                  ? 'bg-[#C5A059]/20 text-[#C5A059]'
                                  : 'bg-[#1C1C1C] text-[#f3f4f6]'
                              }`}
                            >
                              {ot.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold ${colorSalud}`}>
                              {estadoSalud}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setOtSeleccionada(ot)
                                  setModalOTAbierto(true)
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2 py-1 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
                                title="Ver Orden de Trabajo Oficial"
                              >
                                <FileText className="h-3 w-3" />
                                <span>Ver OT</span>
                              </button>

                              {(ot.estado === 'Activa' || ot.estado === 'En Proceso') && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/taller/refacciones?ot_id=${ot.id}`)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#F2620F]/40 bg-[#F2620F]/15 px-2 py-1 text-xs font-semibold text-[#F2620F] hover:bg-[#F2620F] hover:text-[#16191E] transition-all cursor-pointer"
                                  title="Solicitar Refacciones para esta OT"
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  <span>Piezas</span>
                                </button>
                              )}

                              {ot.estado === 'Activa' && (
                                <button
                                  type="button"
                                  onClick={() => cambiarAEnProceso(ot)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#C5A059] px-2 py-1 text-xs font-semibold font-['Barlow_Condensed'] uppercase text-[#16191E] hover:bg-[#a88744] transition-all cursor-pointer"
                                  title="Iniciar trabajos"
                                >
                                  <Play className="h-3 w-3" />
                                  <span>En Proceso</span>
                                </button>
                              )}

                              {(ot.estado === 'Activa' || ot.estado === 'En Proceso') && (
                                <button
                                  type="button"
                                  onClick={() => abrirLiberacion(ot)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#3FA65C] px-2 py-1 text-xs font-semibold font-['Barlow_Condensed'] uppercase text-[#16191E] hover:bg-[#2e7d44] transition-all cursor-pointer"
                                  title="Liberar Unidad"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Liberar</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: BANDEJA DE ALERTAS DE PATIO (INSPECCIONES CON WARNINGS/FALLAS) */}
      {pestañaActiva === 'alertas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Métricas de Alertas de Patio */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>Pendientes de Atención</span>
                <Clock className="h-4 w-4 text-[#F2620F]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#F2620F] tabular-nums">
                {alertasPendientes}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">Requieren apertura de OT</div>
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>Fallas Críticas (Detenidas)</span>
                <ShieldAlert className="h-4 w-4 text-[#F2620F]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-white tabular-nums">
                {alertasCriticas}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">Riesgo inminente o varadura</div>
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>Desgaste / Warnings</span>
                <AlertTriangle className="h-4 w-4 text-[#E0C36A]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#E0C36A] tabular-nums">
                {alertasWarnings}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">Atención preventiva recomendada</div>
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
              <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
                <span>Atendidas con OT</span>
                <CheckCircle2 className="h-4 w-4 text-[#3FA65C]" />
              </div>
              <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#3FA65C] tabular-nums">
                {alertasAtendidas}
              </div>
              <div className="text-[10px] text-[#B8B2A6] mt-0.5">En proceso o resueltas en taller</div>
            </div>
          </div>

          {/* Filtros de la Bandeja de Patio */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B8B2A6]" />
                <input
                  type="text"
                  value={busquedaAlerta}
                  onChange={e => setBusquedaAlerta(e.target.value)}
                  placeholder="Buscar por folio de inspección, unidad, operador o componente..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(['Todas', 'Pendientes', 'Crítico', 'Regular', 'Atendidas'] as const).map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroAlerta(tipo)}
                    className={`rounded-lg px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      filtroAlerta === tipo
                        ? 'bg-[#F2620F] text-[#16191E]'
                        : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                    }`}
                  >
                    {tipo === 'Crítico' ? '🚨 Críticas' : tipo === 'Regular' ? '⚠️ Warnings' : tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Tarjetas de Alertas de Patio */}
            {cargando ? (
              <div className="py-12 text-center text-xs text-[#B8B2A6]">
                Cargando inspecciones de patio...
              </div>
            ) : alertasFiltradas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[rgba(243,239,231,0.15)] p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3FA65C]/15 text-[#3FA65C]">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-['Barlow_Condensed'] text-lg font-bold uppercase tracking-wider text-white">
                  Patio Sin Alertas Pendientes
                </h3>
                <p className="text-xs text-[#B8B2A6] max-w-md mx-auto">
                  No se registran inspecciones físicas de operadores con anomalías o todas las unidades ya cuentan con su Orden de Trabajo asignada.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {alertasFiltradas.map(insp => {
                  const tieneCritico = insp.items.some(i => i.estado === 'Crítico')
                  const itemsFalla = insp.items.filter(i => i.estado !== 'Bueno')

                  return (
                    <div
                      key={insp.folio}
                      className={`rounded-xl border p-4.5 transition-all bg-[#1C1C1C]/60 ${
                        tieneCritico 
                          ? 'border-[#F2620F]/40 hover:border-[#F2620F]' 
                          : 'border-[#E0C36A]/30 hover:border-[#E0C36A]'
                      }`}
                    >
                      {/* Cabecera de la Alerta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(243,239,231,0.06)] pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-black ${
                            tieneCritico ? 'bg-[#F2620F]/20 text-[#F2620F]' : 'bg-[#E0C36A]/20 text-[#E0C36A]'
                          }`}>
                            <Truck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-['Barlow_Condensed'] text-lg font-black uppercase text-white tracking-wide">
                                {insp.unidad_id}
                              </span>
                              <span className="rounded bg-[#14181D] px-2 py-0.5 text-[10px] font-bold text-[#B8B2A6] border border-[rgba(243,239,231,0.1)]">
                                {insp.tipo_operacion}
                              </span>
                              <span className="font-mono text-xs text-[#C5A059] font-bold">
                                {insp.tipo_vehiculo === 'caja' ? 'Traila / Semirremolque' : `${(insp.kilometraje || 0).toLocaleString()} KM`}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#B8B2A6] mt-0.5">
                              Inspección <span className="font-mono text-white font-bold">{insp.folio}</span> • Operador: <span className="text-white font-semibold">{insp.operador_nombre}</span> ({insp.operador_id}) • {insp.fecha}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {tieneCritico ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#F2620F]/20 border border-[#F2620F]/40 px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#F2620F]">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Falla Crítica (Unidad Detenida)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#E0C36A]/20 border border-[#E0C36A]/40 px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#E0C36A]">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Warning / Desgaste</span>
                            </span>
                          )}

                          {insp.ot_generada ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#3FA65C]/20 border border-[#3FA65C]/40 px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#3FA65C]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>OT: {insp.ot_generada}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#14181D] border border-[rgba(243,239,231,0.15)] px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#F2620F]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Pendiente de OT</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Componentes en Falla Reportados */}
                      <div className="mt-3.5 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8B2A6]">
                          Componentes Afectados ({itemsFalla.length}):
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {itemsFalla.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between rounded-lg border border-[rgba(243,239,231,0.06)] bg-[#14181D]/90 p-2.5 text-xs"
                            >
                              <div className="space-y-1 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">
                                    {item.componente}
                                  </span>
                                  <span
                                    className={`rounded px-1.5 py-0.2 font-['Barlow_Condensed'] text-[9px] font-bold uppercase ${
                                      item.estado === 'Crítico'
                                        ? 'bg-[#F2620F]/20 text-[#F2620F]'
                                        : 'bg-[#E0C36A]/20 text-[#E0C36A]'
                                    }`}
                                  >
                                    {item.estado}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#B8B2A6]">
                                  {item.observacion || 'Sin observación específica capturada.'}
                                </p>
                              </div>

                              {item.foto_url && (
                                <button
                                  type="button"
                                  onClick={() => setFotoPreview({ url: item.foto_url!, titulo: `${item.componente} - ${insp.unidad_id}` })}
                                  className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] overflow-hidden hover:border-[#F2620F] transition-all cursor-pointer"
                                  title="Ver foto de evidencia"
                                >
                                  <img 
                                    src={item.foto_url} 
                                    alt="Evidencia" 
                                    className="h-full w-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="h-4 w-4 text-white" />
                                  </div>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Observaciones generales del operador */}
                      {insp.observaciones_generales && (
                        <div className="mt-3 rounded-lg bg-[#14181D]/50 border border-[rgba(243,239,231,0.05)] p-2.5 text-[11px] text-[#B8B2A6]">
                          <span className="font-bold text-white uppercase text-[10px] mr-1.5">Nota del Operador:</span>
                          "{insp.observaciones_generales}"
                        </div>
                      )}

                      {/* Barra de Acciones */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[rgba(243,239,231,0.06)]">
                        <button
                          type="button"
                          onClick={() => {
                            setInspeccionSeleccionada(insp)
                            setModalInspeccionAbierto(true)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-1.5 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-[#C5A059]" />
                          <span>Ver Hoja de Inspección Completa</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {!insp.ot_generada ? (
                            <button
                              type="button"
                              onClick={() => generarOTDesdeAlerta(insp)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2620F] px-4 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-md shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5 stroke-[3]" />
                              <span>Generar OT Correctiva</span>
                            </button>
                          ) : (
                            <div className="text-xs text-[#3FA65C] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Atendida con OT: {insp.ot_generada}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Oficial de la OT */}
      <OrdenTrabajoModal
        ot={otSeleccionada}
        abierto={modalOTAbierto}
        alCerrar={() => setModalOTAbierto(false)}
      />

      {/* Modal Oficial de la Inspección de Patio */}
      <OrdenInspeccionModal
        inspeccion={inspeccionSeleccionada}
        abierto={modalInspeccionAbierto}
        alCerrar={() => setModalInspeccionAbierto(false)}
      />

      {/* Modal de Liberación de Taller */}
      <TallerLiberacionModal
        registroTaller={registroALiberar}
        abierto={modalLiberarAbierto}
        alCerrar={() => setModalLiberarAbierto(false)}
        alExito={cargarDatos}
      />

      {/* Lightbox / Preview de Foto de Evidencia */}
      {fotoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full rounded-2xl border border-[rgba(243,239,231,0.2)] bg-[#14181D] p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] pb-3">
              <div className="flex items-center gap-2 text-white font-['Barlow_Condensed'] font-bold text-base uppercase">
                <Camera className="h-4 w-4 text-[#F2620F]" />
                <span>{fotoPreview.titulo}</span>
              </div>
              <button
                type="button"
                onClick={() => setFotoPreview(null)}
                className="rounded-lg p-1 text-[#B8B2A6] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl bg-black flex items-center justify-center max-h-[70vh]">
              <img 
                src={fotoPreview.url} 
                alt="Foto Evidencia Ampliada" 
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setFotoPreview(null)}
                className="rounded-lg bg-[#1C1C1C] border border-[rgba(243,239,231,0.15)] px-4 py-1.5 text-xs font-semibold text-white hover:border-white transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TallerOrdenes
