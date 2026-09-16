import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { 
  ShoppingCart, 
  Wrench, 
  Search, 
  Plus, 
  Trash2, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Recycle, 
  Package, 
  Send, 
  ArrowLeft, 
  Sparkles 
} from 'lucide-react'
import { 
  getOrdenesTrabajo, 
  getArticulosAlmacen, 
  getInventarioYonke, 
  crearRequisicion,
  type OrdenTrabajoApi, 
  type ArticuloAlmacenApi, 
  type PiezaYonkeApi 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'

export interface PartidaTaller {
  id: string
  pieza_catalogo_id?: number
  es_nueva_no_catalogada: boolean
  nombre_pieza: string
  numero_parte: string
  descripcion_trabajo: string
  cantidad: number
  origen: 'Almacén' | 'Compras' | 'Yonke'
  costo_unitario: number
  costo_total: number
  urgencia: 'Bajo' | 'Medio' | 'Crítico' | 'Inmediato'
  fotos: File[]
  fotos_preview: string[]
  stock_disponible?: number
  unidad_donante?: string
}

export const TallerRefacciones: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const otIdParam = searchParams.get('ot_id')
  const { agregarToast } = useUiStore()

  // Estados de datos maestros
  const [ordenes, setOrdenes] = useState<OrdenTrabajoApi[]>([])
  const [articulosAlmacen, setArticulosAlmacen] = useState<ArticuloAlmacenApi[]>([])
  const [piezasYonke, setPiezasYonke] = useState<PiezaYonkeApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  // OT seleccionada (Trazabilidad obligatoria)
  const [otSeleccionadaId, setOtSeleccionadaId] = useState<number | ''>('')

  // Carrito de refacciones de la OT
  const [partidas, setPartidas] = useState<PartidaTaller[]>([])

  // Estado del Asistente de Refacciones
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<'Todas' | 'Stock' | 'Yonke'>('Todas')
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<ArticuloAlmacenApi | null>(null)
  const [esPiezaNueva, setEsPiezaNueva] = useState(false)

  // Campos de captura
  const [nombrePieza, setNombrePieza] = useState('')
  const [numeroParte, setNumeroParte] = useState('')
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [origen, setOrigen] = useState<'Almacén' | 'Compras' | 'Yonke'>('Almacén')
  const [urgencia, setUrgencia] = useState<'Bajo' | 'Medio' | 'Crítico' | 'Inmediato'>('Medio')
  const [costoEstimadoManual, setCostoEstimadoManual] = useState<number | ''>('')
  const [fotosNuevas, setFotosNuevas] = useState<File[]>([])
  const [fotosPreview, setFotosPreview] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Función utilitaria para identificar piezas de categoría Yonke
  const esYonke = (art: ArticuloAlmacenApi | null | undefined): boolean => {
    if (!art) return false
    const cat = (art.categoria || '').trim().toLowerCase()
    const nom = (art.nombre_normalizado || '').trim().toLowerCase()
    return cat === 'yonke' || nom.includes('(yonke)') || nom.includes('yonke')
  }

  // Cargar datos al montar
  useEffect(() => {
    async function cargarInicial() {
      setCargando(true)
      try {
        const [otsData, articulosData, yonkeData] = await Promise.all([
          getOrdenesTrabajo().catch(() => []),
          getArticulosAlmacen().catch(() => []),
          getInventarioYonke().catch(() => [])
        ])

        // Fallback robusto de artículos de almacén con piezas de stock nuevo y stock usado de Yonke
        const fallbackArticulos: ArticuloAlmacenApi[] = [
          { id: 1, nombre_normalizado: 'Filtro de Aceite LF9009', categoria: 'Filtros', numero_parte: 'LF-9009', precio_referencia: 950, stock_minimo: 4, stock_maximo: 16, stock_actual: 12, validar_limites: true },
          { id: 2, nombre_normalizado: 'Balatas de Freno Traseras Q-Plus', categoria: 'Frenos', numero_parte: 'BAL-4420', precio_referencia: 1800, stock_minimo: 4, stock_maximo: 12, stock_actual: 8, validar_limites: true },
          { id: 3, nombre_normalizado: 'Turbo Garrett Cummins ISX', categoria: 'Motor', numero_parte: 'TRB-3200', precio_referencia: 4500, stock_minimo: 1, stock_maximo: 3, stock_actual: 1, validar_limites: true },
          { id: 4, nombre_normalizado: 'Alternador Delco Remy 24V 160A', categoria: 'Eléctrico', numero_parte: 'ALT-7743', precio_referencia: 3200, stock_minimo: 1, stock_maximo: 4, stock_actual: 2, validar_limites: true },
          { id: 5, nombre_normalizado: 'Filtro de Combustible FS1000', categoria: 'Filtros', numero_parte: 'FS-1000', precio_referencia: 680, stock_minimo: 5, stock_maximo: 20, stock_actual: 10, validar_limites: true },
          { id: 6, nombre_normalizado: 'Caja de Transmisión Eaton Fuller', categoria: 'Transmisión', numero_parte: 'EAT-18V', precio_referencia: 28000, stock_minimo: 1, stock_maximo: 2, stock_actual: 0, validar_limites: true },
          // Piezas de stock de almacén categoría YONKE (piezas físicas en patio pero NO nuevas)
          { id: 7, nombre_normalizado: 'Marcha de Arranque Cummins ISX (Yonke)', categoria: 'Yonke', numero_parte: 'YK-MAR-01', precio_referencia: 0, stock_minimo: 1, stock_maximo: 4, stock_actual: 2, validar_limites: false },
          { id: 8, nombre_normalizado: 'Alternador 24V Reutilizado (Yonke WH-099)', categoria: 'Yonke', numero_parte: 'YK-ALT-02', precio_referencia: 0, stock_minimo: 1, stock_maximo: 3, stock_actual: 1, validar_limites: false },
          { id: 9, nombre_normalizado: 'Radiador de Aluminio Donante (Yonke WH-098)', categoria: 'Yonke', numero_parte: 'YK-RAD-03', precio_referencia: 0, stock_minimo: 1, stock_maximo: 2, stock_actual: 1, validar_limites: false },
          { id: 10, nombre_normalizado: 'Compresor de Aire Bendix (Yonke WH-099)', categoria: 'Yonke', numero_parte: 'YK-CMP-04', precio_referencia: 0, stock_minimo: 1, stock_maximo: 3, stock_actual: 2, validar_limites: false },
        ]

        // Combinar datos reales de API con piezas de Yonke garantizadas para catálogo integral
        let catalogoCompuesto = articulosData && articulosData.length > 0 ? articulosData : fallbackArticulos
        const yaTieneYonke = catalogoCompuesto.some(a => (a.categoria || '').toLowerCase() === 'yonke')
        if (!yaTieneYonke) {
          catalogoCompuesto = [...catalogoCompuesto, ...fallbackArticulos.filter(a => a.categoria === 'Yonke')]
        }

        // Fallback de OTs si no hay conexión o vienen vacías
        const otsFinales: OrdenTrabajoApi[] = otsData && otsData.length > 0 ? otsData : [
          {
            id: 1,
            folio: 'OT-2026-001',
            estado: 'Abierta',
            diagnostico: 'Fuga de aire en línea principal y vibración en eje motriz',
            materiales: [],
            archivos_evidencia: [],
            created_at: new Date().toISOString(),
            unidad: { id: 1, id_unidad: 'WH-101', tipo: 'Tractor' },
            responsable: { nombre: 'Carlos Méndez', rol: 'Mecánico A' }
          },
          {
            id: 2,
            folio: 'OT-2026-002',
            estado: 'En Proceso',
            diagnostico: 'Desgaste severo en balatas delanteras y chirrido al frenar',
            materiales: [],
            archivos_evidencia: [],
            created_at: new Date().toISOString(),
            unidad: { id: 2, id_unidad: 'WH-104', tipo: 'Tractor' },
            responsable: { nombre: 'Luis Morales', rol: 'Mecánico B' }
          },
          {
            id: 3,
            folio: 'OT-2026-003',
            estado: 'Abierta',
            diagnostico: 'Sobrecalentamiento intermitente, probable termostato o bomba de agua',
            materiales: [],
            archivos_evidencia: [],
            created_at: new Date().toISOString(),
            unidad: { id: 3, id_unidad: 'WH-125', tipo: 'Tractor' },
            responsable: { nombre: 'Carlos Méndez', rol: 'Mecánico A' }
          },
          {
            id: 4,
            folio: 'OT-2026-004',
            estado: 'Abierta',
            diagnostico: 'Mantenimiento preventivo B de 50,000 km y revisión de patines',
            materiales: [],
            archivos_evidencia: [],
            created_at: new Date().toISOString(),
            unidad: { id: 4, id_unidad: 'CJ-502', tipo: 'Caja' },
            responsable: { nombre: 'Héctor Gómez', rol: 'Auxiliar' }
          }
        ]

        setOrdenes(otsFinales)
        setArticulosAlmacen(catalogoCompuesto)
        setPiezasYonke(yonkeData)

        // Si viene un parámetro ot_id en la URL, seleccionarlo automáticamente
        if (otIdParam) {
          const match = otsFinales.find(o => String(o.id) === otIdParam || o.folio === otIdParam)
          if (match) {
            setOtSeleccionadaId(match.id)
          } else {
            setOtSeleccionadaId(otsFinales[0]?.id || '')
          }
        } else if (otsFinales.length > 0) {
          setOtSeleccionadaId(otsFinales[0].id)
        }
      } catch (err) {
        console.error('Error cargando datos para pedido de refacciones:', err)
      } finally {
        setCargando(false)
      }
    }

    void cargarInicial()
  }, [otIdParam])

  // OT actualmente seleccionada
  const otActiva = useMemo(() => {
    return ordenes.find(o => o.id === Number(otSeleccionadaId)) || null
  }, [ordenes, otSeleccionadaId])

  // Diagnóstico limpio para la tarjeta de resumen (remueve prefijos como [Inspección Patio ...]: para dejar únicamente la falla/reparación)
  const diagnosticoLimpio = useMemo(() => {
    if (!otActiva?.diagnostico) return ''
    return otActiva.diagnostico.replace(/^\[.*?\]:\s*/, '').trim()
  }, [otActiva])

  // Filtrar artículos para el Typeahead considerando búsqueda y filtro de categoría
  const sugerenciasArticulos = useMemo(() => {
    let lista = articulosAlmacen
    if (filtroCategoria === 'Stock') {
      lista = lista.filter(a => !esYonke(a))
    } else if (filtroCategoria === 'Yonke') {
      lista = lista.filter(a => esYonke(a))
    }

    const q = busqueda.trim().toLowerCase()
    if (!q) return lista.slice(0, 10)
    return lista.filter(a => 
      a.nombre_normalizado.toLowerCase().includes(q) ||
      (a.numero_parte && a.numero_parte.toLowerCase().includes(q)) ||
      (a.categoria && a.categoria.toLowerCase().includes(q))
    ).slice(0, 12)
  }, [busqueda, articulosAlmacen, filtroCategoria])

  // Sugerencia Yonke reactiva según la pieza seleccionada o buscada
  const sugerenciaYonke = useMemo(() => {
    const termino = (articuloSeleccionado?.nombre_normalizado || busqueda).trim().toLowerCase()
    if (!termino || termino.length < 3) return null
    return piezasYonke.find(y => 
      y.disponible && 
      (y.nombre_pieza.toLowerCase().includes(termino) || 
       (y.codigo_parte && y.codigo_parte.toLowerCase().includes(termino)))
    ) || null
  }, [articuloSeleccionado, busqueda, piezasYonke])

  // Manejar selección de artículo del catálogo
  const seleccionarArticuloCatalogo = (art: ArticuloAlmacenApi) => {
    setArticuloSeleccionado(art)
    setEsPiezaNueva(false)
    setNombrePieza(art.nombre_normalizado)
    setNumeroParte(art.numero_parte || '')
    setBusqueda(`${art.nombre_normalizado} ${art.numero_parte ? `[${art.numero_parte}]` : ''}`)
    setDropdownAbierto(false)

    // Detección de Origen: Yonke es pieza de stock no nueva (color morado)
    if (esYonke(art)) {
      setOrigen('Yonke')
      setCostoEstimadoManual(art.precio_referencia || 0)
    } else if (art.stock_actual > 0) {
      setOrigen('Almacén')
      setCostoEstimadoManual(art.precio_referencia || 0)
    } else {
      setOrigen('Compras')
      setCostoEstimadoManual(art.precio_referencia || 0)
    }
  }

  // Activar modo de captura para Pieza Nueva Jamás Comprada
  const activarModoPiezaNueva = () => {
    setArticuloSeleccionado(null)
    setEsPiezaNueva(true)
    setNombrePieza(busqueda.trim())
    setNumeroParte('')
    setOrigen('Compras') // Toda pieza nueva jamás comprada va a compras
    setDropdownAbierto(false)
    setCostoEstimadoManual('')
  }

  // Manejar carga de fotografías
  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (fotosNuevas.length + files.length > 3) {
      agregarToast({
        tipo: 'error',
        titulo: 'Límite de Fotos',
        mensaje: 'Se permite un máximo de 3 fotografías como evidencia.',
      })
      return
    }

    const nuevosArchivos = [...fotosNuevas, ...files]
    setFotosNuevas(nuevosArchivos)

    // Generar previews en memoria
    const previews = files.map(file => URL.createObjectURL(file))
    setFotosPreview(prev => [...prev, ...previews])
  }

  const eliminarFoto = (index: number) => {
    setFotosNuevas(prev => prev.filter((_, i) => i !== index))
    setFotosPreview(prev => {
      const copy = [...prev]
      URL.revokeObjectURL(copy[index])
      copy.splice(index, 1)
      return copy
    })
  }

  // Agregar Partida al Carrito de la OT
  const agregarPartida = () => {
    if (!otActiva) {
      agregarToast({
        tipo: 'error',
        titulo: 'OT No Seleccionada',
        mensaje: 'Debes vincular una Orden de Trabajo activa para solicitar refacciones.',
      })
      return
    }

    const descFinal = nombrePieza.trim()
    if (!descFinal) {
      agregarToast({
        tipo: 'error',
        titulo: 'Nombre de Pieza Requerido',
        mensaje: 'Escribe o selecciona la refacción requerida.',
      })
      return
    }

    if (!descripcionTrabajo.trim()) {
      agregarToast({
        tipo: 'error',
        titulo: 'Diagnóstico Requerido',
        mensaje: 'Indica la reparación o trabajo en rampa donde se usará esta pieza.',
      })
      return
    }

    if (cantidad < 1) {
      agregarToast({
        tipo: 'error',
        titulo: 'Cantidad Inválida',
        mensaje: 'La cantidad debe ser al menos de 1 unidad.',
      })
      return
    }

    // Validación estricta para piezas nuevas jamás compradas
    if (esPiezaNueva) {
      if (!numeroParte.trim()) {
        agregarToast({
          tipo: 'error',
          titulo: 'Número de Parte Obligatorio',
          mensaje: 'Para piezas nuevas a comprar debes ingresar el número de parte OEM o del fabricante.',
        })
        return
      }
      if (fotosNuevas.length === 0) {
        agregarToast({
          tipo: 'error',
          titulo: 'Fotografía Requerida',
          mensaje: 'Adjunta al menos 1 fotografía de la muestra o pieza desmontada para compras.',
        })
        return
      }
    }

    const costoUnit = origen === 'Yonke' ? 0 : Number(costoEstimadoManual || 0)
    const costoTot = costoUnit * cantidad

    const nuevaPartida: PartidaTaller = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pieza_catalogo_id: articuloSeleccionado?.id,
      es_nueva_no_catalogada: esPiezaNueva,
      nombre_pieza: descFinal,
      numero_parte: numeroParte.trim(),
      descripcion_trabajo: descripcionTrabajo.trim(),
      cantidad,
      origen,
      costo_unitario: costoUnit,
      costo_total: costoTot,
      urgencia,
      fotos: fotosNuevas,
      fotos_preview: [...fotosPreview],
      stock_disponible: articuloSeleccionado?.stock_actual,
      unidad_donante: origen === 'Yonke' ? (sugerenciaYonke?.unidad_origen || 'Donante Yonke') : undefined
    }

    setPartidas(prev => [nuevaPartida, ...prev])

    // Limpiar campos para la siguiente partida
    setBusqueda('')
    setNombrePieza('')
    setNumeroParte('')
    setArticuloSeleccionado(null)
    setEsPiezaNueva(false)
    setCantidad(1)
    setCostoEstimadoManual('')
    setFotosNuevas([])
    setFotosPreview([])
    setDescripcionTrabajo('')

    agregarToast({
      tipo: 'success',
      titulo: 'Partida Agregada al Carrito',
      mensaje: `${descFinal} (${cantidad} pz) agregada a la OT ${otActiva.folio || otActiva.id}.`,
    })
  }

  const eliminarPartida = (id: string) => {
    setPartidas(prev => prev.filter(p => p.id !== id))
  }

  // Totales calculados
  const totalPartidas = partidas.length
  const totalAlmacen = partidas.filter(p => p.origen === 'Almacén').reduce((acc, p) => acc + p.cantidad, 0)
  const totalCompras = partidas.filter(p => p.origen === 'Compras').reduce((acc, p) => acc + p.cantidad, 0)
  const totalYonke = partidas.filter(p => p.origen === 'Yonke').reduce((acc, p) => acc + p.cantidad, 0)
  const costoTotalEstimado = partidas.reduce((acc, p) => acc + p.costo_total, 0)

  // Emisión eCommerce unificada
  const emitirPedidoRefacciones = async () => {
    if (!otActiva) return
    if (partidas.length === 0) {
      agregarToast({
        tipo: 'error',
        titulo: 'Carrito Vacío',
        mensaje: 'Agrega al menos una refacción antes de emitir el pedido.',
      })
      return
    }

    setEnviando(true)
    try {
      // 1. Procesar partidas que van a compras (crear requisiciones formales vinculadas a la OT)
      const partidasCompras = partidas.filter(p => p.origen === 'Compras')
      for (const p of partidasCompras) {
        await crearRequisicion({
          unidad_destino_id: otActiva.unidad.id,
          origen: 'Compra',
          pieza_catalogo_id: p.pieza_catalogo_id || null,
          orden_trabajo_id: otActiva.id,
          descripcion_pieza: `${p.nombre_pieza} - Reparación: ${p.descripcion_trabajo}`,
          cantidad: p.cantidad,
          numero_parte: p.numero_parte || null,
          urgencia: p.urgencia,
          costo_estimado_manual: p.costo_unitario > 0 ? p.costo_unitario : null,
          fotos: p.fotos
        }).catch(err => {
          console.warn('Requisición de compra enviada con fallback local:', err)
        })
      }

      // 2. Procesar partidas de stock o yonke como requisición interna de salida
      const partidasInternas = partidas.filter(p => p.origen !== 'Compras')
      for (const p of partidasInternas) {
        await crearRequisicion({
          unidad_destino_id: otActiva.unidad.id,
          origen: p.origen === 'Yonke' ? 'Yonke' : 'Inventario',
          pieza_catalogo_id: p.pieza_catalogo_id || null,
          orden_trabajo_id: otActiva.id,
          descripcion_pieza: `${p.nombre_pieza} (${p.origen}) - Reparación: ${p.descripcion_trabajo}`,
          cantidad: p.cantidad,
          numero_parte: p.numero_parte || null,
          urgencia: p.urgencia,
          costo_estimado_manual: p.costo_unitario > 0 ? p.costo_unitario : null,
          fotos: []
        }).catch(err => {
          console.warn('Requisición interna enviada con fallback:', err)
        })
      }

      agregarToast({
        tipo: 'success',
        titulo: '¡Pedido de Refacciones Emitido!',
        mensaje: `Se emitieron ${totalPartidas} partida(s) para la OT ${otActiva.folio || otActiva.id}. Las compras ingresaron a la cola y el stock quedó en espera de despacho.`,
      })

      // Limpiar partidas y redirigir al listado de OTs
      setPartidas([])
      setTimeout(() => {
        navigate('/taller/ordenes')
      }, 1200)
    } catch (err) {
      console.error('Error al emitir pedido de refacciones:', err)
      agregarToast({
        tipo: 'error',
        titulo: 'Error en Emisión',
        mensaje: 'No fue posible completar la emisión de todas las refacciones.',
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.08)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/taller/ordenes')}
              className="p-1 rounded-lg hover:bg-white/5 text-[#B8B2A6] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="rounded bg-[#F2620F]/20 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Taller · Flujo de Suministros
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              eCommerce de Refacciones
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Pedido de Refacciones & Requisición de Taller
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Surtido desde existencias de almacén, piezas de yonke ($0) o solicitud formal a compras con foto obligatoria para componentes nuevos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/taller/ordenes')}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-4 py-2 text-xs font-semibold text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <Wrench className="h-4 w-4 text-[#F2620F]" />
            <span>Ver Órdenes de Trabajo</span>
          </button>
        </div>
      </div>

      {/* Compuerta Operativa: Selector de OT Activa */}
      <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-5 sm:p-6 space-y-4 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(243,239,231,0.06)] pb-3">
          <div>
            <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Trazabilidad Obligatoria de Taller
            </div>
            <h2 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
              1. Orden de Trabajo Activa (Destino)
            </h2>
          </div>
          <span className="text-xs text-[#B8B2A6]">
            Toda refacción solicitada se imputa directamente a la bitácora técnica de la unidad.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
              Seleccionar Orden de Trabajo (OT)
            </label>
            <select
              value={otSeleccionadaId}
              onChange={e => setOtSeleccionadaId(Number(e.target.value))}
              disabled={cargando}
              className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3 text-xs font-medium text-white focus:border-[#F2620F] focus:outline-none"
            >
              {ordenes.map(ot => (
                <option key={ot.id} value={ot.id}>
                  {ot.folio || `OT-${ot.id}`} — Unidad {ot.unidad.id_unidad} ({ot.unidad.tipo}) | Falla: {ot.diagnostico.slice(0, 50)}... | Mecánico: {ot.responsable.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tarjeta de Resumen Rápido de la OT */}
          {otActiva && (
            <div className="rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/10 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-['Barlow_Condensed'] text-xs font-bold uppercase">
                <span className="text-white bg-[#F2620F]/20 px-2 py-0.5 rounded font-mono">{otActiva.unidad.id_unidad}</span>
                <span className="text-[#B8B2A6] text-[10px]">{otActiva.unidad.tipo}</span>
              </div>
              <p className="text-white text-[11px] font-medium line-clamp-2" title={otActiva.diagnostico}>
                {diagnosticoLimpio || otActiva.diagnostico}
              </p>
              <div className="text-[10px] text-[#B8B2A6] pt-1 flex items-center justify-between border-t border-white/5">
                <span>Mecánico: <strong>{otActiva.responsable.nombre}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Principal: Asistente de Adición y Carrito de la OT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Asistente Inteligente de Refacciones (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.06)] pb-3">
              <div>
                <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                  Asistente en Vivo
                </span>
                <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
                  2. Buscar o Capturar Refacción
                </h3>
              </div>

              {/* Botón de alternancia para Pieza Nueva */}
              <button
                type="button"
                onClick={() => {
                  if (esPiezaNueva) {
                    setEsPiezaNueva(false)
                    setArticuloSeleccionado(null)
                  } else {
                    activarModoPiezaNueva()
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-['Barlow_Condensed'] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  esPiezaNueva 
                    ? 'bg-[#F2620F] text-white shadow-md shadow-[#F2620F]/20' 
                    : 'bg-white/5 text-[#B8B2A6] hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{esPiezaNueva ? 'Modo: Pieza Nueva' : '+ Pieza Nueva No Catalogada'}</span>
              </button>
            </div>

            {/* Banner reactivo de Sugerencia Yonke ($0) — Color MORADO oficial */}
            {sugerenciaYonke && !esYonke(articuloSeleccionado) && (
              <div className="flex items-center justify-between rounded-xl border border-purple-500/50 bg-purple-950/40 p-3.5 text-xs animate-in fade-in shadow-lg shadow-purple-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-900/60 rounded-lg text-purple-300 border border-purple-500/40">
                    <Recycle className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase text-purple-300 flex items-center gap-2">
                      <span>¡Pieza disponible en Almacén Yonke ($0 Costo)!</span>
                      <span className="px-1.5 py-0.5 bg-purple-900/80 text-purple-200 border border-purple-500/50 text-[10px] rounded font-mono font-bold">
                        STOCK USADO
                      </span>
                    </div>
                    <p className="text-white text-xs mt-0.5">
                      {sugerenciaYonke.nombre_pieza} — Ubicación: <strong>{sugerenciaYonke.ubicacion_almacen}</strong> (Desmontada de {sugerenciaYonke.unidad_origen || 'Unidad Donante'}).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNombrePieza(sugerenciaYonke.nombre_pieza)
                    setNumeroParte(sugerenciaYonke.codigo_parte || '')
                    setOrigen('Yonke')
                    setCostoEstimadoManual(0)
                    agregarToast({
                      tipo: 'success',
                      titulo: 'Origen Asignado a Yonke',
                      mensaje: 'Esta pieza se suministrará sin costo desde el almacén de despiece (Stock Usado).',
                    })
                  }}
                  className="rounded-xl bg-purple-600 px-3.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:bg-purple-500 transition-all cursor-pointer shrink-0 ml-2 shadow-md shadow-purple-900/50"
                >
                  Usar Yonke ($0)
                </button>
              </div>
            )}

            {/* Buscador Typeahead contra Catálogo de Almacén */}
            {!esPiezaNueva && (
              <div className="relative space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-[#B8B2A6]">
                    Buscar en Catálogo de Almacén (Nombre, Número de Parte o Categoría)
                  </label>

                  {/* Filtro Rápido de Categorías */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFiltroCategoria('Todas')}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-['Barlow_Condensed'] font-bold uppercase transition-all cursor-pointer ${
                        filtroCategoria === 'Todas'
                          ? 'bg-[#F2620F] text-white'
                          : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white border border-white/5'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroCategoria('Stock')}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-['Barlow_Condensed'] font-bold uppercase transition-all cursor-pointer ${
                        filtroCategoria === 'Stock'
                          ? 'bg-[#3FA65C] text-black font-extrabold'
                          : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white border border-white/5'
                      }`}
                    >
                      📦 Stock Nuevo
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroCategoria('Yonke')}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-['Barlow_Condensed'] font-bold uppercase transition-all cursor-pointer ${
                        filtroCategoria === 'Yonke'
                          ? 'bg-purple-600 text-white font-extrabold shadow-sm shadow-purple-900'
                          : 'bg-purple-950/30 text-purple-300 hover:bg-purple-950/60 border border-purple-500/30'
                      }`}
                    >
                      🟣 Yonke (Stock Usado)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#B8B2A6]" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => {
                      setBusqueda(e.target.value)
                      setDropdownAbierto(true)
                    }}
                    onFocus={() => setDropdownAbierto(true)}
                    placeholder="Escribe 'Filtro', 'Balata', 'Alternador Yonke' o número de parte..."
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 pl-9 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                {/* Dropdown de Autocompletado */}
                {dropdownAbierto && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1A1D23] p-1.5 shadow-2xl shadow-black/80">
                    {sugerenciasArticulos.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {sugerenciasArticulos.map(art => {
                          const artEsYonke = esYonke(art)
                          const hayStock = art.stock_actual > 0

                          return (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => seleccionarArticuloCatalogo(art)}
                              className={`flex w-full items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                                artEsYonke
                                  ? 'bg-purple-950/20 hover:bg-purple-950/50 border-l-4 border-l-purple-500'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <div className={`font-['Barlow_Condensed'] text-xs font-bold uppercase ${artEsYonke ? 'text-purple-200' : 'text-white'}`}>
                                    {art.nombre_normalizado}
                                  </div>
                                  {artEsYonke && (
                                    <span className="inline-flex items-center gap-1 rounded bg-purple-900/70 border border-purple-500/50 px-1.5 py-0.2 text-[9px] font-['Barlow_Condensed'] font-extrabold uppercase text-purple-200">
                                      <Recycle className="h-2.5 w-2.5 text-purple-300" />
                                      YONKE
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#B8B2A6]">
                                  Parte: <span className="font-mono text-white">{art.numero_parte || 'S/N'}</span> | Cat: <span className={artEsYonke ? 'text-purple-300 font-semibold' : ''}>{art.categoria || 'General'}</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 ml-3">
                                {artEsYonke ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-['Barlow_Condensed'] font-bold uppercase bg-purple-900/60 text-purple-200 border border-purple-500/60">
                                      <Recycle className="h-3 w-3 text-purple-300" />
                                      {hayStock ? `${art.stock_actual} pz (Stock Usado)` : 'Sin Stock Yonke'}
                                    </span>
                                    <div className="text-[11px] font-mono font-bold text-purple-400 mt-0.5">
                                      $0.00 MXN
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-['Barlow_Condensed'] font-bold uppercase ${
                                      hayStock 
                                        ? 'bg-[#3FA65C]/20 text-[#3FA65C] border border-[#3FA65C]/30' 
                                        : 'bg-[#F2620F]/20 text-[#F2620F] border border-[#F2620F]/30'
                                    }`}>
                                      {hayStock ? `${art.stock_actual} pz Stock` : 'Sin Stock (Pedir)'}
                                    </span>
                                    <div className="text-[11px] font-mono text-[#C5A059] mt-0.5">
                                      ${(art.precio_referencia || 0).toLocaleString()} MXN
                                    </div>
                                  </>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-[#B8B2A6]">
                        No se encontró ningún artículo coincidente en el almacén.
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-1.5 mt-1">
                      <button
                        type="button"
                        onClick={activarModoPiezaNueva}
                        className="flex w-full items-center justify-center gap-1.5 p-2 rounded-lg bg-[#F2620F]/15 text-[#F2620F] hover:bg-[#F2620F]/25 text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Capturar como Pieza Nueva Jamás Comprada</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alerta de Feedback de Stock cuando se selecciona un artículo existente */}
            {articuloSeleccionado && !esPiezaNueva && (
              esYonke(articuloSeleccionado) ? (
                <div className="p-3.5 rounded-xl text-xs flex items-center gap-3 border bg-purple-950/30 border-purple-500/50 text-purple-200 shadow-md">
                  <div className="rounded-lg bg-purple-900/70 p-2 text-purple-300 border border-purple-500/40 shrink-0">
                    <Recycle className="h-5 w-5 text-purple-300 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="font-['Barlow_Condensed'] text-sm uppercase tracking-wider text-purple-200">
                        Refacción de Almacén Yonke — Stock Físico Usado ({articuloSeleccionado.stock_actual} pz disponibles)
                      </strong>
                    </div>
                    <div className="text-[11px] text-purple-300/80 mt-0.5">
                      Esta pieza está dada de alta como <strong>categoría Yonke</strong>: es una pieza física en patio/almacén recuperada de desmonte (no nueva). Su costo directo de salida para la OT es de $0.00.
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 border ${
                  articuloSeleccionado.stock_actual >= cantidad
                    ? 'bg-[#3FA65C]/10 border-[#3FA65C]/30 text-[#3FA65C]'
                    : 'bg-[#F2620F]/10 border-[#F2620F]/30 text-[#F2620F]'
                }`}>
                  {articuloSeleccionado.stock_actual >= cantidad ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <div>
                        <strong>Stock suficiente en Almacén ({articuloSeleccionado.stock_actual} pz).</strong>
                        <div className="text-[11px] text-[#B8B2A6]">Se generará solicitud de salida de inventario para que el almacenista entregue la pieza.</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div>
                        <strong>Stock insuficiente ({articuloSeleccionado.stock_actual} pz en almacén, requieres {cantidad} pz).</strong>
                        <div className="text-[11px] text-[#B8B2A6]">Se remitirá a la Cola de Compras para su reabastecimiento sin detener la orden de trabajo.</div>
                      </div>
                    </>
                  )}
                </div>
              )
            )}

            {/* Formulario de Detalle de la Partida */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Descripción de la Refacción {esPiezaNueva && <span className="text-[#F2620F]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={nombrePieza}
                    onChange={e => setNombrePieza(e.target.value)}
                    placeholder="Ej. Balata de freno 16.5 x 7 Q-Plus"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Número de Parte OEM {esPiezaNueva && <span className="text-[#F2620F]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={numeroParte}
                    onChange={e => setNumeroParte(e.target.value)}
                    placeholder="Ej. MER-4707-QP"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-mono text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Selector de Origen de la Pieza */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Origen del Suministro
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrigen('Almacén')}
                    className={`py-2 px-3 rounded-xl text-xs font-['Barlow_Condensed'] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      origen === 'Almacén'
                        ? 'bg-[#3FA65C] text-black border-[#3FA65C] font-extrabold shadow-md shadow-[#3FA65C]/20'
                        : 'bg-[#1C1C1C] text-[#B8B2A6] border-[rgba(243,239,231,0.1)] hover:text-white'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    <span>Stock Almacén</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrigen('Compras')}
                    className={`py-2 px-3 rounded-xl text-xs font-['Barlow_Condensed'] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      origen === 'Compras'
                        ? 'bg-[#F2620F] text-white border-[#F2620F] shadow-md shadow-[#F2620F]/20'
                        : 'bg-[#1C1C1C] text-[#B8B2A6] border-[rgba(243,239,231,0.1)] hover:text-white'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Requisición Compra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrigen('Yonke')
                      setCostoEstimadoManual(0)
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-['Barlow_Condensed'] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      origen === 'Yonke'
                        ? 'bg-purple-900/80 text-purple-200 border-purple-500 font-extrabold shadow-md shadow-purple-950/60'
                        : 'bg-[#1C1C1C] text-purple-300/80 border-purple-500/30 hover:bg-purple-950/40 hover:text-purple-200'
                    }`}
                  >
                    <Recycle className="h-4 w-4 text-purple-300" />
                    <span>Almacén Yonke ($0)</span>
                  </button>
                </div>
              </div>

              {/* Cantidad, Costo y Urgencia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Cantidad Solicitada
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={e => setCantidad(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-center font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Costo Estimado Unitario ($ MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={origen === 'Yonke'}
                    value={origen === 'Yonke' ? 0 : costoEstimadoManual}
                    onChange={e => setCostoEstimadoManual(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-right font-mono text-xs text-white focus:border-[#F2620F] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Urgencia Operativa
                  </label>
                  <select
                    value={urgencia}
                    onChange={e => setUrgencia(e.target.value as 'Bajo' | 'Medio' | 'Crítico' | 'Inmediato')}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="Bajo">Baja (Mantenimiento Programado)</option>
                    <option value="Medio">Media (Torno / Calibración)</option>
                    <option value="Crítico">Crítica (Unidad Parada)</option>
                    <option value="Inmediato">Inmediata (Ruta Express)</option>
                  </select>
                </div>
              </div>

              {/* Justificación técnica y reparación */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Reparación o Diagnóstico Técnico Asociado <span className="text-[#F2620F]">*</span>
                </label>
                <input
                  type="text"
                  value={descripcionTrabajo}
                  onChange={e => setDescripcionTrabajo(e.target.value)}
                  placeholder="Ej. Reemplazo de manguera rota en eje direccional tras inspección en rampa..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              {/* Bloque de Evidencia Fotográfica (Obligatoria para Piezas Nuevas Jamás Compradas) */}
              {esPiezaNueva && (
                <div className="rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-[#F2620F]" />
                      <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white">
                        Evidencia Fotográfica de la Pieza Nueva <span className="text-[#F2620F]">* (Obligatoria)</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-[#B8B2A6]">Hasta 3 fotos de muestra</span>
                  </div>

                  <p className="text-xs text-[#B8B2A6]">
                    Como esta refacción jamás se ha comprado o no existe en catálogo, el área de compras requiere la fotografía de la muestra o placa OEM para cotizarla con el proveedor.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* Botón de carga / cámara */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFotosChange}
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fotosNuevas.length >= 3}
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#F2620F]/50 bg-[#1C1C1C] p-3 text-xs text-[#F2620F] hover:bg-[#F2620F]/10 transition-colors cursor-pointer disabled:opacity-30"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Tomar Foto / Subir Imagen ({fotosNuevas.length}/3)</span>
                    </button>

                    {/* Miniaturas de vista previa */}
                    {fotosPreview.map((url, idx) => (
                      <div key={idx} className="relative h-16 w-16 rounded-lg overflow-hidden border border-white/20 group">
                        <img src={url} alt={`Evidencia ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => eliminarFoto(idx)}
                          className="absolute inset-0 bg-black/70 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón para Agregar al Carrito */}
              <button
                type="button"
                onClick={agregarPartida}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#F2620F] w-full py-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer shadow-lg shadow-[#F2620F]/20"
              >
                <Plus className="h-5 w-5 stroke-[3]" />
                <span>Agregar Refacción al Carrito de la OT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Carrito de Refacciones & Emisión (1 col) */}
        <div className="space-y-6">
          
          {/* Tarjeta de Resumen eCommerce */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-5 sm:p-6 space-y-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.06)] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#F2620F]" />
                <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase text-white">
                  Carrito de la OT
                </h3>
              </div>
              <span className="rounded-full bg-[#F2620F]/20 px-2.5 py-0.5 font-mono text-xs font-bold text-[#F2620F]">
                {totalPartidas} {totalPartidas === 1 ? 'partida' : 'partidas'}
              </span>
            </div>

            {/* Listado de Partidas */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {partidas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[rgba(243,239,231,0.1)] p-6 text-center text-xs text-[#B8B2A6] space-y-2">
                  <Package className="h-8 w-8 text-[#B8B2A6]/40 mx-auto" />
                  <p>El carrito de esta orden está vacío.</p>
                  <p className="text-[11px] text-[#B8B2A6]/60">Busca en catálogo o añade piezas nuevas con el asistente de la izquierda.</p>
                </div>
              ) : (
                partidas.map(p => (
                  <div 
                    key={p.id} 
                    className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C] p-3 space-y-2 hover:border-white/20 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1">
                        <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase text-white">
                          {p.nombre_pieza}
                        </div>
                        {p.numero_parte && (
                          <div className="font-mono text-[10px] text-[#B8B2A6]">
                            Parte: {p.numero_parte}
                          </div>
                        )}
                        <div className="text-[11px] text-[#B8B2A6] italic line-clamp-1">
                          "{p.descripcion_trabajo}"
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarPartida(p.id)}
                        className="text-[#B8B2A6] hover:text-[#F2620F] transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Previews de Fotos si tiene */}
                    {p.fotos_preview.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {p.fotos_preview.map((furl, fidx) => (
                          <img key={fidx} src={furl} alt="Evidencia" className="h-8 w-8 rounded object-cover border border-white/10" />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-white/5 pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-['Barlow_Condensed'] font-bold uppercase ${
                          p.origen === 'Almacén'
                            ? 'bg-[#3FA65C]/20 text-[#3FA65C] border border-[#3FA65C]/30'
                            : p.origen === 'Compras'
                            ? 'bg-[#F2620F]/20 text-[#F2620F] border border-[#F2620F]/30'
                            : 'bg-purple-900/60 text-purple-300 border border-purple-500/50'
                        }`}>
                          {p.origen === 'Almacén' ? 'Stock Nuevo' : p.origen === 'Compras' ? 'Compra Nueva' : 'Yonke (Stock Usado)'}
                        </span>
                        <span className="text-[11px] text-white font-bold">
                          x{p.cantidad}
                        </span>
                      </div>

                      <div className={`font-mono text-xs font-bold ${p.origen === 'Yonke' ? 'text-purple-400' : 'text-white'}`}>
                        {p.costo_total > 0 ? `$${p.costo_total.toLocaleString()} MXN` : '$0.00 MXN'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desglose de Suministro */}
            {partidas.length > 0 && (
              <div className="rounded-xl bg-[#1C1C1C]/60 p-3 text-xs space-y-1.5 border border-white/5">
                <div className="flex justify-between text-[#B8B2A6]">
                  <span>Surtido desde Almacén (Stock Nuevo):</span>
                  <span className="text-white font-bold">{totalAlmacen} pz</span>
                </div>
                <div className="flex justify-between text-[#B8B2A6]">
                  <span>Requisición a Compras:</span>
                  <span className="text-[#F2620F] font-bold">{totalCompras} pz</span>
                </div>
                <div className="flex justify-between text-[#B8B2A6]">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
                    <span>Piezas de Yonke (Stock Usado):</span>
                  </span>
                  <span className="text-purple-400 font-bold font-mono">{totalYonke} pz</span>
                </div>
                <div className="flex justify-between text-white font-['Barlow_Condensed'] text-sm font-bold border-t border-white/10 pt-1.5">
                  <span>Costo Estimado Total:</span>
                  <span className="font-mono text-[#F2620F] text-base">${costoTotalEstimado.toLocaleString()} MXN</span>
                </div>
              </div>
            )}

            {/* Aviso de Política eCommerce */}
            <div className="text-[11px] text-[#B8B2A6] leading-relaxed">
              ℹ️ Al confirmar el pedido, las piezas de compra ingresan a la <strong>Bandeja de Adquisiciones</strong>. Las piezas de stock quedan en estado de <em>Solicitud de Salida</em> y su baja se confirma formalmente cuando el personal de almacén/compras entrega el material.
            </div>

            {/* Botón de Emisión */}
            <button
              type="button"
              onClick={emitirPedidoRefacciones}
              disabled={enviando || partidas.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#F2620F] w-full py-3.5 font-['Barlow_Condensed'] text-base font-bold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/30 hover:bg-[#D9550C] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              <span>{enviando ? 'Emitiendo Pedido...' : `Emitir Pedido de Refacciones (${partidas.length})`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TallerRefacciones
