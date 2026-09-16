import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { 
  Wrench, 
  Truck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Send, 
  ShieldAlert, 
  FileCheck, 
  CheckSquare, 
  Check, 
  ClipboardList,
  ShoppingCart
} from 'lucide-react'
import { 
  getUnidades, 
  getResponsablesTaller, 
  crearOrdenTrabajo, 
  registrarIngreso, 
  type UnidadApi, 
  type ResponsableTaller 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { OrdenTrabajoModal, type DetalleOT } from '../../components/taller/OrdenTrabajoModal'
import { obtenerHistorialLocal, marcarInspeccionAtendida } from '../../lib/inspeccionStorage'
import { 
  ARTICULOS_INSPECCION_TALLER, 
  DISPOSICIONES_SALIDA_NO_CONFORME, 
  mapearFallasPatioAArticulosTaller, 
  type ReporteMecanicoTallerForm, 
  type FilaReparacionRefaccion, 
  type DisposicionSalida 
} from '../../lib/tallerSchema'

interface StatePreCargaOT {
  unidadId?: number
  id_unidad?: string
  criticidad?: 'Rápida' | 'Media' | 'Crítico'
  diagnostico?: string
  folioInspeccion?: string
  operadorNombre?: string
  tipoInspeccion?: 'PreTrip' | 'PostTrip'
  itemsDefectuosos?: Array<{ id: string; componente?: string; sistema?: string; observacion?: string }>
}


export const TallerNuevaOT: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const stateOrigen = location.state as StatePreCargaOT | undefined

  const { agregarToast } = useUiStore()

  // Catálogos
  const [tipoOT, setTipoOT] = useState<'Correctivo' | 'Preventivo'>('Correctivo')
  const [unidades, setUnidades] = useState<UnidadApi[]>([])
  const [responsables, setResponsables] = useState<ResponsableTaller[]>([])
  const [unidadId, setUnidadId] = useState<number>(1)
  const [responsableId, setResponsableId] = useState<number>(1)
  const [criticidad, setCriticidad] = useState<'Rápida' | 'Media' | 'Crítico'>('Media')
  
  // Encabezado oficial del formato físico Nº 0801
  const [numeroReporteFisico, setNumeroReporteFisico] = useState('0801')
  const [fechaEntrega, setFechaEntrega] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().substring(0, 10)
  })
  const [fueraDeServicio, setFueraDeServicio] = useState({
    uso_grua: false,
    reparo_mecanico: true
  })
  const [warning, setWarning] = useState(false)
  const [multa, setMulta] = useState(false)
  const [tipoInspeccionViaje, setTipoInspeccionViaje] = useState<'PreTrip' | 'PostTrip'>('PreTrip')
  const [nombreOperador, setNombreOperador] = useState('Juan Hernández')
  const [cliente, setCliente] = useState('Warhorse Cargo')

  // Matriz de 32 Artículos de Inspección de Tractor
  const [articulosDefectuosos, setArticulosDefectuosos] = useState<string[]>([])
  
  // Síntoma de Falla
  const [diagnostico, setDiagnostico] = useState('')

  // Control de Salidas No Conformes (Disposición)
  const [disposicionSalida, setDisposicionSalida] = useState<DisposicionSalida>('Reparación de unidad')
  const [firmaEncargadoTaller, setFirmaEncargadoTaller] = useState('Ing. Roberto Salazar (Jefe de Taller)')

  // Fechas y Horas de Reparación
  const [fechaInicioReparacion, setFechaInicioReparacion] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [fechaTerminoReparacion, setFechaTerminoReparacion] = useState(() => {
    const now = new Date()
    now.setHours(now.getHours() + 4)
    return now.toISOString().slice(0, 16)
  })

  // Tabla de Reparaciones Realizadas + Refacciones + Origen (Almacén / Compras / Yonke)
  const [filasReparaciones, setFilasReparaciones] = useState<FilaReparacionRefaccion[]>([
    {
      id: 'rep-1',
      reparacion_realizada: 'Inspección técnica y diagnóstico inicial en rampa',
      refacciones: '',
      cantidad: 1,
      origen: 'Almacén',
      costo_unitario: 0
    }
  ])

  // Dictamen y 3 Firmas de Conformidad
  const [declaraciones, setDeclaraciones] = useState({
    condicion_satisfactoria: true,
    defectos_corregidos: true,
    defectos_pendientes_seguros: false
  })
  const [firmas, setFirmas] = useState({
    mecanico: 'Carlos Méndez',
    operador: 'Juan Hernández',
    jefe_taller: 'Ing. Roberto Salazar'
  })

  const [cargando, setCargando] = useState(false)
  const [alertasPatio, setAlertasPatio] = useState<Array<{ 
    folio: string; 
    unidad: string; 
    falla: string;
    items?: Array<{ id: string; componente?: string; sistema?: string; observacion?: string }>
    operador?: string
  }>>([])
  const [folioInspeccionOrigen, setFolioInspeccionOrigen] = useState<string | null>(null)

  const [otEmitida, setOtEmitida] = useState<DetalleOT | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  // Cargar catálogos
  useEffect(() => {
    async function cargarCatalogos() {
      const fallbackUnidades: UnidadApi[] = [
        { id: 1, id_unidad: 'WH-101', tipo: 'Tractor', estado: 'Activo', valor_referencia: 850000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 2, id_unidad: 'WH-104', tipo: 'Tractor', estado: 'Activo', valor_referencia: 920000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 3, id_unidad: 'WH-125', tipo: 'Tractor', estado: 'Activo', valor_referencia: 780000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 4, id_unidad: 'CJ-502', tipo: 'Caja', estado: 'Activo', valor_referencia: 320000, costo_real_acumulado: 0, candidata_reincidencia: false },
        { id: 5, id_unidad: 'TH-201', tipo: 'Thermo', estado: 'Activo', valor_referencia: 450000, costo_real_acumulado: 0, candidata_reincidencia: false },
      ]

      try {
        const [listaUnidades, listaResp] = await Promise.all([
          getUnidades().catch(() => fallbackUnidades),
          getResponsablesTaller().catch(() => [
            { id: 1, nombre: 'Carlos Méndez', tipo: 'Tracto' as const, rol: 'Mecánico A' as const },
            { id: 2, nombre: 'Luis Morales', tipo: 'Tracto' as const, rol: 'Mecánico B' as const },
            { id: 3, nombre: 'Héctor Gómez', tipo: 'Caja' as const, rol: 'Auxiliar' as const },
          ]),
        ])
        const finalUnidades = listaUnidades && listaUnidades.length > 0 ? listaUnidades : fallbackUnidades
        setUnidades(finalUnidades)

        setResponsables(listaResp)
        if (listaResp.length > 0) {
          setResponsableId(listaResp[0].id)
          setFirmas(prev => ({ ...prev, mecanico: listaResp[0].nombre }))
        }

        // Precarga de State si se invocó desde alertas de patio o desde TallerOrdenes
        if (stateOrigen) {
          if (stateOrigen.folioInspeccion) {
            setFolioInspeccionOrigen(stateOrigen.folioInspeccion)
          }
          if (stateOrigen.criticidad) {
            setCriticidad(stateOrigen.criticidad)
            if (stateOrigen.criticidad === 'Crítico') {
              setFueraDeServicio(f => ({ ...f, reparo_mecanico: true }))
            }
          }
          if (stateOrigen.diagnostico) {
            setDiagnostico(stateOrigen.diagnostico)
          }
          if (stateOrigen.operadorNombre) {
            setNombreOperador(stateOrigen.operadorNombre)
            setFirmas(prev => ({ ...prev, operador: stateOrigen.operadorNombre || '' }))
          }
          if (stateOrigen.tipoInspeccion) {
            setTipoInspeccionViaje(stateOrigen.tipoInspeccion)
          }

          // Pre-marcar automáticamente las casillas de los 32 artículos si vienen items defectuosos
          if (stateOrigen.itemsDefectuosos && stateOrigen.itemsDefectuosos.length > 0) {
            const itemsMapeados = mapearFallasPatioAArticulosTaller(stateOrigen.itemsDefectuosos)
            if (itemsMapeados.length > 0) {
              setArticulosDefectuosos(itemsMapeados)
            }
          }

          setTipoOT('Correctivo')

          let matchedUnidad = finalUnidades.find((u: UnidadApi) => u.id === stateOrigen.unidadId)
          if (!matchedUnidad && stateOrigen.id_unidad) {
            matchedUnidad = finalUnidades.find((u: UnidadApi) => u.id_unidad.toLowerCase() === stateOrigen.id_unidad?.toLowerCase())
          }
          if (matchedUnidad) {
            setUnidadId(matchedUnidad.id)
          } else if (finalUnidades.length > 0) {
            setUnidadId(finalUnidades[0].id)
          }
        } else {
          if (finalUnidades.length > 0) setUnidadId(finalUnidades[0].id)
        }

        // Buscar alertas recientes en el almacenamiento de patio
        const historialPatio = await obtenerHistorialLocal()
        const fallasEncontradas: Array<{ 
          folio: string; 
          unidad: string; 
          falla: string;
          items: Array<{ id: string; componente?: string; sistema?: string; observacion?: string }>
          operador?: string
        }> = []

        historialPatio.forEach(h => {
          if (!h.ot_generada) {
            const itemsFalla = h.items.filter(item => item.estado !== 'Bueno')
            if (itemsFalla.length > 0) {
              fallasEncontradas.push({
                folio: h.folio,
                unidad: h.unidad_id,
                falla: itemsFalla.map(i => `${i.componente}: ${i.observacion || 'Falla'}`).join(' | '),
                items: itemsFalla,
                operador: h.operador_nombre
              })
            }
          }
        })
        setAlertasPatio(fallasEncontradas)
      } catch (err) {
        console.error('Error al cargar catálogos de taller', err)
      }
    }
    cargarCatalogos()
  }, [])

  const precargarAlertaPatio = (alerta: { 
    folio: string; 
    unidad: string; 
    falla: string;
    items?: Array<{ id: string; componente?: string; sistema?: string; observacion?: string }>
    operador?: string
  }) => {
    const uni = unidades.find(u => u.id_unidad === alerta.unidad)
    if (uni) setUnidadId(uni.id)
    setTipoOT('Correctivo')
    setCriticidad('Media')
    setFolioInspeccionOrigen(alerta.folio)
    setDiagnostico(`[Derivado de Inspección ${alerta.folio} - Operador ${alerta.operador || 'No especificado'}]: ${alerta.falla}`)
    
    if (alerta.operador) {
      setNombreOperador(alerta.operador)
      setFirmas(prev => ({ ...prev, operador: alerta.operador || '' }))
    }

    if (alerta.items && alerta.items.length > 0) {
      const articulosMapeados = mapearFallasPatioAArticulosTaller(alerta.items)
      if (articulosMapeados.length > 0) {
        setArticulosDefectuosos(articulosMapeados)
      }
    }

    agregarToast({
      tipo: 'info',
      titulo: 'Alerta Precargada',
      mensaje: `Se vincularon los datos de la falla de patio y se pre-marcaron los artículos correspondientes para la unidad ${alerta.unidad}.`,
    })
  }

  // Manejo del checkbox de artículos defectuosos (32 ítems)
  const alternarArticulo = (articuloId: string) => {
    setArticulosDefectuosos(prev => 
      prev.includes(articuloId)
        ? prev.filter(id => id !== articuloId)
        : [...prev, articuloId]
    )
  }

  // Manejo de filas de reparación / refacción
  const agregarFilaReparacion = () => {
    const nuevaFila: FilaReparacionRefaccion = {
      id: `rep-${Date.now()}`,
      reparacion_realizada: '',
      refacciones: '',
      cantidad: 1,
      origen: 'Almacén',
      costo_unitario: 0
    }
    setFilasReparaciones(prev => [...prev, nuevaFila])
  }

  const actualizarFilaReparacion = <K extends keyof FilaReparacionRefaccion>(id: string, campo: K, valor: FilaReparacionRefaccion[K]) => {
    setFilasReparaciones(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }

  const eliminarFilaReparacion = (id: string) => {
    if (filasReparaciones.length === 1) return
    setFilasReparaciones(prev => prev.filter(f => f.id !== id))
  }


  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagnostico.trim()) {
      agregarToast({
        tipo: 'error',
        titulo: 'Datos Incompletos',
        mensaje: 'Debes describir el síntoma de falla o diagnóstico técnico.',
      })
      return
    }

    setCargando(true)
    try {
      const unidadSeleccionada = unidades.find(u => u.id === unidadId)
      const responsableSeleccionado = responsables.find(r => r.id === responsableId)

      // Consolidar el Reporte Mecánico con la estructura completa del documento físico
      const reporteMecanicoData: ReporteMecanicoTallerForm = {
        numero_reporte_fisico: numeroReporteFisico,
        fecha_entrega: fechaEntrega,
        fuera_de_servicio: fueraDeServicio,
        warning,
        multa,
        numero_unidad: unidadSeleccionada?.id_unidad || 'WH-101',
        tipo_inspeccion: tipoInspeccionViaje,
        nombre_operador: nombreOperador,
        cliente,
        nombre_mecanico: responsableSeleccionado?.nombre || firmas.mecanico,
        articulos_defectuosos: articulosDefectuosos,
        detalles_sintoma_falla: diagnostico,
        disposicion_salida: disposicionSalida,
        firma_encargado_taller: firmaEncargadoTaller,
        fecha_inicio_reparacion: fechaInicioReparacion,
        fecha_termino_reparacion: fechaTerminoReparacion,
        filas_reparaciones: filasReparaciones,
        declaraciones_liberacion: declaraciones,
        firmas
      }

      // 1. Crear Orden de Trabajo en el backend CI4
      const respOT = await crearOrdenTrabajo({
        unidad_id: unidadId,
        responsable_id: responsableId,
        categoria: tipoOT,
        diagnostico,
      })

      // 2. Registrar Ingreso a Taller para la máquina de estados de flota
      await registrarIngreso({
        unidad_id: unidadId,
        fecha_ingreso: new Date().toISOString().substring(0, 10),
        diagnostico,
        criticidad,
      }).catch(() => {})

      const folioGenerado = respOT.folio || `OT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

      // 3. Vincular inspección de patio si proviene de una alerta
      if (folioInspeccionOrigen) {
        await marcarInspeccionAtendida(folioInspeccionOrigen, folioGenerado).catch(() => {})
      }

      const detalleEmitido: DetalleOT = {
        id: respOT.id || Date.now(),
        folio: folioGenerado,
        tipo: tipoOT,
        estado: 'Activa',
        unidad_id: unidadSeleccionada?.id_unidad || 'WH-101',
        tipo_unidad: unidadSeleccionada?.tipo || 'Tractor',
        responsable_nombre: responsableSeleccionado?.nombre || firmas.mecanico,
        responsable_rol: responsableSeleccionado?.rol || 'Mecánico A',
        diagnostico,
        criticidad,
        fecha_ingreso: new Date().toISOString().substring(0, 10),
        costo_taller: 0,
        reporte_mecanico: reporteMecanicoData
      }

      setOtEmitida(detalleEmitido)
      setModalAbierto(true)

      agregarToast({
        tipo: 'success',
        titulo: 'OT y Reporte Emitido',
        mensaje: `Se generó la Orden ${folioGenerado} con formato oficial № ${numeroReporteFisico}.`,
      })
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Crear OT',
        mensaje: err instanceof Error ? err.message : 'Error al conectar con la API de taller.',
      })
    } finally {
      setCargando(false)
    }
  }

  // Agrupar los 32 artículos por columna (8 items por columna)
  const columna1 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 1)
  const columna2 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 2)
  const columna3 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 3)
  const columna4 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 4)

  return (
    <div className="space-y-6">
      {/* Encabezado Superior */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/taller/ordenes')}
            className="inline-flex items-center gap-1.5 text-xs text-[#B8B2A6] hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a la Cola de OTs</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Taller
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Formato Oficial № {numeroReporteFisico}
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Reporte del Mecánico sobre la Inspección del Tractor
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Homologado con el formato físico oficial de taller. Conexión directa a inventario de almacén y requisiciones a compras.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-right">
            <span className="text-[10px] text-[#B8B2A6] uppercase tracking-wider block">Folio Físico Oficial</span>
            <span className="font-['Barlow_Condensed'] text-lg font-black text-[#F2620F] tracking-wide">
              № {numeroReporteFisico}
            </span>
          </div>
        </div>
      </div>

      {/* Banner de Inspección de Patio Vinculada */}
      {folioInspeccionOrigen && (
        <div className="rounded-2xl border border-[#F2620F]/50 bg-[#F2620F]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F]/20 text-[#F2620F] shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-white">
                OT Correctiva Vinculada a Inspección de Patio
              </div>
              <p className="text-xs text-[#B8B2A6]">
                Folio de inspección origen: <span className="font-mono text-[#F2620F] font-bold">{folioInspeccionOrigen}</span>. Los artículos defectuosos reportados por el operador fueron pre-marcados automáticamente en la lista de inspección.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFolioInspeccionOrigen(null)}
            className="text-xs text-[#B8B2A6] hover:text-white underline cursor-pointer self-start sm:self-auto"
          >
            Desvincular Folio
          </button>
        </div>
      )}

      {/* Alertas de Patio Recientes (Precarga 1-Click) */}
      {!folioInspeccionOrigen && alertasPatio.length > 0 && (
        <div className="rounded-2xl border border-[#F2620F]/30 bg-[#B4430A]/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#F2620F]">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h4 className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider">
              Alertas Recientes de Patio Detectadas ({alertasPatio.length})
            </h4>
          </div>
          <p className="text-xs text-[#B8B2A6]">
            Unidades que concluyeron su inspección física con anomalías. Carga sus datos y pre-marca sus casillas con 1 clic:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {alertasPatio.map((alerta, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] font-bold text-white">
                    <Truck className="h-3.5 w-3.5 text-[#F2620F]" />
                    <span>{alerta.unidad}</span>
                    <span className="text-[10px] text-[#C5A059]">({alerta.folio})</span>
                    {alerta.operador && <span className="text-[10px] text-[#B8B2A6]">| Op: {alerta.operador}</span>}
                  </div>
                  <div className="text-[11px] text-[#B8B2A6] mt-0.5 line-clamp-1">{alerta.falla}</div>
                </div>
                <button
                  type="button"
                  onClick={() => precargarAlertaPatio(alerta)}
                  className="rounded-lg bg-[#F2620F] px-2.5 py-1 font-['Barlow_Condensed'] text-[11px] font-bold uppercase text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer shrink-0 ml-2"
                >
                  Cargar OT
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario Principal de la Orden de Trabajo */}
      <form onSubmit={manejarEnvio} className="space-y-6">

        {/* ========================================================================= */}
        {/* SECCIÓN 1: DATOS GENERALES Y ENCABEZADO OFICIAL */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(243,239,231,0.08)] pb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <FileCheck className="h-5 w-5 text-[#F2620F]" />
              <h2 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-white">
                1. Encabezado Oficial y Datos de la Unidad
              </h2>
            </div>
            
            {/* Toggle Tipo OT */}
            <div className="flex items-center gap-1.5 bg-[#1C1C1C] p-1 rounded-xl border border-[rgba(243,239,231,0.1)]">
              <button
                type="button"
                onClick={() => setTipoOT('Correctivo')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tipoOT === 'Correctivo' ? 'bg-[#F2620F] text-white' : 'text-[#B8B2A6] hover:text-white'
                }`}
              >
                OT Correctiva
              </button>
              <button
                type="button"
                onClick={() => setTipoOT('Preventivo')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tipoOT === 'Preventivo' ? 'bg-[#3FA65C] text-white' : 'text-[#B8B2A6] hover:text-white'
                }`}
              >
                OT Preventiva
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Folio Físico */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                № de Reporte Físico
              </label>
              <input
                type="text"
                value={numeroReporteFisico}
                onChange={e => setNumeroReporteFisico(e.target.value)}
                placeholder="0801"
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-mono text-sm font-bold text-[#F2620F] focus:border-[#F2620F] focus:outline-none"
              />
            </div>

            {/* Fecha de Entrega */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Fecha de Entrega Estimada
              </label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={e => setFechaEntrega(e.target.value)}
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>

            {/* Unidad Destino */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Unidad (Tractor / Camión)
              </label>
              <select
                value={unidadId}
                onChange={e => setUnidadId(Number(e.target.value))}
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
              >
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.id_unidad} — {u.tipo} ({u.estado})
                  </option>
                ))}
              </select>
            </div>

            {/* Mecánico Responsable */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Mecánico Asignado
              </label>
              <select
                value={responsableId}
                onChange={e => {
                  const id = Number(e.target.value)
                  setResponsableId(id)
                  const r = responsables.find(x => x.id === id)
                  if (r) setFirmas(f => ({ ...f, mecanico: r.nombre }))
                }}
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#F2620F] focus:outline-none"
              >
                {responsables.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} ({r.rol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Inspección de Viaje (PreTrip / PostTrip) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Inspección de Viaje
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoInspeccionViaje('PreTrip')}
                  className={`py-2 px-3 rounded-xl border font-['Barlow_Condensed'] text-xs font-bold uppercase transition-all cursor-pointer ${
                    tipoInspeccionViaje === 'PreTrip'
                      ? 'border-[#F2620F] bg-[#F2620F]/20 text-[#F2620F]'
                      : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                  }`}
                >
                  Pre-Trip
                </button>
                <button
                  type="button"
                  onClick={() => setTipoInspeccionViaje('PostTrip')}
                  className={`py-2 px-3 rounded-xl border font-['Barlow_Condensed'] text-xs font-bold uppercase transition-all cursor-pointer ${
                    tipoInspeccionViaje === 'PostTrip'
                      ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059]'
                      : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                  }`}
                >
                  Post-Trip
                </button>
              </div>
            </div>

            {/* Operador */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Nombre del Operador
              </label>
              <input
                type="text"
                value={nombreOperador}
                onChange={e => {
                  setNombreOperador(e.target.value)
                  setFirmas(f => ({ ...f, operador: e.target.value }))
                }}
                placeholder="Nombre del conductor"
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Cliente / Cuenta
              </label>
              <input
                type="text"
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                placeholder="Warhorse Cargo"
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>
          </div>

          {/* Recuadro Fuera de Servicio, Warning y Multa */}
          <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/70 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cuadro Fuera de Servicio */}
              <div className="space-y-2 col-span-1 sm:col-span-2 border-b sm:border-b-0 sm:border-r border-[rgba(243,239,231,0.1)] pb-3 sm:pb-0 sm:pr-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F2620F] block">
                  Cuadro: Fuera de Servicio
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-[#14181D] p-2 border border-[rgba(243,239,231,0.06)]">
                    <span className="text-xs text-[#B8B2A6]">Uso de Grúa:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFueraDeServicio(prev => ({ ...prev, uso_grua: true }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          fueraDeServicio.uso_grua ? 'bg-[#F2620F] text-white' : 'bg-white/5 text-[#B8B2A6]'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setFueraDeServicio(prev => ({ ...prev, uso_grua: false }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          !fueraDeServicio.uso_grua ? 'bg-white/20 text-white' : 'bg-white/5 text-[#B8B2A6]'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#14181D] p-2 border border-[rgba(243,239,231,0.06)]">
                    <span className="text-xs text-[#B8B2A6]">Reparó Mecánico:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFueraDeServicio(prev => ({ ...prev, reparo_mecanico: true }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          fueraDeServicio.reparo_mecanico ? 'bg-[#3FA65C] text-white' : 'bg-white/5 text-[#B8B2A6]'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setFueraDeServicio(prev => ({ ...prev, reparo_mecanico: false }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          !fueraDeServicio.reparo_mecanico ? 'bg-white/20 text-white' : 'bg-white/5 text-[#B8B2A6]'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-center justify-between rounded-xl bg-[#14181D] p-3 border border-[rgba(243,239,231,0.06)]">
                <div>
                  <div className="text-xs font-bold text-white">¿Aplica Warning?</div>
                  <div className="text-[10px] text-[#B8B2A6]">Alerta en bitácora</div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setWarning(true)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                      warning ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-[#B8B2A6]'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarning(false)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                      !warning ? 'bg-white/20 text-white' : 'bg-white/5 text-[#B8B2A6]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Multa */}
              <div className="flex items-center justify-between rounded-xl bg-[#14181D] p-3 border border-[rgba(243,239,231,0.06)]">
                <div>
                  <div className="text-xs font-bold text-white">¿Involucra Multa?</div>
                  <div className="text-[10px] text-[#B8B2A6]">Infracción vial</div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMulta(true)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                      multa ? 'bg-[#B4430A] text-white' : 'bg-white/5 text-[#B8B2A6]'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setMulta(false)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                      !multa ? 'bg-white/20 text-white' : 'bg-white/5 text-[#B8B2A6]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 2: MATRIZ DE 32 ARTÍCULOS DEFECTUOSOS (4 COLUMNAS) */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(243,239,231,0.08)] pb-4 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-[#F2620F]" />
                <h2 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-white">
                  2. Lista de Artículos para Marcar los que Tienen Defecto
                </h2>
              </div>
              <p className="text-xs text-[#B8B2A6] mt-0.5">
                Formato oficial de 32 componentes. Marca con una cruz o casilla los artículos que requieran atención.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#F2620F]/20 px-2.5 py-1 font-mono text-xs font-bold text-[#F2620F]">
                {articulosDefectuosos.length} marcados
              </span>
              {articulosDefectuosos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setArticulosDefectuosos([])}
                  className="text-xs text-[#B8B2A6] hover:text-white underline cursor-pointer"
                >
                  Limpiar todos
                </button>
              )}
            </div>
          </div>

          {/* Cuadrícula de 4 Columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Columna 1 */}
            <div className="space-y-2 rounded-xl bg-[#1C1C1C]/50 p-3 border border-[rgba(243,239,231,0.05)]">
              <div className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#C5A059] border-b border-white/5 pb-1">
                Columna 1
              </div>
              {columna1.map(art => {
                const marcado = articulosDefectuosos.includes(art.id)
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => alternarArticulo(art.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-all cursor-pointer ${
                      marcado
                        ? 'bg-[#F2620F]/20 border border-[#F2620F]/60 text-white font-semibold'
                        : 'bg-[#14181D] hover:bg-[#20252C] text-[#B8B2A6] border border-transparent'
                    }`}
                  >
                    <span>{art.etiqueta}</span>
                    <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ml-1.5 ${
                      marcado ? 'bg-[#F2620F] text-white' : 'border border-[rgba(243,239,231,0.3)] bg-[#1C1C1C]'
                    }`}>
                      {marcado && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Columna 2 */}
            <div className="space-y-2 rounded-xl bg-[#1C1C1C]/50 p-3 border border-[rgba(243,239,231,0.05)]">
              <div className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#C5A059] border-b border-white/5 pb-1">
                Columna 2
              </div>
              {columna2.map(art => {
                const marcado = articulosDefectuosos.includes(art.id)
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => alternarArticulo(art.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-all cursor-pointer ${
                      marcado
                        ? 'bg-[#F2620F]/20 border border-[#F2620F]/60 text-white font-semibold'
                        : 'bg-[#14181D] hover:bg-[#20252C] text-[#B8B2A6] border border-transparent'
                    }`}
                  >
                    <span>{art.etiqueta}</span>
                    <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ml-1.5 ${
                      marcado ? 'bg-[#F2620F] text-white' : 'border border-[rgba(243,239,231,0.3)] bg-[#1C1C1C]'
                    }`}>
                      {marcado && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Columna 3 */}
            <div className="space-y-2 rounded-xl bg-[#1C1C1C]/50 p-3 border border-[rgba(243,239,231,0.05)]">
              <div className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#C5A059] border-b border-white/5 pb-1">
                Columna 3
              </div>
              {columna3.map(art => {
                const marcado = articulosDefectuosos.includes(art.id)
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => alternarArticulo(art.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-all cursor-pointer ${
                      marcado
                        ? 'bg-[#F2620F]/20 border border-[#F2620F]/60 text-white font-semibold'
                        : 'bg-[#14181D] hover:bg-[#20252C] text-[#B8B2A6] border border-transparent'
                    }`}
                  >
                    <span>{art.etiqueta}</span>
                    <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ml-1.5 ${
                      marcado ? 'bg-[#F2620F] text-white' : 'border border-[rgba(243,239,231,0.3)] bg-[#1C1C1C]'
                    }`}>
                      {marcado && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Columna 4 */}
            <div className="space-y-2 rounded-xl bg-[#1C1C1C]/50 p-3 border border-[rgba(243,239,231,0.05)]">
              <div className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#C5A059] border-b border-white/5 pb-1">
                Columna 4
              </div>
              {columna4.map(art => {
                const marcado = articulosDefectuosos.includes(art.id)
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => alternarArticulo(art.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-all cursor-pointer ${
                      marcado
                        ? 'bg-[#F2620F]/20 border border-[#F2620F]/60 text-white font-semibold'
                        : 'bg-[#14181D] hover:bg-[#20252C] text-[#B8B2A6] border border-transparent'
                    }`}
                  >
                    <span>{art.etiqueta}</span>
                    <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ml-1.5 ${
                      marcado ? 'bg-[#F2620F] text-white' : 'border border-[rgba(243,239,231,0.3)] bg-[#1C1C1C]'
                    }`}>
                      {marcado && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 3: SÍNTOMA DE FALLA Y CONTROL DE SALIDAS NO CONFORMES */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-[rgba(243,239,231,0.08)] pb-4">
            <ClipboardList className="h-5 w-5 text-[#F2620F]" />
            <h2 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-white">
              3. Síntoma de Falla y Control de Salidas No Conformes (Disposición)
            </h2>
          </div>

          {/* Describa correctamente el síntoma de falla */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">
              Describa Correctamente el Síntoma de Falla:
            </label>
            <textarea
              rows={3}
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
              placeholder="Explica el comportamiento de la unidad, ruidos anormales, pérdida de presión o fallas advertidas durante la inspección..."
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 text-xs text-white placeholder-[#B8B2A6]/40 focus:border-[#F2620F] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Control de Salidas No Conformes */}
          <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
              <span className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                Control de Salidas No Conformes (Disposición)
              </span>
              <span className="text-[11px] text-[#B8B2A6]">
                Selecciona la disposición de aseguramiento de calidad
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {DISPOSICIONES_SALIDA_NO_CONFORME.map(dispLabel => {
                const activo = disposicionSalida === dispLabel
                return (
                  <button
                    key={dispLabel}
                    type="button"
                    onClick={() => setDisposicionSalida(dispLabel)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activo
                        ? 'border-[#F2620F] bg-[#F2620F]/20 text-white font-bold'
                        : 'border-[rgba(243,239,231,0.08)] bg-[#14181D] text-[#B8B2A6] hover:text-white'
                    }`}
                  >
                    <span className="text-xs">{dispLabel}</span>
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                      activo ? 'bg-[#F2620F] text-white' : 'border border-white/20'
                    }`}>
                      {activo && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="pt-2">
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Nombre / Firma del Encargado de Taller (Autorización de Disposición)
              </label>
              <input
                type="text"
                value={firmaEncargadoTaller}
                onChange={e => setFirmaEncargadoTaller(e.target.value)}
                placeholder="Nombre del Jefe o Encargado de Taller"
                className="w-full sm:w-1/2 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 4: FECHAS DE REPARACIÓN Y DESGLOSE DE ACCIONES / REFACCIONES */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(243,239,231,0.08)] pb-4 gap-2">
            <div className="flex items-center gap-2.5">
              <Wrench className="h-5 w-5 text-[#F2620F]" />
              <h2 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-white">
                4. Tareas Técnicas y Mano de Obra Realizada
              </h2>
            </div>
            <button
              type="button"
              onClick={agregarFilaReparacion}
              className="flex items-center gap-1.5 rounded-xl bg-[#F2620F] px-3.5 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Fila</span>
            </button>
          </div>

          {/* Fechas de inicio y término */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Fecha y Hora de Inicio de Reparación
              </label>
              <input
                type="datetime-local"
                value={fechaInicioReparacion}
                onChange={e => setFechaInicioReparacion(e.target.value)}
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Fecha y Hora de Término de Reparación
              </label>
              <input
                type="datetime-local"
                value={fechaTerminoReparacion}
                onChange={e => setFechaTerminoReparacion(e.target.value)}
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>
          </div>

          {/* Tabla de Tareas Mecánicas y Mano de Obra Realizada */}
          <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(243,239,231,0.08)] bg-[#14181D] font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
                <tr>
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3">Descripción de la Reparación o Trabajo Técnico Realizado</th>
                  <th className="py-3 px-3 text-center w-48">Mecánico Asignado</th>
                  <th className="py-3 px-2 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(243,239,231,0.05)]">
                {filasReparaciones.map((fila, idx) => (
                  <tr key={fila.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-2.5 text-center font-mono text-[#B8B2A6] text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={fila.reparacion_realizada}
                        onChange={e => actualizarFilaReparacion(fila.id, 'reparacion_realizada', e.target.value)}
                        placeholder="Ej. Diagnóstico en rampa, calibración de frenos, purga de líneas, cambio de componentes..."
                        className="w-full rounded-lg border border-[rgba(243,239,231,0.1)] bg-[#14181D] py-1.5 px-2.5 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="text-[11px] text-[#B8B2A6] font-medium">
                        {firmas.mecanico || 'Mecánico de Turno'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarFilaReparacion(fila.id)}
                        disabled={filasReparaciones.length === 1}
                        className="text-[#B8B2A6] hover:text-[#F2620F] transition-colors cursor-pointer disabled:opacity-20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Callout Informativo de Refacciones Desacopladas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/10 p-4 text-xs">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-[#F2620F] shrink-0" />
              <div>
                <span className="font-['Barlow_Condensed'] text-sm font-bold uppercase text-white">
                  ¿Esta reparación requiere refacciones o materiales de almacén?
                </span>
                <p className="text-[#B8B2A6] text-xs mt-0.5">
                  Las piezas (stock de almacén, piezas de yonke o requisiciones a compras) se solicitan de forma desacoplada desde el nuevo módulo <strong>Pedido de Refacciones</strong> para garantizar la trazabilidad una vez registrada la orden.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/taller/refacciones')}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#F2620F] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer shrink-0 shadow-md shadow-[#F2620F]/20"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Ir a Pedido de Refacciones</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 5: DECLARACIONES Y 3 FIRMAS DE CONFORMIDAD */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-6 sm:p-7 space-y-6">
          <div className="border-b border-[rgba(243,239,231,0.08)] pb-4">
            <h2 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-white">
              5. Declaraciones y Firmas Oficiales de Conformidad
            </h2>
            <p className="text-xs text-[#B8B2A6] mt-0.5">
              Triple validación legal y de seguridad: Mecánico que reparó, Operador que recibe y Jefe de Taller que autoriza la salida.
            </p>
          </div>

          {/* Las 3 Casillas de Declaración */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDeclaraciones(prev => ({ ...prev, condicion_satisfactoria: !prev.condicion_satisfactoria }))}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                declaraciones.condicion_satisfactoria
                  ? 'border-[#3FA65C] bg-[#3FA65C]/10 text-white'
                  : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6]'
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                declaraciones.condicion_satisfactoria ? 'bg-[#3FA65C] text-black' : 'border border-white/30'
              }`}>
                {declaraciones.condicion_satisfactoria && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="text-xs">
                <strong className="block text-white font-semibold">Condición Satisfactoria</strong>
                La unidad opera dentro de los estándares de seguridad vial.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeclaraciones(prev => ({ ...prev, defectos_corregidos: !prev.defectos_corregidos }))}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                declaraciones.defectos_corregidos
                  ? 'border-[#3FA65C] bg-[#3FA65C]/10 text-white'
                  : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6]'
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                declaraciones.defectos_corregidos ? 'bg-[#3FA65C] text-black' : 'border border-white/30'
              }`}>
                {declaraciones.defectos_corregidos && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="text-xs">
                <strong className="block text-white font-semibold">Defectos Corregidos</strong>
                Se subsanaron todas las fallas que impedían la operación segura.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeclaraciones(prev => ({ ...prev, defectos_pendientes_seguros: !prev.defectos_pendientes_seguros }))}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                declaraciones.defectos_pendientes_seguros
                  ? 'border-[#C5A059] bg-[#C5A059]/10 text-white'
                  : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6]'
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                declaraciones.defectos_pendientes_seguros ? 'bg-[#C5A059] text-black' : 'border border-white/30'
              }`}>
                {declaraciones.defectos_pendientes_seguros && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div className="text-xs">
                <strong className="block text-white font-semibold">Defectos No Afectan Seguridad</strong>
                Salida con Warning controlada para continuar viaje sin riesgo vial.
              </div>
            </button>
          </div>

          {/* Las 3 Firmas de Conformidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Firma 1: Mecánico */}
            <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-4 space-y-2 text-center">
              <span className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#F2620F]">
                Firma del Mecánico
              </span>
              <p className="text-[10px] text-[#B8B2A6]">
                "Declaro que reparé correctamente los defectos indicados."
              </p>
              <div className="h-16 flex items-center justify-center border-b border-dashed border-white/20 font-serif italic text-white text-base">
                {firmas.mecanico || 'Pendiente de firma'}
              </div>
              <input
                type="text"
                value={firmas.mecanico}
                onChange={e => setFirmas(prev => ({ ...prev, mecanico: e.target.value }))}
                placeholder="Nombre del Mecánico"
                className="w-full rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-1.5 px-2.5 text-center text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>

            {/* Firma 2: Operador */}
            <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-4 space-y-2 text-center">
              <span className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#C5A059]">
                Firma del Operador
              </span>
              <p className="text-[10px] text-[#B8B2A6]">
                "Acepto de conformidad la reparación y recibo el tractor."
              </p>
              <div className="h-16 flex items-center justify-center border-b border-dashed border-white/20 font-serif italic text-white text-base">
                {firmas.operador || 'Pendiente de firma'}
              </div>
              <input
                type="text"
                value={firmas.operador}
                onChange={e => setFirmas(prev => ({ ...prev, operador: e.target.value }))}
                placeholder="Nombre del Operador"
                className="w-full rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-1.5 px-2.5 text-center text-xs text-white focus:border-[#C5A059] focus:outline-none"
              />
            </div>

            {/* Firma 3: Jefe de Taller */}
            <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-4 space-y-2 text-center">
              <span className="text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#3FA65C]">
                Firma del Jefe de Taller
              </span>
              <p className="text-[10px] text-[#B8B2A6]">
                "Autorizó y revisó la reparación para entrega oficial."
              </p>
              <div className="h-16 flex items-center justify-center border-b border-dashed border-white/20 font-serif italic text-white text-base">
                {firmas.jefe_taller || 'Pendiente de firma'}
              </div>
              <input
                type="text"
                value={firmas.jefe_taller}
                onChange={e => setFirmas(prev => ({ ...prev, jefe_taller: e.target.value }))}
                placeholder="Nombre del Jefe de Taller"
                className="w-full rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-1.5 px-2.5 text-center text-xs text-white focus:border-[#3FA65C] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Botones de Envío */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[rgba(243,239,231,0.1)]">
          <button
            type="button"
            onClick={() => navigate('/taller/ordenes')}
            className="w-full sm:w-auto rounded-xl border border-[rgba(243,239,231,0.15)] px-6 py-3 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
          >
            Cancelar y Volver
          </button>

          <button
            type="submit"
            disabled={cargando}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#F2620F] px-10 py-3.5 font-['Barlow_Condensed'] text-base font-bold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-5 w-5" />
            <span>{cargando ? 'Generando Reporte y OT...' : 'Emitir Reporte Oficial de Taller'}</span>
          </button>
        </div>
      </form>

      {/* Modal Oficial de la OT Emitida y Descarga PDF */}
      <OrdenTrabajoModal
        ot={otEmitida}
        abierto={modalAbierto}
        alCerrar={() => {
          setModalAbierto(false)
          navigate('/taller/ordenes')
        }}
      />
    </div>
  )
}

export default TallerNuevaOT
