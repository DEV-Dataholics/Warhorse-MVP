import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Boxes, 
  ArrowUpDown, 
  RotateCw, 
  ShoppingCart,
  Download,
  Upload,
  ClipboardList,
  X,
  FileSpreadsheet,
  Recycle
} from 'lucide-react'
import { 
  getArticulosAlmacen, 
  crearArticuloAlmacen, 
  actualizarArticuloAlmacen, 
  type ArticuloAlmacenApi 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { RequisicionCompraModal, type DetalleRequisicion } from '../../components/compras/RequisicionCompraModal'
import { 
  type MovimientoInventario, 
  type TipoTransaccionInventario, 
  DEPARTAMENTOS_ALMACEN, 
  PROVEEDORES_FRECUENTES, 
  AUTORIZADORES_FRECUENTES,
  exportarMovimientosACSV 
} from '../../lib/inventarioSchema'
import { 
  obtenerMovimientosInventario, 
  registrarMovimientoInventario, 
  importarMovimientosDesdeCSV 
} from '../../lib/inventarioStorage'

export const ComprasInventario: React.FC = () => {
  const navigate = useNavigate()
  const { agregarToast } = useUiStore()
  const archivoCsvRef = useRef<HTMLInputElement>(null)

  // Pestaña activa: Existencias de Catálogo vs Bitácora de Control Mensual (Kardex)
  const [pestañaActiva, setPestañaActiva] = useState<'existencias' | 'kardex'>('existencias')

  // Datos de SKUs / Catálogo
  const [articulos, setArticulos] = useState<ArticuloAlmacenApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas')
  const [filtroStock, setFiltroStock] = useState<'Todos' | 'Criticos' | 'Bajo' | 'Optimo'>('Todos')

  // Datos del Kardex / Control Mensual
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [busquedaKardex, setBusquedaKardex] = useState('')
  const [filtroDeptoKardex, setFiltroDeptoKardex] = useState<string>('Todos')
  const [filtroTipoKardex, setFiltroTipoKardex] = useState<string>('Todos')
  const [filtroMesKardex, setFiltroMesKardex] = useState<string>('Todos')

  // Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false)

  // Form Nuevo Artículo (Catálogo)
  const [nombreNormalizado, setNombreNormalizado] = useState('')
  const [categoriaNuevo, setCategoriaNuevo] = useState('Preventivos')
  const [numeroParteNuevo, setNumeroParteNuevo] = useState('')
  const [proveedorNuevo, setProveedorNuevo] = useState('')
  const [precioReferenciaNuevo, setPrecioReferenciaNuevo] = useState<number>(0)
  const [stockMinimoNuevo, setStockMinimoNuevo] = useState<number | ''>(2)
  const [stockMaximoNuevo, setStockMaximoNuevo] = useState<number | ''>(10)
  const [stockActualNuevo, setStockActualNuevo] = useState<number>(0)
  const [validarLimitesNuevo, setValidarLimitesNuevo] = useState(true)
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)

  // Form Registrar Movimiento Oficial (12 atributos)
  const [articuloMovId, setArticuloMovId] = useState<number | ''>('')
  const [articuloMovDesc, setArticuloMovDesc] = useState('')
  const [articuloMovParte, setArticuloMovParte] = useState('')
  const [tipoMov, setTipoMov] = useState<TipoTransaccionInventario>('SALIDA')
  const [cantMov, setCantMov] = useState<number>(1)
  const [proveedorMov, setProveedorMov] = useState('')
  const [fechaMov, setFechaMov] = useState(() => new Date().toISOString().substring(0, 10))
  const [solicitanteMov, setSolicitanteMov] = useState('FRAGA')
  const [departamentoMov, setDepartamentoMov] = useState<string>('TALLER TRACTOS')
  const [autorizadoPorMov, setAutorizadoPorMov] = useState('JESUS SOTO')
  const [comentariosMov, setComentariosMov] = useState('')
  const [guardandoMov, setGuardandoMov] = useState(false)

  // Modal de Requisición Directa a Compras
  const [reqModalAbierto, setReqModalAbierto] = useState(false)
  const [reqEmitida, setReqEmitida] = useState<DetalleRequisicion | null>(null)

  // Carga inicial
  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [listaArticulos, listaMovs] = await Promise.all([
        getArticulosAlmacen().catch(() => []),
        obtenerMovimientosInventario().catch(() => []),
      ])
      setArticulos(listaArticulos)
      setMovimientos(listaMovs)
    } catch {
      agregarToast({
        tipo: 'error',
        titulo: 'Error de Sincronización',
        mensaje: 'No se pudo sincronizar el inventario de almacén.',
      })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Métricas
  const totalArticulos = articulos.length
  const valorTotalInventario = articulos.reduce(
    (acc, a) => acc + (a.stock_actual || 0) * (a.precio_referencia || 0),
    0
  )
  const articulosAgotados = articulos.filter(a => a.stock_actual <= 0).length
  const articulosBajoMinimo = articulos.filter(
    a => a.stock_actual > 0 && a.stock_minimo !== null && a.stock_actual <= a.stock_minimo
  ).length

  const totalMovimientos = movimientos.length
  const totalSalidas = movimientos.filter(m => m.tipo_transaccion === 'SALIDA').length
  const totalEntradas = movimientos.filter(m => m.tipo_transaccion === 'ENTRADA' || m.tipo_transaccion === 'AJUSTE ENTRADA').length

  const categorias = ['Todas', 'Preventivos', 'Frenos', 'Suspensión', 'Filtros', 'Aceites', 'Eléctrico', 'Tornillería', 'Yonke', 'Otros']

  // Filtrado de Artículos (Pestaña 1)
  const articulosFiltrados = useMemo(() => {
    return articulos.filter(art => {
      const texto = `${art.nombre_normalizado} ${art.numero_parte || ''} ${art.categoria || ''}`.toLowerCase()
      if (!texto.includes(busqueda.toLowerCase())) return false

      if (categoriaActiva !== 'Todas' && (art.categoria || 'Otros') !== categoriaActiva) {
        return false
      }

      if (filtroStock === 'Criticos') return art.stock_actual <= 0
      if (filtroStock === 'Bajo') return art.stock_actual > 0 && art.stock_minimo !== null && art.stock_actual <= art.stock_minimo
      if (filtroStock === 'Optimo') return art.stock_minimo === null || art.stock_actual > art.stock_minimo

      return true
    })
  }, [articulos, busqueda, categoriaActiva, filtroStock])

  // Filtrado de Movimientos / Kardex (Pestaña 2)
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      const texto = `${m.descripcion_parte} ${m.numero_parte || ''} ${m.proveedor || ''} ${m.solicitante || ''} ${m.autorizado_por || ''} ${m.comentarios || ''}`.toLowerCase()
      if (busquedaKardex && !texto.includes(busquedaKardex.toLowerCase())) return false

      if (filtroDeptoKardex !== 'Todos' && (m.departamento || '').toUpperCase() !== filtroDeptoKardex.toUpperCase()) {
        return false
      }

      if (filtroTipoKardex !== 'Todos' && m.tipo_transaccion !== filtroTipoKardex) {
        return false
      }

      if (filtroMesKardex !== 'Todos') {
        if (!m.fecha.includes(`/${filtroMesKardex}/`) && !m.fecha.startsWith(`2026-0${filtroMesKardex}`) && !m.fecha.startsWith(`2026-${filtroMesKardex}`)) {
          return false
        }
      }

      return true
    })
  }, [movimientos, busquedaKardex, filtroDeptoKardex, filtroTipoKardex, filtroMesKardex])

  // Abrir modal de movimiento preseleccionando artículo
  const abrirModalMovimientoConArticulo = (art?: ArticuloAlmacenApi) => {
    if (art) {
      setArticuloMovId(art.id)
      setArticuloMovDesc(art.nombre_normalizado)
      setArticuloMovParte(art.numero_parte || '')
    } else if (articulos.length > 0) {
      setArticuloMovId(articulos[0].id)
      setArticuloMovDesc(articulos[0].nombre_normalizado)
      setArticuloMovParte(articulos[0].numero_parte || '')
    }
    setCantMov(1)
    setTipoMov('SALIDA')
    setComentariosMov('')
    setModalMovimientoAbierto(true)
  }

  // Filtrar Kardex para ver el historial de un artículo específico
  const verHistorialArticulo = (art: ArticuloAlmacenApi) => {
    setPestañaActiva('kardex')
    setBusquedaKardex(art.nombre_normalizado)
  }

  // Guardar nuevo artículo en catálogo
  const guardarNuevoArticulo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreNormalizado.trim()) {
      agregarToast({
        tipo: 'error',
        titulo: 'Campo Obligatorio',
        mensaje: 'Ingresa la descripción o nombre de la refacción.',
      })
      return
    }

    setGuardandoNuevo(true)
    try {
      const nuevo = await crearArticuloAlmacen({
        nombre_normalizado: nombreNormalizado.trim(),
        categoria: categoriaNuevo,
        numero_parte: numeroParteNuevo.trim() || null,
        precio_referencia: Number(precioReferenciaNuevo) || 0,
        stock_minimo: stockMinimoNuevo === '' ? null : Number(stockMinimoNuevo),
        stock_maximo: stockMaximoNuevo === '' ? null : Number(stockMaximoNuevo),
        stock_actual: Number(stockActualNuevo) || 0,
        validar_limites: validarLimitesNuevo,
      })

      // Si se ingresó con stock inicial, registrar automáticamente el movimiento de AJUSTE ENTRADA
      if (Number(stockActualNuevo) > 0) {
        await registrarMovimientoInventario({
          numero_parte: numeroParteNuevo.trim() || null,
          descripcion_parte: nombreNormalizado.trim(),
          proveedor: proveedorNuevo.trim() || null,
          tipo_transaccion: 'AJUSTE ENTRADA',
          cantidad: Number(stockActualNuevo),
          balance: Number(stockActualNuevo),
          fecha: new Date().toISOString().substring(0, 10),
          solicitante: 'ALMACÉN GENERAL',
          departamento: 'AMBOS TALLERES',
          autorizado_por: 'JESUS SOTO',
          comentarios: 'Alta de SKU con inventario inicial',
        })
        const movsActualizados = await obtenerMovimientosInventario()
        setMovimientos(movsActualizados)
      }

      setArticulos(prev => [...prev, nuevo])
      setModalNuevoAbierto(false)
      setNombreNormalizado('')
      setNumeroParteNuevo('')
      setProveedorNuevo('')
      setPrecioReferenciaNuevo(0)
      setStockActualNuevo(0)

      agregarToast({
        tipo: 'success',
        titulo: 'Refacción Catalogada',
        mensaje: `Se agregó ${nuevo.nombre_normalizado} al catálogo oficial de almacén.`,
      })
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Guardar',
        mensaje: err instanceof Error ? err.message : 'Error al registrar artículo en almacén.',
      })
    } finally {
      setGuardandoNuevo(false)
    }
  }

  // Registrar Transacción Oficial en el Kardex
  const ejecutarRegistroMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!articuloMovDesc.trim() || cantMov <= 0) {
      agregarToast({
        tipo: 'error',
        titulo: 'Datos Incompletos',
        mensaje: 'Selecciona una refacción y una cantidad válida mayor a 0.',
      })
      return
    }

    setGuardandoMov(true)
    try {
      const artEncontrado = articulos.find(a => 
        (articuloMovId && a.id === Number(articuloMovId)) || 
        a.nombre_normalizado.toLowerCase() === articuloMovDesc.toLowerCase()
      )

      const stockPrevio = artEncontrado ? artEncontrado.stock_actual : 0
      let nuevoStock = stockPrevio

      if (tipoMov === 'ENTRADA' || tipoMov === 'AJUSTE ENTRADA') {
        nuevoStock = stockPrevio + cantMov
      } else {
        nuevoStock = Math.max(0, stockPrevio - cantMov)
      }

      // 1. Guardar en la bitácora de movimientos (Kardex)
      const nuevoMov = await registrarMovimientoInventario({
        numero_parte: articuloMovParte || artEncontrado?.numero_parte || null,
        descripcion_parte: articuloMovDesc,
        proveedor: proveedorMov || null,
        tipo_transaccion: tipoMov,
        cantidad: cantMov,
        balance: nuevoStock,
        fecha: fechaMov,
        solicitante: solicitanteMov,
        departamento: departamentoMov,
        autorizado_por: autorizadoPorMov,
        comentarios: comentariosMov || null,
      })

      setMovimientos(prev => [nuevoMov, ...prev])

      // 2. Si el artículo existe en la base de datos, actualizar su stock_actual
      if (artEncontrado) {
        await actualizarArticuloAlmacen(artEncontrado.id, {
          stock_actual: nuevoStock,
        }).catch(console.error)

        setArticulos(prev => prev.map(a => a.id === artEncontrado.id ? { ...a, stock_actual: nuevoStock } : a))
      }

      setModalMovimientoAbierto(false)
      agregarToast({
        tipo: 'success',
        titulo: 'Transacción Registrada',
        mensaje: `${tipoMov}: ${cantMov} pz de "${articuloMovDesc}". Balance actualizado: ${nuevoStock} pz.`,
      })
    } catch (err: unknown) {
      agregarToast({
        tipo: 'error',
        titulo: 'Error al Registrar',
        mensaje: err instanceof Error ? err.message : 'No se pudo guardar la transacción.',
      })
    } finally {
      setGuardandoMov(false)
    }
  }

  // Exportar Control de Inventario Mensual (CSV)
  const exportarCSV = () => {
    try {
      const csvStr = exportarMovimientosACSV(movimientos)
      const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Control_de_Inventario_Mensual_${new Date().getFullYear()}_WarHorse.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      agregarToast({
        tipo: 'success',
        titulo: 'CSV Exportado',
        mensaje: `Se descargó el archivo con ${movimientos.length} registros en el formato oficial.`,
      })
    } catch {
      agregarToast({
        tipo: 'error',
        titulo: 'Error de Exportación',
        mensaje: 'No se pudo generar el archivo CSV.',
      })
    }
  }

  // Importar CSV Oficial desde archivo de usuario
  const manejarImportacionCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const texto = event.target?.result as string
      if (!texto) return

      try {
        const resultado = await importarMovimientosDesdeCSV(texto)
        if (resultado.total > 0) {
          const actualizados = await obtenerMovimientosInventario()
          setMovimientos(actualizados)
          agregarToast({
            tipo: 'success',
            titulo: 'Inventario Sincronizado',
            mensaje: `Se importaron exitosamente ${resultado.agregados} movimientos desde el archivo CSV.`,
          })
        } else {
          agregarToast({
            tipo: 'warning',
            titulo: 'Sin Datos Válidos',
            mensaje: 'No se detectaron filas válidas en el formato oficial del CSV.',
          })
        }
      } catch {
        agregarToast({
          tipo: 'error',
          titulo: 'Error al Importar',
          mensaje: 'Ocurrió un error al procesar el archivo CSV.',
        })
      } finally {
        if (archivoCsvRef.current) archivoCsvRef.current.value = ''
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  // Requisición directa de reabastecimiento
  const solicitarReabastecimiento = (art: ArticuloAlmacenApi) => {
    const cantidadSugerida = (art.stock_maximo || 5) - art.stock_actual
    const cant = cantidadSugerida > 0 ? cantidadSugerida : 1
    const folioReq = `REQ-STOCK-${Math.floor(10000 + Math.random() * 90000)}`

    const detalle: DetalleRequisicion = {
      folio: folioReq,
      fecha: new Date().toISOString().substring(0, 10),
      solicitante: 'Coordinación de Almacén / Stock',
      tipo_destino: 'Stock',
      justificacion: `Reabastecimiento por stock crítico (${art.stock_actual} en almacén, mínimo requerido: ${art.stock_minimo || 2}).`,
      items: [
        {
          pieza: art.nombre_normalizado,
          cantidad: cant,
          motivo: `Pieza bajo stock de seguridad (No. Parte: ${art.numero_parte || 'S/N'})`,
        },
      ],
      estado: 'Pendiente',
    }

    setReqEmitida(detalle)
    setReqModalAbierto(true)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Input Oculto para Importación de CSV */}
      <input
        type="file"
        ref={archivoCsvRef}
        onChange={manejarImportacionCSV}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Encabezado Principal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#C5A059]/20 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Módulo de Compras & Abasto
            </span>
            <span className="text-xs text-[#B8B2A6]">|</span>
            <span className="rounded bg-[#F2620F]/20 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Control de Inventario Mensual 2026
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-white">
            Inventario General y Control Mensual de Almacén
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Formato oficial homologado: existencias físicas, valoración contable y bitácora Kardex de 12 columnas por taller y proveedor.
          </p>
        </div>

        {/* Acciones Globales */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ir a Cola de Compras */}
          <button
            type="button"
            onClick={() => navigate('/compras/cola')}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            title="Ir a la Cola de Requisiciones de Compras"
          >
            <ShoppingCart className="h-4 w-4 text-[#F2620F]" />
            <span>Cola de Compras</span>
          </button>

          {/* Botón Importar CSV */}
          <button
            type="button"
            onClick={() => archivoCsvRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
            title="Cargar archivo CSV oficial de inventario mensual"
          >
            <Upload className="h-4 w-4 text-[#C5A059]" />
            <span>Importar CSV</span>
          </button>

          {/* Botón Exportar CSV */}
          <button
            type="button"
            onClick={exportarCSV}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
            title="Descargar plantilla de 12 columnas en formato CSV"
          >
            <Download className="h-4 w-4 text-[#3FA65C]" />
            <span>Exportar CSV</span>
          </button>

          {/* Botón Registrar Transacción */}
          <button
            type="button"
            onClick={() => abrirModalMovimientoConArticulo()}
            className="flex items-center gap-1.5 rounded-xl bg-[#C5A059] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-black shadow-lg hover:bg-[#b08e4d] transition-all cursor-pointer"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Registrar Movimiento</span>
          </button>

          {/* Botón Nuevo SKU */}
          <button
            type="button"
            onClick={() => setModalNuevoAbierto(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#F2620F] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#F2620F]/20 hover:bg-[#d8550b] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo SKU</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SKUs en Catálogo */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8B2A6]">
              SKUs en Catálogo
            </span>
            <div className="rounded-xl bg-[#C5A059]/20 p-2 text-[#C5A059]">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-['Barlow_Condensed'] text-3xl font-extrabold text-white tabular-nums">
            {totalArticulos}
          </div>
          <div className="mt-1 text-[11px] text-[#B8B2A6]">
            Refacciones catalogadas
          </div>
        </div>

        {/* Valorización Total */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8B2A6]">
              Valorización en Almacén
            </span>
            <div className="rounded-xl bg-[#3FA65C]/20 p-2 text-[#3FA65C]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-['Barlow_Condensed'] text-3xl font-extrabold text-[#3FA65C] tabular-nums">
            ${valorTotalInventario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
          </div>
          <div className="mt-1 text-[11px] text-[#B8B2A6]">
            Inversión activa en existencias
          </div>
        </div>

        {/* Movimientos del Periodo */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8B2A6]">
              Movimientos en Kardex
            </span>
            <div className="rounded-xl bg-[#F2620F]/20 p-2 text-[#F2620F]">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-['Barlow_Condensed'] text-3xl font-extrabold text-white tabular-nums flex items-baseline gap-2">
            <span>{totalMovimientos}</span>
            <span className="text-xs text-[#B8B2A6] font-normal">
              (🔴 {totalSalidas} sal / 🟢 {totalEntradas} ent)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#B8B2A6]">
            Transacciones de control mensual
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8B2A6]">
              Alertas de Reabasto
            </span>
            <div className="rounded-xl bg-[#E0C36A]/20 p-2 text-[#E0C36A]">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-['Barlow_Condensed'] text-3xl font-extrabold text-[#E0C36A] tabular-nums flex items-baseline gap-2">
            <span>{articulosAgotados + articulosBajoMinimo}</span>
            <span className="text-xs text-[#F2620F] font-semibold">
              ({articulosAgotados} agotados)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#B8B2A6]">
            Derivan a compra o reabasto
          </div>
        </div>
      </div>

      {/* Selector de Pestañas de Vista Dual */}
      <div className="flex items-center gap-2 border-b border-[rgba(243,239,231,0.1)] pb-2">
        <button
          type="button"
          onClick={() => setPestañaActiva('existencias')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            pestañaActiva === 'existencias'
              ? 'bg-[#F2620F] text-white shadow-md'
              : 'bg-[#14181D] text-[#B8B2A6] hover:text-white border border-[rgba(243,239,231,0.08)]'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>1. Catálogo Maestro y Existencias en Tiempo Real</span>
          <span className="rounded bg-black/30 px-2 py-0.5 text-xs font-mono">
            {articulosFiltrados.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestañaActiva('kardex')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
            pestañaActiva === 'kardex'
              ? 'bg-[#C5A059] text-black shadow-md'
              : 'bg-[#14181D] text-[#B8B2A6] hover:text-white border border-[rgba(243,239,231,0.08)]'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>2. Control de Inventario Mensual (Kardex de 12 Columnas)</span>
          <span className="rounded bg-black/20 px-2 py-0.5 text-xs font-mono font-bold">
            {movimientosFiltrados.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: CATÁLOGO MAESTRO Y EXISTENCIAS (STOCK) */}
      {/* ========================================================================= */}
      {pestañaActiva === 'existencias' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8B2A6]" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por descripción, número de parte o categoría..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#B8B2A6]/60 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#B8B2A6] mr-1 hidden md:inline">Nivel de Stock:</span>
                {(['Todos', 'Criticos', 'Bajo', 'Optimo'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltroStock(f)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      filtroStock === f
                        ? 'bg-[#C5A059] text-black'
                        : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                    }`}
                  >
                    {f === 'Todos' ? 'Todos' : f === 'Criticos' ? 'Agotados (0)' : f === 'Bajo' ? 'Bajo Mínimo' : 'Óptimo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-[rgba(243,239,231,0.08)] pt-3 scrollbar-none">
              {categorias.map(cat => {
                const esActiva = categoriaActiva === cat
                const esCatYonke = cat === 'Yonke'
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaActiva(cat)}
                    className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      esActiva
                        ? esCatYonke
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-900 font-bold'
                          : 'bg-[#F2620F]/20 text-[#F2620F] border border-[#F2620F]/40'
                        : esCatYonke
                        ? 'bg-purple-950/30 text-purple-300 border border-purple-500/30 hover:bg-purple-950/60'
                        : 'bg-[#1C1C1C] text-[#B8B2A6] hover:border-[rgba(243,239,231,0.2)] hover:text-white'
                    }`}
                  >
                    {esCatYonke ? '🟣 Yonke (Stock Usado)' : cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tabla de Existencias */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[rgba(243,239,231,0.12)] bg-[#1C1C1C] font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
                    <th className="py-3 px-4">SKU / ID</th>
                    <th className="py-3 px-4">Refacción / Descripción</th>
                    <th className="py-3 px-4">No. de Parte</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                    <th className="py-3 px-4 text-center">Mín / Máx</th>
                    <th className="py-3 px-4 text-right">Precio Ref.</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(243,239,231,0.06)]">
                  {cargando ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#B8B2A6]">
                        <RotateCw className="h-6 w-6 animate-spin mx-auto text-[#C5A059] mb-2" />
                        Cargando catálogo de almacén...
                      </td>
                    </tr>
                  ) : articulosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#B8B2A6]">
                        No se encontraron artículos con los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    articulosFiltrados.map(art => {
                      const esAgotado = art.stock_actual <= 0
                      const esBajo = !esAgotado && art.stock_minimo !== null && art.stock_actual <= art.stock_minimo
                      const valorTotalArt = (art.stock_actual || 0) * (art.precio_referencia || 0)

                      return (
                        <tr key={art.id} className="hover:bg-[#1C1C1C]/60 transition-colors group">
                          <td className="py-3 px-4 font-mono font-bold text-[#C5A059]">
                            SKU-{String(art.id).padStart(4, '0')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">
                              {art.nombre_normalizado}
                            </div>
                            {art.categoria === 'Yonke' ? (
                              <span className="inline-flex items-center gap-1 mt-0.5 rounded bg-purple-950/80 border border-purple-500/50 px-2 py-0.5 text-[10px] font-bold text-purple-200 uppercase">
                                <Recycle className="h-2.5 w-2.5 text-purple-300" /> Yonke (Stock Usado)
                              </span>
                            ) : (
                              <span className="inline-block mt-0.5 rounded bg-[rgba(243,239,231,0.06)] px-1.5 py-0.2 text-[10px] text-[#B8B2A6]">
                                {art.categoria || 'Preventivos'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#B8B2A6]">
                            {art.numero_parte || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-['Barlow_Condensed'] text-sm font-bold tabular-nums ${
                              esAgotado 
                                ? 'bg-[#F2620F]/20 text-[#F2620F] border border-[#F2620F]/30'
                                : esBajo
                                ? 'bg-[#E0C36A]/20 text-[#E0C36A] border border-[#E0C36A]/30'
                                : 'bg-[#3FA65C]/20 text-[#3FA65C] border border-[#3FA65C]/30'
                            }`}>
                              {art.stock_actual} pz
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-[#B8B2A6] tabular-nums font-mono">
                            {art.stock_minimo ?? '—'} / {art.stock_maximo ?? '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-white tabular-nums">
                            ${(art.precio_referencia || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#3FA65C] tabular-nums">
                            ${valorTotalArt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {esAgotado ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[#F2620F]/15 px-2 py-0.5 text-[11px] font-bold text-[#F2620F]">
                                <AlertTriangle className="h-3 w-3" /> Agotado
                              </span>
                            ) : esBajo ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[#E0C36A]/15 px-2 py-0.5 text-[11px] font-bold text-[#E0C36A]">
                                <AlertTriangle className="h-3 w-3" /> Bajo Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-[#3FA65C]/15 px-2 py-0.5 text-[11px] font-bold text-[#3FA65C]">
                                <CheckCircle2 className="h-3 w-3" /> Óptimo
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Registrar Movimiento Rápido */}
                              <button
                                type="button"
                                onClick={() => abrirModalMovimientoConArticulo(art)}
                                className="flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-2 py-1 text-[11px] font-semibold text-[#f3f4f6] hover:border-[#C5A059] hover:text-[#C5A059] transition-all cursor-pointer"
                                title="Registrar Entrada / Salida en Kardex"
                              >
                                <ArrowUpDown className="h-3 w-3" />
                                <span>Movimiento</span>
                              </button>

                              {/* Ver Kardex */}
                              <button
                                type="button"
                                onClick={() => verHistorialArticulo(art)}
                                className="flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-2 py-1 text-[11px] font-semibold text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
                                title="Ver bitácora mensual de esta pieza"
                              >
                                <FileSpreadsheet className="h-3 w-3" />
                                <span>Kardex</span>
                              </button>

                              {/* Reabastecer a Compras */}
                              {(esAgotado || esBajo) && (
                                <button
                                  type="button"
                                  onClick={() => solicitarReabastecimiento(art)}
                                  className="flex items-center gap-1 rounded-lg bg-[#F2620F]/20 border border-[#F2620F]/40 px-2 py-1 text-[11px] font-bold text-[#F2620F] hover:bg-[#F2620F] hover:text-white transition-all cursor-pointer"
                                  title="Emitir requisición a compras"
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  <span>Pedir</span>
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

      {/* ========================================================================= */}
      {/* PESTAÑA 2: CONTROL DE INVENTARIO MENSUAL (KARDEX OFICIAL DE 12 COLUMNAS) */}
      {/* ========================================================================= */}
      {pestañaActiva === 'kardex' && (
        <div className="space-y-4">
          {/* Filtros Especializados del Kardex */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Buscador de Movimientos */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8B2A6]" />
                <input
                  type="text"
                  value={busquedaKardex}
                  onChange={e => setBusquedaKardex(e.target.value)}
                  placeholder="Buscar en el Kardex por pieza, proveedor, solicitante, autorizador o comentario..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#B8B2A6]/60 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* Selector de Departamento */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#B8B2A6]">Depto:</span>
                <select
                  value={filtroDeptoKardex}
                  onChange={e => setFiltroDeptoKardex(e.target.value)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs font-bold text-white focus:border-[#C5A059] focus:outline-none"
                >
                  <option value="Todos">Todos los Deptos</option>
                  <option value="TALLER CAJAS">TALLER CAJAS</option>
                  <option value="TALLER TRACTOS">TALLER TRACTOS</option>
                  <option value="AMBOS TALLERES">AMBOS TALLERES</option>
                  <option value="RH">RH / OFICINA</option>
                  <option value="TRÁFICO">TRÁFICO</option>
                </select>
              </div>

              {/* Selector de Tipo de Movimiento */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#B8B2A6]">Tipo:</span>
                <select
                  value={filtroTipoKardex}
                  onChange={e => setFiltroTipoKardex(e.target.value)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs font-bold text-white focus:border-[#C5A059] focus:outline-none"
                >
                  <option value="Todos">Todas las Transacciones</option>
                  <option value="SALIDA">🔴 Salidas (Consumo)</option>
                  <option value="ENTRADA">🟢 Entradas (Compras)</option>
                  <option value="AJUSTE ENTRADA">🔵 Ajuste Entrada (Inicial)</option>
                  <option value="AJUSTE SALIDA">🟡 Ajuste Salida (Merma)</option>
                </select>
              </div>

              {/* Selector de Mes */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#B8B2A6]">Mes:</span>
                <select
                  value={filtroMesKardex}
                  onChange={e => setFiltroMesKardex(e.target.value)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs font-bold text-white focus:border-[#C5A059] focus:outline-none"
                >
                  <option value="Todos">Todos los Meses</option>
                  <option value="1">Enero 2026</option>
                  <option value="2">Febrero 2026</option>
                  <option value="3">Marzo 2026</option>
                </select>
              </div>
            </div>

            {/* Chips de Departamento Rápido */}
            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs text-[#B8B2A6]">
              <div className="flex items-center gap-2">
                <span>Viendo:</span>
                <span className="font-bold text-white">{movimientosFiltrados.length} registros</span>
                {busquedaKardex && (
                  <button
                    type="button"
                    onClick={() => setBusquedaKardex('')}
                    className="text-[#F2620F] hover:underline cursor-pointer"
                  >
                    (Limpiar filtro de búsqueda)
                  </button>
                )}
              </div>
              <div className="text-[11px] text-[#C5A059]">
                Formato exacto de 12 columnas: Control_de_Inventario_Mensual_2026
              </div>
            </div>
          </div>

          {/* Tabla de 12 Columnas Oficial */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] shadow-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 border-b border-[rgba(243,239,231,0.12)] bg-[#1C1C1C] font-['Barlow_Condensed'] text-[11px] font-bold uppercase tracking-wider text-[#B8B2A6]">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">No. de Parte</th>
                    <th className="py-2.5 px-3">Descripción de Parte</th>
                    <th className="py-2.5 px-3">Proveedor</th>
                    <th className="py-2.5 px-3 text-center">Tipo Transacción</th>
                    <th className="py-2.5 px-2 text-center w-16">Cant</th>
                    <th className="py-2.5 px-2 text-center w-16">Balance</th>
                    <th className="py-2.5 px-3 text-center w-24">Fecha</th>
                    <th className="py-2.5 px-3">Solicitante</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3">Autorizado por:</th>
                    <th className="py-2.5 px-3">Comentarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(243,239,231,0.05)]">
                  {movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-[#B8B2A6]">
                        No se encontraron transacciones en la bitácora mensual con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((m, idx) => {
                      const esEntrada = m.tipo_transaccion === 'ENTRADA'
                      const esSalida = m.tipo_transaccion === 'SALIDA'
                      const esAjusteEntrada = m.tipo_transaccion === 'AJUSTE ENTRADA'
                      const esAjusteSalida = m.tipo_transaccion === 'AJUSTE SALIDA'

                      const badgeClass = esEntrada
                        ? 'bg-[#3FA65C]/20 text-[#3FA65C] border-[#3FA65C]/30'
                        : esSalida
                        ? 'bg-[#F2620F]/20 text-[#F2620F] border-[#F2620F]/30'
                        : esAjusteEntrada
                        ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30'
                        : esAjusteSalida
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-white/10 text-white border-white/20'

                      return (
                        <tr key={idx} className="hover:bg-[#1C1C1C]/60 transition-colors">
                          <td className="py-2 px-3 text-center font-mono text-[#B8B2A6]">
                            {m.id}
                          </td>
                          <td className="py-2 px-3 font-mono text-white">
                            {m.numero_parte || '—'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-white">
                            {m.descripcion_parte}
                          </td>
                          <td className="py-2 px-3 text-[#B8B2A6] capitalize">
                            {m.proveedor || '—'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeClass}`}>
                              {m.tipo_transaccion}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-white">
                            {m.cantidad}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#C5A059] tabular-nums">
                            {m.balance}
                          </td>
                          <td className="py-2 px-3 text-center text-[#B8B2A6] font-mono text-[11px]">
                            {m.fecha}
                          </td>
                          <td className="py-2 px-3 font-medium text-white">
                            {m.solicitante || '—'}
                          </td>
                          <td className="py-2 px-3">
                            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[#B8B2A6] font-semibold uppercase">
                              {m.departamento || 'SELECCIONAR'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#B8B2A6] text-[11px]">
                            {m.autorizado_por || '—'}
                          </td>
                          <td className="py-2 px-3 text-[#B8B2A6] text-[11px] max-w-xs truncate">
                            {m.comentarios || '—'}
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

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR TRANSACCIÓN OFICIAL DE ALMACÉN */}
      {/* ========================================================================= */}
      {modalMovimientoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-[rgba(243,239,231,0.2)] bg-[#14181D] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <ArrowUpDown className="h-5 w-5 text-[#C5A059]" />
                <div>
                  <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
                    Registrar Movimiento en Control Mensual
                  </h3>
                  <p className="text-[11px] text-[#B8B2A6]">
                    Actualiza el balance del inventario y registra la entrada, salida o ajuste en la bitácora oficial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMovimientoAbierto(false)}
                className="text-[#B8B2A6] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={ejecutarRegistroMovimiento} className="p-6 space-y-4">
              {/* Selector o Ingreso de Refacción */}
              <div>
                <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                  Refacción / Descripción de Parte *
                </label>
                <input
                  type="text"
                  required
                  value={articuloMovDesc}
                  onChange={e => {
                    setArticuloMovDesc(e.target.value)
                    const match = articulos.find(a => a.nombre_normalizado.toLowerCase() === e.target.value.toLowerCase())
                    if (match) {
                      setArticuloMovId(match.id)
                      setArticuloMovParte(match.numero_parte || '')
                    }
                  }}
                  placeholder="Ej. plafon redondo rojo 4, wiper 22, tornillo 5/8x2..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* No. de Parte */}
                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Número de Parte (Opcional)
                  </label>
                  <input
                    type="text"
                    value={articuloMovParte}
                    onChange={e => setArticuloMovParte(e.target.value)}
                    placeholder="Ej. 2972800, 46305, etc."
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                {/* Proveedor */}
                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={proveedorMov}
                    onChange={e => setProveedorMov(e.target.value)}
                    placeholder="Ej. Diesel Parts, Apymsa, Tarango, Cemaco..."
                    list="lista-proveedores"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none"
                  />
                  <datalist id="lista-proveedores">
                    {PROVEEDORES_FRECUENTES.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Tipo de Transacción y Cantidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Tipo de Transacción *
                  </label>
                  <select
                    value={tipoMov}
                    onChange={e => setTipoMov(e.target.value as TipoTransaccionInventario)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 font-['Barlow_Condensed'] text-xs font-bold text-white focus:border-[#C5A059] focus:outline-none"
                  >
                    <option value="SALIDA">🔴 SALIDA (Despacho / Consumo)</option>
                    <option value="ENTRADA">🟢 ENTRADA (Compra a Proveedor)</option>
                    <option value="AJUSTE ENTRADA">🔵 AJUSTE ENTRADA (Inventario Inicial)</option>
                    <option value="AJUSTE SALIDA">🟡 AJUSTE SALIDA (Merma o Corrección)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantMov}
                    onChange={e => setCantMov(Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 font-mono text-xs font-bold text-white focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Solicitante y Departamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Solicitante (Mecánico o Unidad)
                  </label>
                  <input
                    type="text"
                    value={solicitanteMov}
                    onChange={e => setSolicitanteMov(e.target.value)}
                    placeholder="Ej. FRAGA, HECTOR, JAZ, BUJANDA, WH-35..."
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Departamento Destino
                  </label>
                  <select
                    value={departamentoMov}
                    onChange={e => setDepartamentoMov(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs font-semibold text-white focus:border-[#C5A059] focus:outline-none"
                  >
                    {DEPARTAMENTOS_ALMACEN.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Autorizado por y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Autorizado por:
                  </label>
                  <input
                    type="text"
                    value={autorizadoPorMov}
                    onChange={e => setAutorizadoPorMov(e.target.value)}
                    placeholder="Ej. JESUS SOTO, ALAN, MONTZAY..."
                    list="lista-autorizadores"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none"
                  />
                  <datalist id="lista-autorizadores">
                    {AUTORIZADORES_FRECUENTES.map(a => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Fecha de Movimiento
                  </label>
                  <input
                    type="date"
                    value={fechaMov}
                    onChange={e => setFechaMov(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                  Comentarios / Referencia de OT (Opcional)
                </label>
                <input
                  type="text"
                  value={comentariosMov}
                  onChange={e => setComentariosMov(e.target.value)}
                  placeholder="Ej. OT-2026-0801, Reparación de frenos tractor WH-101..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(243,239,231,0.1)]">
                <button
                  type="button"
                  onClick={() => setModalMovimientoAbierto(false)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-4 py-2 text-xs font-semibold text-[#B8B2A6] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoMov}
                  className="rounded-xl bg-[#C5A059] px-6 py-2 text-xs font-bold uppercase text-black hover:bg-[#b08e4d] transition-all cursor-pointer"
                >
                  {guardandoMov ? 'Registrando...' : 'Registrar en Kardex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO SKU EN CATÁLOGO */}
      {/* ========================================================================= */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-[rgba(243,239,231,0.2)] bg-[#14181D] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#F2620F]" />
                <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
                  Registrar Nuevo SKU en Catálogo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="text-[#B8B2A6] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardarNuevoArticulo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                  Descripción o Nombre Estandarizado *
                </label>
                <input
                  type="text"
                  required
                  value={nombreNormalizado}
                  onChange={e => setNombreNormalizado(e.target.value)}
                  placeholder="Ej. Balatas 4703 Duroline, Plafon redondo rojo 4, Wiper 22..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Categoría
                  </label>
                  <select
                    value={categoriaNuevo}
                    onChange={e => setCategoriaNuevo(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs font-semibold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="Frenos">Frenos</option>
                    <option value="Suspensión">Suspensión</option>
                    <option value="Preventivos">Preventivos</option>
                    <option value="Filtros">Filtros</option>
                    <option value="Aceites">Aceites y Fluidos</option>
                    <option value="Eléctrico">Eléctrico e Iluminación</option>
                    <option value="Tornillería">Tornillería y Herrajes</option>
                    <option value="Yonke">🟣 Yonke (Pieza de Stock Usada)</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Número de Parte
                  </label>
                  <input
                    type="text"
                    value={numeroParteNuevo}
                    onChange={e => setNumeroParteNuevo(e.target.value)}
                    placeholder="Ej. 2972800, TRB-3200..."
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Proveedor Habitual
                  </label>
                  <input
                    type="text"
                    value={proveedorNuevo}
                    onChange={e => setProveedorNuevo(e.target.value)}
                    placeholder="Ej. Diesel Parts, Apymsa, Tarango..."
                    list="lista-prov-nuevo"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                  <datalist id="lista-prov-nuevo">
                    {PROVEEDORES_FRECUENTES.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#B8B2A6] mb-1">
                    Precio Referencia ($ MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioReferenciaNuevo}
                    onChange={e => setPrecioReferenciaNuevo(Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#B8B2A6] mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockActualNuevo}
                    onChange={e => setStockActualNuevo(Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 font-mono text-xs font-bold text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#B8B2A6] mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockMinimoNuevo}
                    onChange={e => setStockMinimoNuevo(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 font-mono text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#B8B2A6] mb-1">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockMaximoNuevo}
                    onChange={e => setStockMaximoNuevo(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 font-mono text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="validarLimitesNuevo"
                  checked={validarLimitesNuevo}
                  onChange={e => setValidarLimitesNuevo(e.target.checked)}
                  className="rounded border-[rgba(243,239,231,0.2)] bg-[#1C1C1C] text-[#F2620F] focus:ring-0"
                />
                <label htmlFor="validarLimitesNuevo" className="text-xs text-[#B8B2A6] cursor-pointer">
                  Activar alertas automáticas cuando el stock caiga por debajo del mínimo
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(243,239,231,0.1)]">
                <button
                  type="button"
                  onClick={() => setModalNuevoAbierto(false)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-4 py-2 text-xs font-semibold text-[#B8B2A6] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNuevo}
                  className="rounded-xl bg-[#F2620F] px-6 py-2 text-xs font-bold uppercase text-white hover:bg-[#d8550b] transition-all cursor-pointer"
                >
                  {guardandoNuevo ? 'Guardando...' : 'Guardar SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Requisición Directa a Compras */}
      <RequisicionCompraModal
        requisicion={reqEmitida}
        abierto={reqModalAbierto}
        alCerrar={() => setReqModalAbierto(false)}
      />
    </div>
  )
}

export default ComprasInventario
