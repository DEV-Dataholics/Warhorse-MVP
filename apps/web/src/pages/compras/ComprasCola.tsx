import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  Truck, 
  FileText, 
  RotateCw,
  Building2,
  X,
  PackageCheck,
  Send,
  Layers,
  CheckCircle2
} from 'lucide-react'
import { 
  getColaCompras, 
  getProveedores, 
  crearProveedor, 
  avanzarEstado, 
  type FilaCompras, 
  type ProveedorApi,
  type EstadoRequisicion 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { OrdenCompraModal, type DetalleOrdenCompra } from '../../components/compras/OrdenCompraModal'

export const ComprasCola: React.FC = () => {
  const navigate = useNavigate()
  const { agregarToast } = useUiStore()

  // Estados de datos
  const [requisiciones, setRequisiciones] = useState<FilaCompras[]>([])
  const [proveedores, setProveedores] = useState<ProveedorApi[]>([])
  const [cargando, setCargando] = useState(true)

  // Filtros y Pestañas
  const [pestañaActiva, setPestañaActiva] = useState<'bandeja' | 'activas' | 'todas'>('bandeja')
  const [busqueda, setBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('Todas')

  // Modal Emitir OC desde Requisición
  const [reqParaOC, setReqParaOC] = useState<FilaCompras | null>(null)
  const [modalEmitirOC, setModalEmitirOC] = useState(false)
  const [provSeleccionado, setProvSeleccionado] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [condicionPago, setCondicionPago] = useState<'Contado' | 'Crédito 15 días' | 'Crédito 30 días'>('Crédito 15 días')
  const [moneda, setMoneda] = useState<'MXN' | 'USD'>('MXN')
  const [numeroFactura, setNumeroFactura] = useState('')
  const [estadoInicialOC, setEstadoInicialOC] = useState<'Comprado' | 'En recolección'>('Comprado')
  const [guardandoOC, setGuardandoOC] = useState(false)

  // Modal Nuevo Proveedor dentro del flujo de emisión
  const [modalNuevoProveedor, setModalNuevoProveedor] = useState(false)
  const [nuevoProvNombre, setNuevoProvNombre] = useState('')
  const [nuevoProvRfc, setNuevoProvRfc] = useState('')
  const [guardandoProveedor, setGuardandoProveedor] = useState(false)

  // Modal Visualización Documento OC
  const [ocSeleccionada, setOcSeleccionada] = useState<DetalleOrdenCompra | null>(null)
  const [modalDocumentoOC, setModalDocumentoOC] = useState(false)

  // Fallbacks seguros para modo demo/desconectado
  const fallbackReqs: FilaCompras[] = [
    {
      id: 101,
      folio: 'REQ-2026-89412',
      estado: 'Solicitado',
      origen: 'Compra',
      unidad_destino_id: 1,
      unidad_destino: 'WH-101',
      destino_modificada: false,
      unidad_donante_id: null,
      unidad_donante: null,
      descripcion_pieza: 'Filtro de Diésel Primario FS19764 y Aceite Mobil Delvac 15W40',
      cantidad: 2,
      numero_parte: 'FS19764-MOB',
      urgencia: 'Crítica',
      costo_estimado: 3800,
      origen_costo_estimado: 'catalogo',
      costo_real: null,
      foto_pieza_url: '',
      fecha_solicitud: new Date().toISOString().substring(0, 10),
      creado_por_nombre: 'Carlos Méndez (Taller)',
      orden_trabajo_id: 1,
    },
    {
      id: 102,
      folio: 'REQ-2026-90214',
      estado: 'En recolección',
      origen: 'Compra',
      unidad_destino_id: 2,
      unidad_destino: 'WH-104',
      destino_modificada: false,
      unidad_donante_id: null,
      unidad_donante: null,
      descripcion_pieza: 'Juego de Balatas Delanteras Meritor Q-Plus',
      cantidad: 1,
      numero_parte: 'MER-4707-QP',
      urgencia: 'Media',
      costo_estimado: 2450,
      origen_costo_estimado: 'ultima_compra',
      costo_real: 2450,
      proveedor: 'Refaccionaria Diésel del Norte',
      numero_factura: 'FAC-88912',
      foto_pieza_url: '',
      fecha_solicitud: new Date().toISOString().substring(0, 10),
      creado_por_nombre: 'Luis Morales (Mecánico B)',
      orden_trabajo_id: 2,
    },
    {
      id: 103,
      folio: 'REQ-2026-91400',
      estado: 'En trayecto',
      origen: 'Compra',
      unidad_destino_id: 3,
      unidad_destino: 'WH-125',
      destino_modificada: false,
      unidad_donante_id: null,
      unidad_donante: null,
      descripcion_pieza: 'Bomba de Agua Cummins ISX 15',
      cantidad: 1,
      numero_parte: 'CUM-3800745',
      urgencia: 'Crítica',
      costo_estimado: 6200,
      origen_costo_estimado: 'manual',
      costo_real: 6200,
      proveedor: 'Cummins México Distribución',
      numero_factura: 'FAC-09144',
      foto_pieza_url: '',
      fecha_solicitud: new Date().toISOString().substring(0, 10),
      creado_por_nombre: 'Carlos Méndez (Taller)',
      orden_trabajo_id: 3,
    },
  ]

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [listaReqs, listaProvs] = await Promise.all([
        getColaCompras().catch(() => fallbackReqs),
        getProveedores().catch(() => [
          { id: 1, nombre: 'Refaccionaria Diésel del Norte', rfc: 'RDN980512AB3', activo: true },
          { id: 2, nombre: 'Llantas y Renovados de Chihuahua', rfc: 'LRC120304XY1', activo: true },
          { id: 3, nombre: 'Ferretería y Tornillos del Centro', rfc: 'FTC150821M99', activo: true },
          { id: 4, nombre: 'Cummins México Distribución', rfc: 'CMD010915TR4', activo: true },
          { id: 5, nombre: 'Kenworth Refacciones y Servicio', rfc: 'KRS040711KP8', activo: true },
        ]),
      ])
      setRequisiciones(listaReqs && listaReqs.length > 0 ? listaReqs : fallbackReqs)
      setProveedores(listaProvs || [])
      if (listaProvs && listaProvs.length > 0 && !provSeleccionado) {
        setProvSeleccionado(listaProvs[0].nombre)
      }
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Métricas
  const totalBandejaPendientes = requisiciones.filter(r => 
    ['Solicitado', 'Cotizado', 'En aprobación'].includes(r.estado)
  ).length

  const totalEnTransito = requisiciones.filter(r => 
    ['Comprado', 'En recolección', 'En trayecto'].includes(r.estado)
  ).length

  const totalInstaladas = requisiciones.filter(r => r.estado === 'Instalado').length

  const inversionAcumulada = requisiciones
    .filter(r => r.costo_real !== null)
    .reduce((acc, r) => acc + Number(r.costo_real || 0), 0)

  // Subconjuntos según pestaña
  const reqsBandeja = requisiciones.filter(r => 
    ['Solicitado', 'Cotizado', 'En aprobación'].includes(r.estado)
  )

  const reqsActivas = requisiciones.filter(r => 
    ['Comprado', 'En recolección', 'En trayecto', 'Instalado'].includes(r.estado)
  )

  const listaActual = pestañaActiva === 'bandeja' 
    ? reqsBandeja 
    : pestañaActiva === 'activas' 
    ? reqsActivas 
    : requisiciones

  const filtradas = listaActual.filter(r => {
    const texto = `${r.folio || ''} ${r.descripcion_pieza} ${r.unidad_destino} ${r.proveedor || ''} ${r.creado_por_nombre || ''}`.toLowerCase()
    if (!texto.includes(busqueda.toLowerCase())) return false
    if (filtroUrgencia !== 'Todas' && r.urgencia !== filtroUrgencia) return false
    return true
  })

  // Flujo: Abrir Modal para Emitir OC
  const iniciarEmisionOC = (req: FilaCompras) => {
    setReqParaOC(req)
    setPrecioUnitario(Number(req.costo_estimado || 0))
    setNumeroFactura(`FAC-${Math.floor(10000 + Math.random() * 90000)}`)
    if (proveedores.length > 0 && !provSeleccionado) {
      setProvSeleccionado(proveedores[0].nombre)
    }
    setModalEmitirOC(true)
  }

  // Cálculos de la emisión de OC
  const subtotalOC = (reqParaOC?.cantidad || 1) * precioUnitario
  const ivaOC = Math.round(subtotalOC * 0.16 * 100) / 100
  const totalOC = subtotalOC + ivaOC

  // Confirmar Emisión de OC (pasa de Requisición de Taller a Orden de Compra activa)
  const confirmarEmisionOC = async () => {
    if (!reqParaOC) return
    if (!provSeleccionado.trim()) {
      agregarToast({
        tipo: 'error',
        titulo: 'Proveedor Obligatorio',
        mensaje: 'Selecciona un proveedor de la lista o registra uno nuevo.',
      })
      return
    }

    setGuardandoOC(true)
    try {
      // 1. Avanzar estado en backend (pasa a Comprado o En recolección)
      await avanzarEstado(reqParaOC.id, {
        estado: estadoInicialOC as EstadoRequisicion,
        costo_real: totalOC,
        numero_factura: numeroFactura,
        proveedor: provSeleccionado,
      })

      // 2. Armar documento oficial de Orden de Compra para visualización / PDF
      const folioOC = `OC-${new Date().getFullYear()}-${String(reqParaOC.id).padStart(5, '0')}`
      const detalle: DetalleOrdenCompra = {
        id: reqParaOC.id,
        folio: folioOC,
        fecha: new Date().toISOString().substring(0, 10),
        proveedor: provSeleccionado,
        condicion_pago: condicionPago,
        moneda,
        unidad_id: reqParaOC.unidad_destino || 'Almacén General',
        folio_ot: reqParaOC.orden_trabajo_id ? `OT-${reqParaOC.orden_trabajo_id}` : undefined,
        categoria: 'Refacción',
        es_caja_chica: false,
        partidas: [
          {
            pieza: reqParaOC.descripcion_pieza,
            cantidad: reqParaOC.cantidad || 1,
            precio_unitario: precioUnitario,
          },
        ],
        subtotal: subtotalOC,
        iva: ivaOC,
        total: totalOC,
        solicitado_por: reqParaOC.creado_por_nombre || 'Coordinador de Taller',
        estado: 'Aprobada',
      }

      setModalEmitirOC(false)
      setOcSeleccionada(detalle)
      setModalDocumentoOC(true)

      agregarToast({
        tipo: 'success',
        titulo: 'Orden de Compra Emitida',
        mensaje: `Se generó ${folioOC} asignada a ${provSeleccionado} por $${totalOC.toLocaleString()} ${moneda}.`,
      })

      // Recargar cola
      await cargarDatos()
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Emitir OC',
        mensaje: err instanceof Error ? err.message : 'No se pudo procesar la orden de compra.',
      })
    } finally {
      setGuardandoOC(false)
    }
  }

  // Avanzar ciclo logístico de la Orden de Compra
  const transitarEstadoOC = async (req: FilaCompras, nuevoEstado: EstadoRequisicion) => {
    try {
      await avanzarEstado(req.id, {
        estado: nuevoEstado,
        costo_real: req.costo_real || undefined,
        numero_factura: req.numero_factura || undefined,
        proveedor: req.proveedor || undefined,
      })

      agregarToast({
        tipo: 'success',
        titulo: `Estatus Actualizado: ${nuevoEstado}`,
        mensaje: `La refacción "${req.descripcion_pieza}" para ${req.unidad_destino} ahora está: ${nuevoEstado}.`,
      })

      await cargarDatos()
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Actualizar Estatus',
        mensaje: err instanceof Error ? err.message : 'No se pudo actualizar el ciclo logístico.',
      })
    }
  }

  // Confirmar entrega de stock de almacén solicitado por Taller
  const confirmarEntregaStock = async (req: FilaCompras) => {
    try {
      await avanzarEstado(req.id, {
        estado: 'Instalado',
      })

      agregarToast({
        tipo: 'success',
        titulo: 'Entrega de Stock Confirmada',
        mensaje: `Se confirmó la salida de ${req.cantidad || 1} pz de "${req.descripcion_pieza}" para la OT #${req.orden_trabajo_id || ''}.`,
      })

      await cargarDatos()
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Confirmar Entrega',
        mensaje: err instanceof Error ? err.message : 'No se pudo registrar la entrega de stock.',
      })
    }
  }

  // Guardar nuevo proveedor en BD desde el modal
  const guardarNuevoProveedor = async () => {
    if (!nuevoProvNombre.trim()) {
      agregarToast({
        tipo: 'error',
        titulo: 'Nombre Requerido',
        mensaje: 'Ingresa el nombre o razón social del proveedor.',
      })
      return
    }
    setGuardandoProveedor(true)
    try {
      const res = await crearProveedor({
        nombre: nuevoProvNombre.trim(),
        rfc: nuevoProvRfc.trim() || undefined,
      })
      const nuevoObj: ProveedorApi = {
        id: res.id,
        nombre: res.nombre,
        rfc: res.rfc || null,
        activo: true,
      }
      setProveedores(prev => [...prev, nuevoObj].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setProvSeleccionado(res.nombre)
      setNuevoProvNombre('')
      setNuevoProvRfc('')
      setModalNuevoProveedor(false)
      agregarToast({
        tipo: 'success',
        titulo: 'Proveedor Registrado',
        mensaje: `Se agregó "${res.nombre}" a la base de datos de proveedores.`,
      })
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Registrar Proveedor',
        mensaje: err instanceof Error ? err.message : 'No se pudo registrar el proveedor.',
      })
    } finally {
      setGuardandoProveedor(false)
    }
  }

  // Ver documento OC formal
  const verDocumentoOC = (r: FilaCompras) => {
    const totalNum = Number(r.costo_real || r.costo_estimado || 0)
    const subtotal = totalNum > 0 ? Math.round((totalNum / 1.16) * 100) / 100 : 0
    const iva = totalNum > 0 ? Math.round((totalNum - subtotal) * 100) / 100 : 0

    const detalle: DetalleOrdenCompra = {
      id: r.id,
      folio: `OC-${new Date().getFullYear()}-${String(r.id).padStart(5, '0')}`,
      fecha: r.fecha_solicitud || new Date().toISOString().substring(0, 10),
      proveedor: r.proveedor || 'Proveedor Nacional de Autotransporte',
      condicion_pago: 'Crédito 15 días',
      moneda: 'MXN',
      unidad_id: r.unidad_destino || 'Almacén General',
      folio_ot: r.orden_trabajo_id ? `OT-${r.orden_trabajo_id}` : undefined,
      categoria: 'Refacción',
      es_caja_chica: false,
      partidas: [
        {
          pieza: r.descripcion_pieza,
          cantidad: r.cantidad || 1,
          precio_unitario: subtotal,
        },
      ],
      subtotal,
      iva,
      total: totalNum,
      solicitado_por: r.creado_por_nombre || 'Coordinador de Taller',
      estado: r.estado === 'Instalado' ? 'Aprobada' : 'Aprobada',
    }

    setOcSeleccionada(detalle)
    setModalDocumentoOC(true)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Industrial */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Compras & Adquisiciones
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Flujo Oficial de Suministros
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Bandeja de Requisiciones & Órdenes de Compra
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Requisiciones solicitadas por taller, asignación comercial de proveedores y control del ciclo logístico de piezas.
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
            onClick={() => navigate('/compras/carrito')}
            className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Nueva Compra Directa</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Requisiciones por Atender</span>
            <Clock className="h-4 w-4 text-[#F2620F]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#F2620F] tabular-nums">
            {totalBandejaPendientes}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Esperando asignación de OC</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>OCs en Tránsito / Pedidas</span>
            <Truck className="h-4 w-4 text-[#C5A059]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#C5A059] tabular-nums">
            {totalEnTransito}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">En recolección o trayecto</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Piezas Instaladas en Taller</span>
            <PackageCheck className="h-4 w-4 text-[#3FA65C]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#3FA65C] tabular-nums">
            {totalInstaladas}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Costo cargado al tracto</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Inversión Real en Piezas</span>
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black text-white tabular-nums">
            ${inversionAcumulada.toLocaleString()} MXN
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Total consolidado</div>
        </div>
      </div>

      {/* Pestañas Operativas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(243,239,231,0.1)] pb-2">
        <button
          type="button"
          onClick={() => setPestañaActiva('bandeja')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            pestañaActiva === 'bandeja'
              ? 'bg-[#F2620F] text-[#16191E] shadow-md shadow-[#F2620F]/20'
              : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Bandeja de Requisiciones (Taller)</span>
          <span className={`rounded-full px-2 py-0.2 text-xs font-black ${
            pestañaActiva === 'bandeja' ? 'bg-black/30 text-white' : 'bg-[#F2620F]/20 text-[#F2620F]'
          }`}>
            {totalBandejaPendientes}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestañaActiva('activas')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            pestañaActiva === 'activas'
              ? 'bg-[#C5A059] text-[#16191E] shadow-md shadow-[#C5A059]/20'
              : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Órdenes de Compra en Ciclo Logístico</span>
          <span className={`rounded-full px-2 py-0.2 text-xs font-black ${
            pestañaActiva === 'activas' ? 'bg-black/30 text-white' : 'bg-[#C5A059]/20 text-[#C5A059]'
          }`}>
            {totalEnTransito}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestañaActiva('todas')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            pestañaActiva === 'todas'
              ? 'bg-white/20 text-white'
              : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Histórico Global</span>
        </button>
      </div>

      {/* Contenedor Principal: Filtros y Tabla */}
      <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B8B2A6]" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por folio, pieza, tracto o proveedor..."
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-semibold text-[#B8B2A6] mr-1 hidden sm:inline">Urgencia:</span>
            {['Todas', 'Crítica', 'Media', 'Rápida'].map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setFiltroUrgencia(u)}
                className={`rounded-lg px-3 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroUrgencia === u
                    ? 'bg-[#F2620F] text-[#16191E]'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Densa */}
        <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
          <table className="w-full text-left text-xs text-[#f3f4f6]">
            <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
              <tr>
                <th className="px-4 py-3">Folio / Fecha</th>
                <th className="px-4 py-3">Urgencia</th>
                <th className="px-4 py-3">Tracto / OT</th>
                <th className="px-4 py-3">Pieza Solicitada</th>
                <th className="px-4 py-3">Proveedor Asignado</th>
                <th className="px-4 py-3 text-right">Costo Estimado / Real</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acción Operativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                    Cargando requisiciones y órdenes de compra desde el servidor local...
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#B8B2A6]">
                    No se encontraron registros para la pestaña o filtros actuales.
                  </td>
                </tr>
              ) : (
                filtradas.map(r => {
                  const esPendiente = ['Solicitado', 'Cotizado', 'En aprobación'].includes(r.estado)
                  const esOCActiva = ['Comprado', 'En recolección', 'En trayecto'].includes(r.estado)
                  const esInstalada = r.estado === 'Instalado'

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Folio / Fecha */}
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-[#F2620F]">
                          {r.folio || `REQ-${new Date().getFullYear()}-${String(r.id).padStart(5, '0')}`}
                        </div>
                        <div className="text-[10px] text-[#B8B2A6]">{r.fecha_solicitud}</div>
                      </td>

                      {/* Urgencia */}
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase ${
                          r.urgencia === 'Crítica' || r.urgencia === 'Inmediato'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : r.urgencia === 'Media'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-[#3FA65C]/20 text-[#3FA65C]'
                        }`}>
                          {r.urgencia}
                        </span>
                      </td>

                      {/* Tracto / OT */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-white flex items-center gap-1">
                          <Truck className="h-3 w-3 text-[#C5A059]" />
                          <span>{r.unidad_destino || 'Almacén'}</span>
                        </div>
                        {r.orden_trabajo_id && (
                          <div className="text-[10px] text-[#B8B2A6]">
                            OT #{r.orden_trabajo_id}
                          </div>
                        )}
                      </td>

                      {/* Pieza y Cantidad */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="font-medium text-white line-clamp-1" title={r.descripcion_pieza}>
                          {r.descripcion_pieza}
                        </div>
                        <div className="text-[10px] text-[#B8B2A6]">
                          Cantidad: <strong className="text-white">{r.cantidad || 1} PZ</strong>
                          {r.numero_parte && ` • Ref: ${r.numero_parte}`}
                        </div>
                      </td>

                      {/* Proveedor */}
                      <td className="px-4 py-3 max-w-[150px]">
                        {r.proveedor ? (
                          <div className="font-semibold text-white truncate" title={r.proveedor}>
                            {r.proveedor}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#B8B2A6] italic">Sin asignar</span>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="px-4 py-3 text-right font-['Barlow_Condensed'] text-sm font-bold tabular-nums text-white">
                        {r.costo_real ? (
                          <span className="text-[#3FA65C]">${Number(r.costo_real).toLocaleString()} MXN</span>
                        ) : r.costo_estimado ? (
                          <span className="text-[#B8B2A6]">~${Number(r.costo_estimado).toLocaleString()}</span>
                        ) : (
                          <span className="text-[#B8B2A6]">—</span>
                        )}
                      </td>

                      {/* Estatus */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${
                            esInstalada
                              ? 'bg-[#3FA65C]/20 text-[#3FA65C]'
                              : r.estado === 'En trayecto'
                              ? 'bg-blue-500/20 text-blue-400'
                              : r.estado === 'En recolección'
                              ? 'bg-purple-500/20 text-purple-400'
                              : r.estado === 'Comprado'
                              ? 'bg-[#C5A059]/20 text-[#C5A059]'
                              : 'bg-[#F2620F]/20 text-[#F2620F]'
                          }`}>
                            {r.estado === 'En recolección' ? 'Pedida (En recolección)' :
                             r.estado === 'En trayecto' ? 'Recogida (En trayecto)' :
                             r.estado}
                          </span>
                          {r.origen === 'Inventario' && (
                            <span className="rounded bg-[#3FA65C]/20 px-1.5 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase text-[#3FA65C] border border-[#3FA65C]/30">
                              📦 Surtido Almacén
                            </span>
                          )}
                          {r.origen === 'Yonke' && (
                            <span className="rounded bg-[#C5A059]/20 px-1.5 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase text-[#C5A059] border border-[#C5A059]/30">
                              ♻️ Pieza Yonke ($0)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones según el ciclo de vida */}
                      <td className="px-4 py-3 text-right">
                        {/* Caso 1A: Surtido de Almacén Interno */}
                        {esPendiente && r.origen === 'Inventario' ? (
                          <button
                            type="button"
                            onClick={() => confirmarEntregaStock(r)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#3FA65C] px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#2e7d44] transition-all cursor-pointer shadow"
                            title="Confirmar entrega física y registrar la baja en el inventario de almacén"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Confirmar Entrega y Descontar Stock</span>
                          </button>
                        ) : esPendiente ? (
                          <button
                            type="button"
                            onClick={() => iniciarEmisionOC(r)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2620F] px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D9550C] transition-all cursor-pointer shadow"
                          >
                            <Send className="h-3 w-3" />
                            <span>Aprobar y Emitir OC</span>
                          </button>
                        ) : null}

                        {/* Caso 2: Orden de Compra Activa en Ciclo Logístico */}
                        {esOCActiva && (
                          <div className="inline-flex items-center gap-1.5">
                            {r.estado === 'Comprado' && (
                              <button
                                type="button"
                                onClick={() => transitarEstadoOC(r, 'En recolección')}
                                className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer"
                                title="Marcar como pedida lista para recoger en refaccionaria"
                              >
                                Marcar Pedida
                              </button>
                            )}

                            {r.estado === 'En recolección' && (
                              <button
                                type="button"
                                onClick={() => transitarEstadoOC(r, 'En trayecto')}
                                className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-blue-300 hover:bg-blue-500/20 transition-all cursor-pointer"
                                title="Marcar como recogida por chofer en camino al taller"
                              >
                                Marcar Recogida
                              </button>
                            )}

                            {r.estado === 'En trayecto' && (
                              <button
                                type="button"
                                onClick={() => transitarEstadoOC(r, 'Instalado')}
                                className="rounded-lg border border-[#3FA65C]/40 bg-[#3FA65C]/10 px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#3FA65C] hover:bg-[#3FA65C]/20 transition-all cursor-pointer"
                                title="Confirmar recepción en taller e instalación en tracto"
                              >
                                Confirmar Instalado
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => verDocumentoOC(r)}
                              className="rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2 py-1 text-xs text-[#B8B2A6] hover:text-white"
                              title="Ver Documento Oficial de la OC"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Caso 3: Ya Instalada */}
                        {esInstalada && (
                          <button
                            type="button"
                            onClick={() => verDocumentoOC(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#3FA65C] hover:border-[#3FA65C]"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Ver OC</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: APROBAR Y EMITIR ORDEN DE COMPRA (ASIGNACIÓN DE PROVEEDOR Y DESGLOSE) */}
      {modalEmitirOC && reqParaOC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] pb-3">
              <div>
                <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
                  Compuerta de Compras
                </span>
                <h3 className="font-['Barlow_Condensed'] text-xl font-black uppercase text-white">
                  Aprobar Requisición & Emitir Orden de Compra
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEmitirOC(false)}
                className="text-[#B8B2A6] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Resumen de la Solicitud de Taller */}
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-['Barlow_Condensed'] font-bold uppercase text-[#C5A059]">
                  Datos de la Requisición ({reqParaOC.folio || `REQ-${reqParaOC.id}`})
                </span>
                <span className="rounded bg-red-500/20 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase text-red-400">
                  Urgencia: {reqParaOC.urgencia}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#B8B2A6]">
                <div>
                  <span className="text-[#B8B2A6]/70">Unidad Destino:</span>{' '}
                  <strong className="text-white">{reqParaOC.unidad_destino}</strong>
                  {reqParaOC.orden_trabajo_id && ` (OT #${reqParaOC.orden_trabajo_id})`}
                </div>
                <div>
                  <span className="text-[#B8B2A6]/70">Solicitó:</span>{' '}
                  <strong className="text-white">{reqParaOC.creado_por_nombre || 'Taller'}</strong>
                </div>
              </div>
              <div className="text-[#f3f4f6] pt-1 border-t border-[rgba(243,239,231,0.06)]">
                <strong>Pieza:</strong> {reqParaOC.cantidad || 1} PZ — {reqParaOC.descripcion_pieza}
              </div>
            </div>

            {/* Formulario de Asignación Comercial */}
            <div className="space-y-4">
              {/* Proveedor con opción de crear nuevo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#B8B2A6]">
                    Proveedor Asignado *
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalNuevoProveedor(true)}
                    className="flex items-center gap-1 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#F2620F] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Agregar Nuevo Proveedor</span>
                  </button>
                </div>
                <select
                  value={provSeleccionado}
                  onChange={e => setProvSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none font-semibold"
                >
                  {proveedores.map(p => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre} {p.rfc ? `(${p.rfc})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precios y Desglose Fiscal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={precioUnitario}
                    onChange={e => setPrecioUnitario(Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Moneda
                  </label>
                  <select
                    value={moneda}
                    onChange={e => setMoneda(e.target.value as 'MXN' | 'USD')}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-xs font-bold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="MXN">MXN ($)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Condición Pago
                  </label>
                  <select
                    value={condicionPago}
                    onChange={e => setCondicionPago(e.target.value as typeof condicionPago)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-xs font-bold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito 15 días">Crédito 15 días</option>
                    <option value="Crédito 30 días">Crédito 30 días</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Folio Factura / OC *
                  </label>
                  <input
                    type="text"
                    value={numeroFactura}
                    onChange={e => setNumeroFactura(e.target.value)}
                    placeholder="FAC-12345"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Siguiente Estado Inmediato */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Estatus Inicial de la Orden de Compra
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEstadoInicialOC('Comprado')}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      estadoInicialOC === 'Comprado'
                        ? 'border-[#F2620F] bg-[#F2620F]/10 text-white'
                        : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6]'
                    }`}
                  >
                    <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase">
                      Comprada (Emitida)
                    </div>
                    <div className="text-[10px] text-[#B8B2A6]">Lista para trámite contable</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstadoInicialOC('En recolección')}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      estadoInicialOC === 'En recolección'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6]'
                    }`}
                  >
                    <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase text-purple-400">
                      Pedida (En recolección)
                    </div>
                    <div className="text-[10px] text-[#B8B2A6]">Chofer listo para recoger</div>
                  </button>
                </div>
              </div>

              {/* Tarjeta de Cálculo de Totales */}
              <div className="rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/5 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#B8B2A6]">
                  <span>Subtotal ({reqParaOC.cantidad || 1} pz):</span>
                  <span className="font-mono text-white">${subtotalOC.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between text-[#B8B2A6]">
                  <span>IVA Trasladado (16%):</span>
                  <span className="font-mono text-white">${ivaOC.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-[rgba(243,239,231,0.1)]">
                  <span className="font-['Barlow_Condensed'] uppercase tracking-wider text-[#F2620F]">
                    Total Facturado OC:
                  </span>
                  <span className="font-['Barlow_Condensed'] text-base text-[#3FA65C]">
                    ${totalOC.toLocaleString()} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(243,239,231,0.1)]">
              <button
                type="button"
                onClick={() => setModalEmitirOC(false)}
                className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoOC || precioUnitario <= 0}
                onClick={confirmarEmisionOC}
                className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D9550C] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#F2620F]/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{guardandoOC ? 'Procesando...' : 'Confirmar & Emitir Orden de Compra'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR NUEVO PROVEEDOR */}
      {modalNuevoProveedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#F2620F]" />
                <h3 className="font-['Barlow_Condensed'] text-lg font-bold uppercase text-white">
                  Registrar Nuevo Proveedor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoProveedor(false)}
                className="text-[#B8B2A6] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Nombre Comercial o Razón Social *
                </label>
                <input
                  type="text"
                  value={nuevoProvNombre}
                  onChange={e => setNuevoProvNombre(e.target.value)}
                  placeholder="Ej. Filtros y Mangueras Frontera SA de CV"
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  RFC (Opcional)
                </label>
                <input
                  type="text"
                  value={nuevoProvRfc}
                  onChange={e => setNuevoProvRfc(e.target.value)}
                  placeholder="Ej. FMF190412AB1"
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs uppercase text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(243,239,231,0.1)]">
              <button
                type="button"
                onClick={() => setModalNuevoProveedor(false)}
                className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoProveedor}
                onClick={guardarNuevoProveedor}
                className="rounded-xl bg-[#F2620F] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D9550C] disabled:opacity-50 cursor-pointer"
              >
                {guardandoProveedor ? 'Guardando...' : 'Guardar Proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DOCUMENTO OFICIAL DE ORDEN DE COMPRA (PDF / IMPRIMIBLE) */}
      <OrdenCompraModal
        oc={ocSeleccionada}
        abierto={modalDocumentoOC}
        alCerrar={() => setModalDocumentoOC(false)}
      />
    </div>
  )
}

export default ComprasCola
