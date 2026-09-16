import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Wifi, 
  Save, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw,
  Send,
  Home,
  Gauge,
  Fuel,
  Camera,
  Eraser,
  PenTool,
  X,
  Plus,
  Filter,
  Check,
  Upload,
  Disc,
  Clock,
  Calendar,
  FileCheck2,
  Truck,
  Box
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'
import { getUnidades } from '../../lib/api'
import { 
  ordenInspeccionSchema, 
  type OrdenInspeccionForm, 
  SISTEMAS_INSPECCION_DEFAULT,
  SISTEMAS_INSPECCION_CAJA_DEFAULT,
  LLANTAS_DEFAULT,
  LLANTAS_CAJA_DEFAULT
} from '../../lib/inspeccionSchema'
import { 
  guardarBorradorLocal, 
  obtenerBorradorLocal, 
  eliminarBorradorLocal, 
  guardarInspeccionFinalizada,
  obtenerFolioConsecutivoSincrono,
  generarSiguienteFolioInspeccion,
  registrarFolioEmitido
} from '../../lib/inspeccionStorage'
import { OrdenInspeccionModal } from '../../components/patio/OrdenInspeccionModal'
import { DiagramaEjesLlantas } from '../../components/patio/DiagramaEjesLlantas'

interface UnidadOpcion {
  id: string
  placas: string
  operacion: 'Cruce' | 'Foráneo' | 'Local' | 'Backup'
}

const NIVELES_COMBUSTIBLE = ['Reserva', '1/4', '1/2', '3/4', 'Lleno'] as const
const UNIDADES_CATALOGO_DEFAULT: UnidadOpcion[] = [
  { id: 'WH-101', placas: '78-AA-1B', operacion: 'Cruce' },
  { id: 'WH-102', placas: '79-AB-2C', operacion: 'Cruce' },
  { id: 'WH-103', placas: '80-AC-3D', operacion: 'Foráneo' },
  { id: 'WH-104', placas: '82-BC-3D', operacion: 'Foráneo' },
  { id: 'WH-105', placas: '83-BD-4E', operacion: 'Cruce' },
  { id: 'WH-120', placas: '90-CA-1A', operacion: 'Local' },
  { id: 'WH-125', placas: '95-CD-5E', operacion: 'Local' },
  { id: 'CJ-501', placas: '12-EF-5E', operacion: 'Local' },
  { id: 'CJ-502', placas: '14-EF-7G', operacion: 'Local' },
  { id: 'TH-201', placas: '33-GH-9H', operacion: 'Foráneo' },
  { id: 'TH-202', placas: '35-GJ-1K', operacion: 'Foráneo' },
]

const SISTEMAS_TABS_TRACTO = [
  'Todos',
  'Diagrama de Llantas',
  'Motor y Fluidos',
  'Aire y Frenos',
  'Tren Motriz y Chasis',
  'Luces y Eléctrico',
  'Cabina y Carrocería',
  'Seguridad y Documentos'
] as const

const SISTEMAS_TABS_CAJA = [
  'Todos',
  'Acoplamiento y Estructura',
  'Aire, Frenos y Suspensión',
  'Carrocería y Seguridad'
] as const

const TAGS_FALLAS_COMUNES: Record<string, string[]> = {
  masa_fuga_aceite: ['Fuga de aceite en masa', 'Sello de masa dañado', 'Tapa floja'],
  lineas_de_aire: ['Fuga de aire en manita', 'Línea agrietada', 'Baja presión'],
  ejes_fuga_aceite: ['Fuga en retén de eje', 'Tornillos flojos', 'Grasa excesiva'],
  baterias_estado: ['Batería manchada', 'Batería inflada', 'Terminal sulfatada'],
  bandas_mangueras: ['Banda agrietada', 'Manguera desgastada', 'Abrazadera rota'],
  chasis_estado: ['Chasis quebrado', 'Chasis fisurado', 'Travesaño golpeado'],
  frenos_ajuste_balatas: ['Balatas bajas', 'Freno desajustado', 'Tambor cristalizado'],
  bolsas_de_aire: ['Bolsa ponchada', 'Fuga en base', 'Bolsa desalineada'],
  rotachamber_fuga: ['Fuga en diafragma', 'Manguera rota', 'Vástago trabado'],
  clutch_ajuste: ['Pedal de clutch duro', 'Clutch patina', 'Juego libre excesivo'],
  aceite_nivel: ['Nivel bajo de aceite', '1/2 Qt bajo', '1 Qt bajo', 'Fuga visible'],
  dispositivos_acoplamiento: ['Perno rey desgastado', 'Traba con juego', 'Mordazas flojas'],
  fantasmas_luces: ['Luz fantasma fundida', 'Mica rota', 'Falso contacto'],
  documentos_permisos: ['Póliza por vencer', 'Falta permiso SCT', 'Falta tarjeta circulación'],
  chirrion: ['Chirrión roto / desgastado', 'Cadena floja', 'Resorte sin tensión'],
  mangueras_servicio: ['Manguera verde con fuga', 'Manguera azul desgastada', 'Conector flojo'],
  motor_fuga_aceite: ['Fuga en tapa punterías', 'Goteo en cárter', 'Fuga en turbo'],
  quinta_rueda_engrasada: ['Falta grasa en plato', 'Grasa seca', 'Mecanismo duro'],
  sistema_escape_motor: ['Tubo de escape roto', 'Fuga de humo', 'Abrazadera suelta'],
  extintor_incendios: ['Extintor descargado', 'Extintor sin seguro', 'Fecha vencida'],
  sistema_combustible_derrame: ['Derrame en tapón', 'Fuga en filtro diésel', 'Tanque golpeado'],
  placas_delantera_trasera: ['Falta placa delantera', 'Placa trasera ilegible', 'Placa doblada'],
  claxon: ['Claxon no suena', 'Sonido bajo / ronco', 'Corneta sin presión de aire'],
  fusibles_stop: ['Luz de stop fundida', 'Fusible quemado', 'Intermitentes no responden'],
  calca_inspeccion_engomado: ['Calca vencida', 'Falta engomado ambiental', 'Engomado roto'],
  anticongelante: ['Nivel bajo en depósito', 'Fuga en radiador', 'Manguera inflada'],
  luces_altas_bajas: ['Faro izquierdo fundido', 'Faro derecho sin altas', 'Mica estrellada'],
  espejos: ['Espejo estrellado', 'Espejo flojo', 'Cóncavo roto'],
  zoqueteras_polveras: ['Zoqueteras rotas', 'Polvera suelta', 'Falta hule'],
  vidrio_delantero: ['Parabrisas estrellado', 'Piquete de piedra', 'Fisura en campo visual'],
  suspension: ['Muelle roto / vencido', 'Buje dañado', 'Amortiguador chorreado'],
  llantas_rines: ['Rin fisurado', 'Borde doblado', 'Birlo capado'],
  tuercas_ajustadas: ['Tuercas flojas', 'Falta birlo/tuerca', 'Tuercas barridas'],
  transmisiones: ['Fuga en transmisión', 'Dificultad al cambiar', 'Juego en flecha'],
  limpiaparabrisas_fluido: ['Pluma rota', 'Sin líquido chisguetero', 'Motor chisguetero falla'],
  otro_defecto: ['Anomalía no catalogada', 'Ruido extraño en marcha', 'Vibración excesiva'],

  // Componentes específicos de formato físico de Caja / Traila
  caja_lineas_aire: ['Fuga en mangueras de servicio', 'Línea agrietada', 'Baja presión'],
  caja_ejes_fuga_aceite: ['Fuga en retén de maza', 'Tapa floja / tirando aceite', 'Grasa excesiva'],
  caja_chasis_danado: ['Chasis quebrado', 'Fisura en viga I', 'Travesaños golpeados'],
  caja_frenos_ajuste: ['Balatas desgastadas', 'Freno desajustado', 'Tambor cristalizado'],
  caja_dispositivos_acoplamiento: ['Plancha de acople dañada', 'Perno rey con holgura', 'Grip desgastado'],
  caja_documentos: ['Falta tarjeta de circulación', 'Póliza de seguro vencida', 'Sin engomado'],
  caja_king_pin: ['King Pin fisurado', 'Desgaste excesivo en cuello', 'Perno golpeado'],
  caja_techo: ['Gotera / perforación', 'Lámina desprendida', 'Remaches botados'],
  caja_placas: ['Placa ilegible', 'Falta placa trasera', 'Placa doblada'],
  caja_patines_patas: ['Manivela quebrada', 'Pata doblada / descuadrada', 'Engrane trabado / duro'],
  caja_puertas_filtraciones: ['Bisagra quebrada', 'Empaque roto / filtración de agua', 'Cerrojo no traba'],
  caja_piso: ['Duela de madera rota', 'Piso hundido', 'Perforación por montacargas'],
  caja_rotochamber: ['Fuga de diafragma', 'Vástago trabado', 'Abrazadera rota'],
  caja_manitas_conexion: ['Empaque de manita roto', 'Fuga de aire al conectar', 'Manita quebrada'],
  caja_manitas_servicio: ['Empaque de manita roto', 'Fuga de aire al conectar', 'Manita quebrada'],
  caja_suspension_bolsas: ['Bolsa de aire reventada', 'Fuga en base', 'Válvula niveladora rota'],
  caja_luces_reflejantes: ['Luz María fundida', 'Plafón lateral roto', 'Cinta reflectiva despegada'],
  caja_luces_plafones: ['Luz María fundida', 'Plafón lateral roto', 'Cinta reflectiva despegada'],
  caja_zoqueteras_polveras: ['Zoqueteras rotas / faltantes', 'Polvera suelta', 'Falta hule guardafango'],
  caja_otro: ['Golpe en esquina frontal', 'Grapas sueltas', 'Pared lateral abollada'],
}

const CHIPS_ACEITE_NIVEL = ['Normal', '1/2 Qt Bajo', '1 Qt Bajo', '2 Qts Bajo', 'Sobrepasado'] as const

export const PatioInspeccion: React.FC = () => {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const { agregarToast, isOnline } = useUiStore()

  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [ordenGenerada, setOrdenGenerada] = useState<OrdenInspeccionForm | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [hayBorrador, setHayBorrador] = useState(false)
  const [guardandoBorrador, setGuardandoBorrador] = useState(false)
  const [sistemaActivo, setSistemaActivo] = useState<string>('Todos')

  // Estado del lienzo de firma táctil para tableta
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dibujando, setDibujando] = useState(false)
  const [tieneFirmaDigital, setTieneFirmaDigital] = useState(false)

  // Referencias a inputs de archivos para cámara fotográfica
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  // Generar folio correlativo del sistema con formato histórico INS-YYYY-00001
  const folioInicial = obtenerFolioConsecutivoSincrono()

  const obtenerTimestampMexico = () => {
    const d = new Date()
    const fecha = d.toISOString().substring(0, 10)
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
    return { fecha, hora }
  }

  const { fecha: fechaHoy, hora: horaActual } = obtenerTimestampMexico()

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrdenInspeccionForm>({
    resolver: zodResolver(ordenInspeccionSchema),
    defaultValues: {
      tipo_vehiculo: 'tracto',
      folio: folioInicial,
      numero_reporte_fisico: folioInicial,
      fecha: fechaHoy,
      hora: horaActual,
      tipo_inspeccion: 'PreTrip',
      operador_id: usuario?.numeroEmpleado || (usuario?.rol === 'admin' ? 'EMP-ADMIN' : usuario?.id ? `EMP-${usuario.id}` : 'EMP-409'),
      operador_nombre: usuario?.nombre || 'Juan Morales',
      licencia: 'LIC-CHIH-98842',
      unidad_id: usuario?.unidadAsignada || 'WH-101',
      placas: '78-AA-1B',
      tipo_operacion: 'Cruce',
      odometro_millas: 266500,
      kilometraje: 428950,
      nivel_combustible: '3/4',
      declaracion_defecto: 'sin_defectos',
      items: SISTEMAS_INSPECCION_DEFAULT.map(item => ({
        ...item,
        estado: 'Bueno',
        observacion: '',
        foto_url: '',
        detalle_extra: '',
      })),
      llantas_diagrama: LLANTAS_DEFAULT,
      medida_profundidad_llantas: '12/32"',
      medida_llantas: '295/75R22.5',
      observaciones_generales: '',
      carrier_defectos_corregidos: false,
      carrier_sin_riesgo: false,
      firma_digital: usuario?.nombre || 'Juan Morales',
      requiere_ot: false,
      sincronizado: false,
    },
    mode: 'onChange',
  })

  const { fields, replace } = useFieldArray({
    control,
    name: 'items',
  })

  const formValores = watch()
  const tipoVehiculo = formValores.tipo_vehiculo || 'tracto'

  // Alternar dinámicamente entre Inspección de Tractocamión e Inspección de Caja / Traila
  const cambiarTipoVehiculo = (nuevoTipo: 'tracto' | 'caja') => {
    if (nuevoTipo === tipoVehiculo) return

    setValue('tipo_vehiculo', nuevoTipo, { shouldValidate: true })

    if (nuevoTipo === 'caja') {
      const itemsCaja = SISTEMAS_INSPECCION_CAJA_DEFAULT.map(item => ({
        ...item,
        estado: 'Bueno' as const,
        observacion: '',
        foto_url: '',
        detalle_extra: '',
      }))
      setValue('items', itemsCaja)
      replace(itemsCaja)
      setValue('llantas_diagrama', LLANTAS_CAJA_DEFAULT)
      setValue('medida_llantas', '295/75R22.5')
      setValue('medida_profundidad_llantas', '14/32"')

      const esCajaActual = formValores.unidad_id.startsWith('CJ-') || formValores.unidad_id.startsWith('TH-')
      if (!esCajaActual) {
        const primeraCaja = unidadesDisponibles.find(u => u.id.startsWith('CJ-') || u.id.startsWith('TH-')) || {
          id: 'CJ-501',
          placas: '12-EF-5E',
          operacion: 'Local' as const,
        }
        setValue('unidad_id', primeraCaja.id)
        setValue('placas', primeraCaja.placas)
        setValue('tipo_operacion', primeraCaja.operacion)
      }

      setSistemaActivo('Todos')

      agregarToast({
        tipo: 'info',
        titulo: 'Formato Cambiado: Caja / Traila',
        mensaje: 'Cargados 18 puntos físicos y diagrama tandem de 8 neumáticos de caja.',
      })
    } else {
      const itemsTracto = SISTEMAS_INSPECCION_DEFAULT.map(item => ({
        ...item,
        estado: 'Bueno' as const,
        observacion: '',
        foto_url: '',
        detalle_extra: '',
      }))
      setValue('items', itemsTracto)
      replace(itemsTracto)
      setValue('llantas_diagrama', LLANTAS_DEFAULT)
      setValue('medida_llantas', '295/75R22.5')
      setValue('medida_profundidad_llantas', '12/32"')

      const esTractoActual = formValores.unidad_id.startsWith('WH-')
      if (!esTractoActual) {
        const primerTracto = unidadesDisponibles.find(u => u.id.startsWith('WH-')) || {
          id: 'WH-101',
          placas: '78-AA-1B',
          operacion: 'Cruce' as const,
        }
        setValue('unidad_id', primerTracto.id)
        setValue('placas', primerTracto.placas)
        setValue('tipo_operacion', primerTracto.operacion)
      }

      setSistemaActivo('Todos')

      agregarToast({
        tipo: 'info',
        titulo: 'Formato Cambiado: Tractocamión',
        mensaje: 'Cargados 36 puntos físicos y diagrama de 10 neumáticos de tracto.',
      })
    }
  }

  // Timestamp automático en tiempo real
  const [timestampActual, setTimestampActual] = useState<{ fecha: string; hora: string }>(obtenerTimestampMexico)

  // Sincronización continua de fecha y hora automática cada 5 segundos
  useEffect(() => {
    const actualizar = () => {
      const ts = obtenerTimestampMexico()
      setTimestampActual(ts)
      setValue('fecha', ts.fecha)
      setValue('hora', ts.hora)
    }

    actualizar()
    const intervalo = setInterval(actualizar, 5000)
    return () => clearInterval(intervalo)
  }, [setValue])

  // Al entrar al Paso 3, certificar el timestamp exacto del dictamen
  useEffect(() => {
    if (paso === 3) {
      const ts = obtenerTimestampMexico()
      setTimestampActual(ts)
      setValue('fecha', ts.fecha)
      setValue('hora', ts.hora)
    }
  }, [paso, setValue])

  // Auto-sincronización de categorías para items de caja si estuvieran en memoria con nombres previos
  useEffect(() => {
    if (tipoVehiculo === 'caja' && formValores.items && formValores.items.length === 18) {
      let requiereActualizar = false
      const corregidos = formValores.items.map(item => {
        const ref = SISTEMAS_INSPECCION_CAJA_DEFAULT.find(d => d.id === item.id)
        if (ref && item.sistema !== ref.sistema) {
          requiereActualizar = true
          return { ...item, sistema: ref.sistema }
        }
        return item
      })
      if (requiereActualizar) {
        setValue('items', corregidos)
        replace(corregidos)
      }
    }
  }, [tipoVehiculo, formValores.items, setValue, replace])

  // Calibrar el folio histórico correlativo consultando el historial completo
  useEffect(() => {
    async function sincronizarFolioHistorico() {
      const folioHistorico = await generarSiguienteFolioInspeccion()
      if (!hayBorrador) {
        setValue('folio', folioHistorico)
        setValue('numero_reporte_fisico', folioHistorico)
      }
    }
    sincronizarFolioHistorico()
  }, [hayBorrador, setValue])

  // Mantener sincronizados los datos del operador con el usuario autenticado actual
  useEffect(() => {
    if (usuario && !hayBorrador) {
      const idOp = usuario.numeroEmpleado || (usuario.rol === 'admin' ? 'EMP-ADMIN' : usuario.id ? `EMP-${usuario.id}` : 'EMP-409')
      const nomOp = usuario.nombre || 'Juan Morales'
      setValue('operador_id', idOp)
      setValue('operador_nombre', nomOp)
      setValue('firma_digital', nomOp)
      if (usuario.unidadAsignada) {
        setValue('unidad_id', usuario.unidadAsignada)
      }
    }
  }, [usuario, hayBorrador, setValue])

  // Cargar catálogo de unidades disponibles de la flota
  const [unidadesDisponibles, setUnidadesDisponibles] = useState<UnidadOpcion[]>(UNIDADES_CATALOGO_DEFAULT)

  useEffect(() => {
    async function cargarUnidadesSistema() {
      try {
        const listado = await getUnidades('Activo')
        if (listado && listado.length > 0) {
          const formateadas = listado.map(u => ({
            id: u.id_unidad,
            placas: (u as unknown as { placas?: string }).placas || '78-AA-1B',
            operacion: (u.tipo === 'Tractor' ? 'Cruce' : 'Local') as 'Cruce' | 'Foráneo' | 'Local' | 'Backup',
          }))
          setUnidadesDisponibles(formateadas)
        }
      } catch {
        // Modo offline: catálogo predeterminado
      }
    }
    cargarUnidadesSistema()
  }, [])

  // Filtrar catálogo de unidades según tipo de vehículo seleccionado (Tracto vs Caja)
  const unidadesFiltradas = unidadesDisponibles.filter(u => {
    if (tipoVehiculo === 'caja') {
      return u.id.startsWith('CJ-') || u.id.startsWith('TH-') || u.id.toLowerCase().includes('cj') || u.id.toLowerCase().includes('th')
    } else {
      return u.id.startsWith('WH-') || (!u.id.startsWith('CJ-') && !u.id.startsWith('TH-'))
    }
  })
  const unidadesParaSelector = unidadesFiltradas.length > 0 ? unidadesFiltradas : unidadesDisponibles

  // Comprobar borrador al cargar
  useEffect(() => {
    async function checarBorrador() {
      if (!usuario) return
      const borrador = await obtenerBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
      if (borrador) {
        setHayBorrador(true)
      }
    }
    checarBorrador()
  }, [usuario])

  // Cargar borrador previo
  const cargarBorrador = async () => {
    if (!usuario) return
    const borrador = await obtenerBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
    if (borrador) {
      reset(borrador as OrdenInspeccionForm)
      if (borrador.items && Array.isArray(borrador.items)) {
        replace(borrador.items)
      }
      setHayBorrador(false)
      agregarToast({
        tipo: 'info',
        titulo: 'Borrador Cargado',
        mensaje: 'Se restauraron los datos locales en la tableta.',
      })
    }
  }

  // Descartar borrador
  const descartarBorrador = async () => {
    if (!usuario) return
    await eliminarBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
    setHayBorrador(false)
    agregarToast({
      tipo: 'warning',
      titulo: 'Borrador Descartado',
      mensaje: 'Iniciando inspección en blanco.',
    })
  }

  // Guardar borrador manual
  const guardarPasoBorrador = async () => {
    if (!usuario) return
    setGuardandoBorrador(true)
    try {
      await guardarBorradorLocal(usuario.numeroEmpleado || 'EMP-409', formValores)
      agregarToast({
        tipo: 'success',
        titulo: 'Borrador Guardado',
        mensaje: 'Los datos están protegidos en IndexedDB localmente.',
      })
    } finally {
      setGuardandoBorrador(false)
    }
  }

  // Lista de items activa asegurada
  const listaItemsActiva = (formValores.items && formValores.items.length > 0)
    ? formValores.items
    : fields

  // Acción rápida: Marcar todos como conformes (Aprobación limpia PreTrip/PostTrip)
  const marcarTodosComoConformes = () => {
    listaItemsActiva.forEach((_, idx) => {
      setValue(`items.${idx}.estado`, 'Bueno')
      setValue(`items.${idx}.observacion`, '')
    })
    // También aprobar todas las llantas del diagrama
    const llantasBase = tipoVehiculo === 'caja' ? LLANTAS_CAJA_DEFAULT : LLANTAS_DEFAULT
    const llantasAprobadas = (formValores.llantas_diagrama || llantasBase).map(l => ({
      ...l,
      estado: 'OK' as const,
      profundidad: formValores.medida_profundidad_llantas || '14/32"',
      observacion: '',
    }))
    setValue('llantas_diagrama', llantasAprobadas)
    setValue('declaracion_defecto', 'sin_defectos')

    agregarToast({
      tipo: 'success',
      titulo: 'Todos los Parámetros Conformes',
      mensaje: tipoVehiculo === 'caja'
        ? '18 puntos físicos y 8 ruedas de caja aprobados sin defectos.'
        : '36 puntos físicos y 10 llantas de tracto aprobados sin defectos.',
    })
  }

  // Acción rápida: Aprobar solo el sistema seleccionado
  const marcarSistemaConforme = (nombreSistema: string) => {
    listaItemsActiva.forEach((f, idx) => {
      if (f.sistema === nombreSistema) {
        setValue(`items.${idx}.estado`, 'Bueno')
        setValue(`items.${idx}.observacion`, '')
      }
    })
    agregarToast({
      tipo: 'success',
      titulo: `Sistema ${nombreSistema} Conforme`,
      mensaje: 'Componentes del sistema aprobados.',
    })
  }

  // Inserción de tag de falla rápida
  const aplicarFallaRapida = (idx: number, textoFalla: string) => {
    setValue(`items.${idx}.observacion`, textoFalla, { shouldValidate: true })
    setValue('declaracion_defecto', 'con_defectos')
  }

  // Carga de foto real mediante input de archivo / cámara
  const manejarCapturaFoto = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setValue(`items.${idx}.foto_url`, reader.result as string)
        agregarToast({
          tipo: 'info',
          titulo: 'Fotografía Capturada',
          mensaje: `Evidencia fotográfica adjuntada para ${formValores.items[idx]?.componente}.`,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Simulación de foto de muestra
  const adjuntarFotoEvidenciaMuestra = (idx: number) => {
    const fotosMuestra = [
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80',
    ]
    const foto = fotosMuestra[idx % fotosMuestra.length]
    setValue(`items.${idx}.foto_url`, foto)
  }

  const removerFotoEvidencia = (idx: number) => {
    setValue(`items.${idx}.foto_url`, '')
  }

  // Ajuste rápido de odómetro en Millas (+50, +100, +500)
  const ajustarOdometroMillas = (deltaMillas: number) => {
    const actualMillas = formValores.odometro_millas || 266500
    const nuevoMillas = actualMillas + deltaMillas
    setValue('odometro_millas', nuevoMillas, { shouldValidate: true })
    // Convertir de referencia a km aproximados (1 milla ≈ 1.60934 km)
    setValue('kilometraje', Math.round(nuevoMillas * 1.60934))
  }

  // Manejo de firma táctil en pantalla de tablet
  const obtenerCoordenadas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const iniciarTrazo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = obtenerCoordenadas(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDibujando(true)
  }

  const dibujarTrazo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dibujando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = obtenerCoordenadas(e)
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#F2620F'
    ctx.lineTo(x, y)
    ctx.stroke()
    setTieneFirmaDigital(true)
  }

  const finalizarTrazo = () => {
    setDibujando(false)
  }

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTieneFirmaDigital(false)
  }

  // Envío final del cuestionario
  const alEnviar = async (datos: OrdenInspeccionForm) => {
    // Protección estricta: Jamás emitir si no estamos en el Paso 3
    if (paso !== 3) {
      setPaso(3)
      return
    }

    // Validación obligatoria: El operador debe firmar en el canvas táctil
    if (!tieneFirmaDigital) {
      agregarToast({
        tipo: 'warning',
        titulo: 'Firma de Operador Requerida',
        mensaje: 'Debes plasmar tu firma en el recuadro de la tableta antes de finalizar y emitir el reporte.',
      })
      return
    }

    // Capturar firma gráfica del canvas táctil
    if (canvasRef.current && tieneFirmaDigital) {
      try {
        const firmaImg = canvasRef.current.toDataURL('image/png')
        datos.firma_digital = firmaImg
      } catch {
        // Fallback a nombre de usuario
      }
    }

    // Sello de tiempo oficial final al emitir reporte
    const tsFinal = obtenerTimestampMexico()
    datos.fecha = tsFinal.fecha
    datos.hora = tsFinal.hora
    setValue('fecha', tsFinal.fecha)
    setValue('hora', tsFinal.hora)

    const tieneCritico = datos.items.some(i => i.estado === 'Crítico')
    const tieneRegular = datos.items.some(i => i.estado === 'Regular')
    const tieneLlantaCritica = datos.llantas_diagrama?.some(l => l.estado === 'Dañada' || l.estado === 'Cambio')
    const tieneLlantaWarning = datos.llantas_diagrama?.some(l => l.estado === 'Desgaste' || l.estado === 'Baja Presión')

    const requiereOt = tieneCritico || tieneRegular || tieneLlantaCritica || tieneLlantaWarning

    const ordenCompleta: OrdenInspeccionForm = {
      ...datos,
      requiere_ot: requiereOt,
      sincronizado: isOnline,
    }

    // 1. Guardar en IndexedDB local y avanzar consecutivo histórico
    await guardarInspeccionFinalizada(ordenCompleta)
    registrarFolioEmitido(ordenCompleta.folio)

    // 2. Si estamos online, enviar al backend CI4
    if (isOnline) {
      try {
        await fetch('/api/v1/operadores/inspecciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operador_id: 1, // Mapeado a operador
            unidad_id: 1,
            kilometraje: datos.odometro_millas,
            nivel_combustible: datos.nivel_combustible === 'Lleno' ? 100 : datos.nivel_combustible === '3/4' ? 75 : 50,
            tiene_anomalias: requiereOt ? 1 : 0,
            datos_json: ordenCompleta,
          })
        })
      } catch {
        // Modo offline resiliente
      }
    }

    // 3. Limpiar borrador temporal
    if (usuario) {
      await eliminarBorradorLocal(usuario.numeroEmpleado || 'EMP-409')
    }

    // 4. Mostrar documento oficial emitido
    setOrdenGenerada(ordenCompleta)
    setModalAbierto(true)

    agregarToast({
      tipo: 'success',
      titulo: 'Reporte de Inspección Emitido',
      mensaje: `Reporte ${ordenCompleta.folio} generado con éxito. ${
        requiereOt ? 'Se disparó orden correctiva a Taller.' : 'Unidad en condición conforme para viaje.'
      }`,
    })
  }

  // Mapeo unificado con índice real y clave única para renderizado y mutación
  const itemsConIndice = listaItemsActiva.map((item, index) => ({
    item,
    realIdx: index,
    fieldId: fields[index]?.id || item.id || `item-${index}`,
  }))

  // Filtrado de items por sistema en Paso 2
  const itemsFiltrados = itemsConIndice.filter(({ item }) => {
    if (sistemaActivo === 'Todos' || sistemaActivo === 'Diagrama de Llantas') return true
    return item.sistema === sistemaActivo
  })

  // Conteo de items por estado
  const conteoBueno = formValores.items?.filter(i => i.estado === 'Bueno').length || 0
  const conteoRegular = formValores.items?.filter(i => i.estado === 'Regular').length || 0
  const conteoCritico = formValores.items?.filter(i => i.estado === 'Crítico').length || 0

  const llantasConProblema = (formValores.llantas_diagrama || []).filter(l => l.estado !== 'OK').length

  return (
    <div className="space-y-4 sm:space-y-5 pb-14">
      {/* Encabezado Oficial Warhorse Brokerage */}
      <div className="flex flex-col gap-4 border-b border-[rgba(243,239,231,0.1)] pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#F2620F] px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-black uppercase tracking-wider text-[#16191E]">
                Paso {paso} de 3
              </span>
              <span className="font-mono text-sm font-black text-[#C5A059] bg-black/40 border border-[#C5A059]/30 px-2.5 py-0.5 rounded">
                FOLIO: {formValores.folio}
              </span>
              <span className="rounded bg-[#3FA65C]/20 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#3FA65C] flex items-center gap-1">
                <Wifi className="h-3 w-3" /> {isOnline ? 'En Línea' : 'Offline / IndexDB'}
              </span>
              <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                {formValores.tipo_inspeccion}
              </span>
            </div>

            <h1 className="mt-1 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black uppercase tracking-wide text-white">
              {tipoVehiculo === 'caja' ? 'REPORTE DE INSPECCIÓN DE CAJA' : 'REPORTE DE INSPECCIÓN DE VIAJE'}
            </h1>
            <p className="text-xs text-[#B8B2A6]">
              {tipoVehiculo === 'caja'
                ? 'Formato oficial de inspección física de semirremolque y traila (Warhorse Brokerage).'
                : 'Formato oficial de inspección física de unidad para PreTrip y PostTrip (Warhorse Brokerage).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SELECTOR CLARO Y GRANDE PARA CAMBIAR TIPO DE INSPECCIÓN (TRACTO VS CAJA) */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0B0E11] border-2 border-[rgba(243,239,231,0.15)] shadow-xl">
              <button
                type="button"
                onClick={() => cambiarTipoVehiculo('tracto')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-['Barlow_Condensed'] text-sm sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer ${
                  tipoVehiculo === 'tracto'
                    ? 'bg-[#F2620F] text-[#16191E] shadow-lg shadow-[#F2620F]/30 scale-[1.02]'
                    : 'text-[#B8B2A6] hover:text-white hover:bg-white/5'
                }`}
              >
                <Truck className="h-5 w-5 stroke-[2.5]" />
                <span>Tractocamión</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarTipoVehiculo('caja')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-['Barlow_Condensed'] text-sm sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer ${
                  tipoVehiculo === 'caja'
                    ? 'bg-[#C5A059] text-[#16191E] shadow-lg shadow-[#C5A059]/30 scale-[1.02]'
                    : 'text-[#B8B2A6] hover:text-white hover:bg-white/5'
                }`}
              >
                <Box className="h-5 w-5 stroke-[2.5]" />
                <span>Caja / Traila</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/patio')}
                className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2.5 text-xs font-semibold text-[#f3f4f6] hover:border-[#C5A059] hover:text-[#C5A059] transition-all cursor-pointer"
              >
                <Home className="h-4 w-4 text-[#C5A059]" />
                <span className="hidden sm:inline">Menú Patio</span>
              </button>
              <button
                type="button"
                onClick={guardarPasoBorrador}
                disabled={guardandoBorrador}
                className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2.5 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{guardandoBorrador ? 'Guardando...' : 'Guardar Borrador'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Borrador Existente */}
      {hayBorrador && (
        <div className="flex items-center justify-between rounded-2xl border border-[#C5A059]/40 bg-[#C5A059]/15 p-3.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-[#C5A059] shrink-0" />
            <div>
              <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wide text-white">
                Borrador pendiente detectado
              </div>
              <div className="text-xs text-[#B8B2A6]">
                Tienes una inspección guardada localmente en la memoria de esta tableta.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargarBorrador}
              className="rounded-xl bg-[#C5A059] px-4 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#b08d48] transition-all cursor-pointer"
            >
              Reanudar
            </button>
            <button
              type="button"
              onClick={descartarBorrador}
              className="rounded-xl border border-[rgba(243,239,231,0.15)] px-3 py-1.5 text-xs text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Indicador de Pasos del Formato Físico (Diseñado para Tablet) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        <div
          onClick={() => setPaso(1)}
          className={`flex items-center gap-3 rounded-2xl border p-3 transition-all cursor-pointer ${
            paso === 1
              ? 'border-[#F2620F] bg-[#F2620F]/15 shadow-md shadow-[#F2620F]/10'
              : paso > 1
              ? 'border-[#3FA65C] bg-[#3FA65C]/10'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-['Barlow_Condensed'] text-sm font-bold ${
              paso === 1
                ? 'bg-[#F2620F] text-[#16191E]'
                : paso > 1
                ? 'bg-[#3FA65C] text-[#16191E]'
                : 'bg-white/10 text-[#B8B2A6]'
            }`}
          >
            01
          </div>
          <div>
            <div className="font-['Barlow_Condensed'] text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Control de Viaje
            </div>
            <div className="hidden text-[10px] text-[#B8B2A6] sm:block">
              {tipoVehiculo === 'caja' ? 'PreTrip/PostTrip y Placas de Traila' : 'PreTrip / PostTrip, Odómetro y Placas'}
            </div>
          </div>
        </div>

        <div
          onClick={() => setPaso(2)}
          className={`flex items-center gap-3 rounded-2xl border p-3 transition-all cursor-pointer ${
            paso === 2
              ? 'border-[#F2620F] bg-[#F2620F]/15 shadow-md shadow-[#F2620F]/10'
              : paso > 2
              ? 'border-[#3FA65C] bg-[#3FA65C]/10'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-['Barlow_Condensed'] text-sm font-bold ${
              paso === 2
                ? 'bg-[#F2620F] text-[#16191E]'
                : paso > 2
                ? 'bg-[#3FA65C] text-[#16191E]'
                : 'bg-white/10 text-[#B8B2A6]'
            }`}
          >
            02
          </div>
          <div>
            <div className="font-['Barlow_Condensed'] text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              {tipoVehiculo === 'caja' ? 'Checklist Caja & Diagrama' : 'Checklist & Diagrama Ejes'}
            </div>
            <div className="hidden text-[10px] text-[#B8B2A6] sm:block">
              {tipoVehiculo === 'caja' ? '18 Puntos Físicos y 8 Llantas' : '36 Puntos Físicos y 10 Llantas'}
            </div>
          </div>
        </div>

        <div
          onClick={() => setPaso(3)}
          className={`flex items-center gap-3 rounded-2xl border p-3 transition-all cursor-pointer ${
            paso === 3
              ? 'border-[#F2620F] bg-[#F2620F]/15 shadow-md shadow-[#F2620F]/10'
              : 'border-[rgba(243,239,231,0.08)] bg-[#14181D]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-['Barlow_Condensed'] text-sm font-bold ${
              paso === 3 ? 'bg-[#F2620F] text-[#16191E]' : 'bg-white/10 text-[#B8B2A6]'
            }`}
          >
            03
          </div>
          <div>
            <div className="font-['Barlow_Condensed'] text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Carrier Report & Firma
            </div>
            <div className="hidden text-[10px] text-[#B8B2A6] sm:block">Defectos Corregidos y Firma Operador</div>
          </div>
        </div>
      </div>

      {/* Formulario Principal del Wizard */}
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          if (paso === 3) {
            handleSubmit(alEnviar)(e)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault()
          }
        }}
      >
        {/* ========================================================================= */}
        {/* PASO 1: ENCABEZADO Y DATOS DE CONTROL (PreTrip / PostTrip / Placas)       */}
        {/* ========================================================================= */}
        {paso === 1 && (
          <div className="rounded-3xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-5 sm:p-6 backdrop-blur-md space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[rgba(243,239,231,0.08)] pb-4">
              <div>
                <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                  Paso 1: Parámetros del Formato de Inspección
                </h3>
                <p className="text-xs text-[#B8B2A6] mt-0.5">
                  Establece si el chequeo corresponde a la salida (PreTrip) o arribo (PostTrip), e ingresa los identificadores del vehículo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#C5A059] bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                  FOLIO: {formValores.folio}
                </span>
              </div>
            </div>

            {/* SELECCIÓN PRINCIPAL: TIPO DE INSPECCIÓN (PreTrip vs PostTrip) */}
            <div className="rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#0F0F10] p-3.5 space-y-2">
              <label className="block text-xs font-['Barlow_Condensed'] font-black uppercase tracking-wider text-[#C5A059]">
                TIPO DE INSPECCIÓN:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('tipo_inspeccion', 'PreTrip', { shouldValidate: true })}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl font-['Barlow_Condensed'] text-sm sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer ${
                    formValores.tipo_inspeccion === 'PreTrip'
                      ? 'bg-[#F2620F] text-[#16191E] shadow-lg shadow-[#F2620F]/20 scale-[1.01]'
                      : 'bg-[#1C1C1C] border border-white/10 text-[#B8B2A6] hover:text-white'
                  }`}
                >
                  <FileCheck2 className="h-5 w-5" />
                  <span>Inspección PreTrip (Salida)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('tipo_inspeccion', 'PostTrip', { shouldValidate: true })}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl font-['Barlow_Condensed'] text-sm sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer ${
                    formValores.tipo_inspeccion === 'PostTrip'
                      ? 'bg-[#C5A059] text-[#16191E] shadow-lg shadow-[#C5A059]/20 scale-[1.01]'
                      : 'bg-[#1C1C1C] border border-white/10 text-[#B8B2A6] hover:text-white'
                  }`}
                >
                  <FileCheck2 className="h-5 w-5" />
                  <span>Inspección PostTrip (Llegada)</span>
                </button>
              </div>
            </div>

            {/* Grid de Campos del Formato Físico */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Folio de Inspección (Asignado Automáticamente por el Sistema) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#B8B2A6]">
                    Folio de Inspección (Sistema)
                  </label>
                  <span className="inline-flex items-center gap-1 rounded bg-[#3FA65C]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#3FA65C] border border-[#3FA65C]/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3FA65C] animate-pulse" />
                    SISTEMA
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formValores.folio}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#101317] py-2.5 px-3.5 font-mono text-base font-black text-[#C5A059] focus:outline-none cursor-default select-all"
                  />
                  <span className="absolute right-3.5 top-3 text-[10px] font-mono text-[#B8B2A6]">AUTO</span>
                </div>
              </div>

              {/* Fecha Oficial (Timestamp Automático) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#B8B2A6]">Fecha Oficial</label>
                  <span className="inline-flex items-center gap-1 rounded bg-[#3FA65C]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#3FA65C] border border-[#3FA65C]/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3FA65C] animate-pulse" />
                    AUTO
                  </span>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-[#C5A059]" />
                  <input
                    type="text"
                    readOnly
                    {...register('fecha')}
                    value={formValores.fecha || timestampActual.fecha}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#101317] py-2.5 pl-10 pr-3 font-mono text-sm font-bold text-white focus:outline-none cursor-default select-all"
                  />
                </div>
              </div>

              {/* Hora Oficial (Timestamp Automático en Tiempo Real) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#B8B2A6]">Hora Oficial</label>
                  <span className="inline-flex items-center gap-1 rounded bg-[#3FA65C]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#3FA65C] border border-[#3FA65C]/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3FA65C] animate-pulse" />
                    EN VIVO
                  </span>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3 h-4 w-4 text-[#C5A059]" />
                  <input
                    type="text"
                    readOnly
                    {...register('hora')}
                    value={formValores.hora || timestampActual.hora}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#101317] py-2.5 pl-10 pr-10 font-mono text-sm font-bold text-white focus:outline-none cursor-default select-all"
                  />
                  <button
                    type="button"
                    title="Sincronizar hora al segundo actual"
                    onClick={() => {
                      const ts = obtenerTimestampMexico()
                      setTimestampActual(ts)
                      setValue('fecha', ts.fecha)
                      setValue('hora', ts.hora)
                      agregarToast({
                        tipo: 'info',
                        titulo: 'Hora Sincronizada',
                        mensaje: `Timestamp actualizado: ${ts.hora}`,
                      })
                    }}
                    className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-[#B8B2A6] hover:bg-[#F2620F]/20 hover:text-[#F2620F] transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Unidad / Tracto (# DE CAMION o TRAILA(S)) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">
                  {tipoVehiculo === 'caja' ? 'TRAILA(S) / NÚMERO DE CAJA' : '# DE CAMIÓN (Unidad)'}
                </label>
                <select
                  {...register('unidad_id')}
                  onChange={e => {
                    const found = unidadesParaSelector.find(u => u.id === e.target.value)
                    if (found) {
                      setValue('placas', found.placas)
                      setValue('tipo_operacion', found.operacion)
                    }
                  }}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 font-['Barlow_Condensed'] text-base font-bold text-white focus:border-[#F2620F] focus:outline-none"
                >
                  {unidadesParaSelector.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.id} (Placas: {u.placas} · {u.operacion})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#B8B2A6] mt-1 block">
                  {tipoVehiculo === 'caja'
                    ? 'Identificador oficial de la caja/traila asignada.'
                    : 'Selecciona la unidad correspondiente del catálogo de la flota.'}
                </span>
              </div>

              {/* # DE PLACAS */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">
                  {tipoVehiculo === 'caja' ? '# DE PLACAS (Caja/Traila)' : '# DE PLACAS'}
                </label>
                <input
                  type="text"
                  {...register('placas')}
                  placeholder={tipoVehiculo === 'caja' ? '12-EF-5E' : '78-AA-1B'}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 font-['Barlow_Condensed'] text-base font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              {/* Nombre de Operador */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">
                  NOMBRE DE OPERADOR
                </label>
                <input
                  type="text"
                  {...register('operador_nombre')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 text-xs text-white focus:border-[#F2620F] focus:outline-none font-medium"
                />
              </div>

              {/* Número de Licencia */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6]">
                  NÚMERO DE LICENCIA
                </label>
                <input
                  type="text"
                  {...register('licencia')}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              {/* CAMPOS ESPECÍFICOS DE TRACTOCAMIÓN: ODÓMETRO Y COMBUSTIBLE */}
              {tipoVehiculo === 'tracto' ? (
                <>
                  {/* ODOMETRO (Millas) */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6] flex items-center justify-between">
                      <span>ODÓMETRO (Millas)</span>
                      <span className="text-[#C5A059] font-mono text-[11px]">
                        ≈ {Math.round((formValores.odometro_millas || 0) * 1.60934).toLocaleString()} km
                      </span>
                    </label>
                    <div className="relative">
                      <Gauge className="absolute left-3.5 top-3 h-4 w-4 text-[#F2620F]" />
                      <input
                        type="number"
                        {...register('odometro_millas', { 
                          valueAsNumber: true,
                          onChange: (e) => {
                            const m = Number(e.target.value) || 0
                            setValue('kilometraje', Math.round(m * 1.60934))
                          }
                        })}
                        className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 pl-10 pr-3 font-['Barlow_Condensed'] text-base font-bold tabular-nums text-white focus:border-[#F2620F] focus:outline-none"
                      />
                    </div>
                    {/* Steppers táctiles para ajuste veloz */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] text-[#B8B2A6] uppercase font-['Barlow_Condensed'] mr-1">Rápido:</span>
                      {[50, 100, 500].map(delta => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => ajustarOdometroMillas(delta)}
                          className="h-7 px-2 rounded-lg bg-[#101317] border border-[rgba(243,239,231,0.1)] text-[#B8B2A6] font-['Barlow_Condensed'] text-xs font-bold hover:text-white hover:border-[#F2620F] transition-all flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="h-3 w-3 text-[#F2620F]" />
                          <span>{delta} mi</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nivel de Combustible Táctil */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#B8B2A6] flex items-center gap-1.5">
                      <Fuel className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>Nivel de Combustible</span>
                    </label>
                    <div className="grid grid-cols-5 gap-1 rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#101317] p-1">
                      {NIVELES_COMBUSTIBLE.map(nivel => (
                        <button
                          key={nivel}
                          type="button"
                          onClick={() => setValue('nivel_combustible', nivel, { shouldValidate: true })}
                          className={`h-9 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase transition-all cursor-pointer ${
                            formValores.nivel_combustible === nivel
                              ? nivel === 'Reserva'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-[#C5A059] text-[#16191E] shadow-md'
                              : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                          }`}
                        >
                          {nivel}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* BANNER INFORMATIVO PARA CAJA / SEMIRREMOLQUE (SIN MOTOR NI COMBUSTIBLE) */
                <div className="md:col-span-2 rounded-2xl border border-[#C5A059]/30 bg-[#C5A059]/10 p-3.5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C5A059]/20 text-[#C5A059]">
                    <Box className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-white">
                      Unidad de Carga: Semirremolque / Caja Seca
                    </div>
                    <div className="text-[11px] text-[#B8B2A6] leading-tight mt-0.5">
                      No aplica Odómetro ni Tanque de Combustible (sin tren motriz). La inspección se enfoca en Perno Rey, Patines, Puertas, Suspensión y 8 Ruedas.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DECLARACIÓN INICIAL DE DEFICIENCIA (Formato Papel Oficial) */}
            <div className="rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#0A0D10] p-4 sm:p-5 space-y-3">
              <span className="text-xs font-['Barlow_Condensed'] font-black uppercase tracking-wider text-[#C5A059]">
                DECLARACIÓN INICIAL DEL OPERADOR:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('declaracion_defecto', 'sin_defectos')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formValores.declaracion_defecto === 'sin_defectos'
                      ? 'border-[#3FA65C] bg-[#3FA65C]/15 text-white'
                      : 'border-[rgba(243,239,231,0.1)] bg-[#14181D] text-[#B8B2A6] hover:text-white'
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    formValores.declaracion_defecto === 'sin_defectos'
                      ? 'bg-[#3FA65C] border-[#3FA65C] text-[#16191E]'
                      : 'border-white/30'
                  }`}>
                    {formValores.declaracion_defecto === 'sin_defectos' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase text-white">
                      No detecté ningún defecto o deficiencia
                    </div>
                    <div className="text-[11px] text-[#B8B2A6] mt-0.5">
                      En este vehículo de motor comercial (100% operativo).
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('declaracion_defecto', 'con_defectos')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formValores.declaracion_defecto === 'con_defectos'
                      ? 'border-[#F2620F] bg-[#F2620F]/15 text-white'
                      : 'border-[rgba(243,239,231,0.1)] bg-[#14181D] text-[#B8B2A6] hover:text-white'
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    formValores.declaracion_defecto === 'con_defectos'
                      ? 'bg-[#F2620F] border-[#F2620F] text-[#16191E]'
                      : 'border-white/30'
                  }`}>
                    {formValores.declaracion_defecto === 'con_defectos' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="font-['Barlow_Condensed'] text-sm font-bold uppercase text-white">
                      Encontré los siguientes defectos
                    </div>
                    <div className="text-[11px] text-[#B8B2A6] mt-0.5">
                      Como se indica a continuación en el checklist físico o diagrama.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: CHECKLIST DE PUNTOS FÍSICOS Y DIAGRAMA DE EJES / LLANTAS          */}
        {/* ========================================================================= */}
        {paso === 2 && (
          <div className="space-y-5">
            {/* COMPONENTE DEDICADO: DIAGRAMA DE EJES Y LLANTAS (10 LLANTAS TRACTO / 8 LLANTAS CAJA) */}
            <DiagramaEjesLlantas
              tipoVehiculo={tipoVehiculo}
              llantas={formValores.llantas_diagrama || (tipoVehiculo === 'caja' ? LLANTAS_CAJA_DEFAULT : LLANTAS_DEFAULT)}
              onChangeLlantas={nuevas => {
                setValue('llantas_diagrama', nuevas, { shouldValidate: true })
                if (nuevas.some(l => l.estado !== 'OK')) {
                  setValue('declaracion_defecto', 'con_defectos')
                }
              }}
              medidaProfundidad={formValores.medida_profundidad_llantas || (tipoVehiculo === 'caja' ? '14/32"' : '12/32"')}
              onChangeMedidaProfundidad={v => setValue('medida_profundidad_llantas', v)}
              medidaLlantas={formValores.medida_llantas || '295/75R22.5'}
              onChangeMedidaLlantas={v => setValue('medida_llantas', v)}
            />

            {/* SECCIÓN CHECKLIST: LOS PUNTOS DEL FORMATO FÍSICO */}
            <div className="rounded-3xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[rgba(243,239,231,0.08)] pb-3.5">
                <div>
                  <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                    {tipoVehiculo === 'caja' ? 'Checklist de 18 Puntos Físicos (Caja/Traila)' : 'Checklist de 36 Puntos Físicos'}
                  </h3>
                  <p className="text-xs text-[#B8B2A6] mt-0.5">
                    {tipoVehiculo === 'caja'
                      ? 'Inspecciona perno rey, patines, techo, puertas, piso, manitas, rotochamber y bolsas de aire de la caja.'
                      : 'Recorre el tracto e indica el estado de cada punto. Si seleccionas Regular o Crítico, detalla la falla.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={marcarTodosComoConformes}
                    className="flex items-center gap-1.5 rounded-xl border border-[#3FA65C]/40 bg-[#3FA65C]/15 px-3.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#3FA65C] hover:bg-[#3FA65C] hover:text-[#16191E] transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Aprobar Todos (100%)</span>
                  </button>
                </div>
              </div>

              {/* Barra de Progreso y Conteo en Vivo */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-[#0d1013] border border-[rgba(243,239,231,0.08)] p-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#C5A059]" />
                  <span className="text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#B8B2A6]">
                    Filtrar por Zona de Inspección:
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-['Barlow_Condensed'] font-bold">
                  <span className="text-[#3FA65C] flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {conteoBueno} Conformes
                  </span>
                  <span className="text-[#C5A059] flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {conteoRegular} Advertencias
                  </span>
                  <span className="text-[#F2620F] flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> {conteoCritico} Críticos
                  </span>
                  {llantasConProblema > 0 && (
                    <span className="text-red-400 flex items-center gap-1">
                      <Disc className="h-3.5 w-3.5" /> {llantasConProblema} {tipoVehiculo === 'caja' ? 'Ruedas Observadas' : 'Llantas Observadas'}
                    </span>
                  )}
                </div>
              </div>

              {/* Pestañas de Selección de Subsistemas del Vehículo */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(tipoVehiculo === 'caja' ? SISTEMAS_TABS_CAJA : SISTEMAS_TABS_TRACTO).map(tab => {
                  if (tab.startsWith('Diagrama de Llantas')) return null // Ya está arriba
                  const countEnSistema = tab === 'Todos' 
                    ? listaItemsActiva.length 
                    : listaItemsActiva.filter(f => f.sistema === tab).length

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSistemaActivo(tab)}
                      className={`h-9 px-3.5 rounded-xl font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        sistemaActivo === tab
                          ? 'bg-[#F2620F] text-[#16191E] shadow-md font-extrabold'
                          : 'bg-[#101317] border border-[rgba(243,239,231,0.1)] text-[#B8B2A6] hover:text-white'
                      }`}
                    >
                      <span>{tab}</span>
                      <span className="ml-1.5 opacity-75 text-[11px]">({countEnSistema})</span>
                    </button>
                  )
                })}

                {sistemaActivo !== 'Todos' && !sistemaActivo.startsWith('Diagrama de Llantas') && (
                  <button
                    type="button"
                    onClick={() => marcarSistemaConforme(sistemaActivo)}
                    className="ml-auto h-9 px-3 rounded-xl bg-[#3FA65C]/15 border border-[#3FA65C]/40 text-[#3FA65C] font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider hover:bg-[#3FA65C] hover:text-[#16191E] transition-all cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Aprobar {sistemaActivo}</span>
                  </button>
                )}
              </div>

              {/* Matriz de Componentes en Doble Columna Táctil para Tablet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {itemsFiltrados.map(({ item, realIdx, fieldId }) => {
                  const itemActual = formValores.items?.[realIdx] || item
                  const tieneFalla = itemActual?.estado !== 'Bueno'
                  const errorItem = errors.items?.[realIdx]?.observacion
                  const tieneFoto = Boolean(itemActual?.foto_url)
                  const fallasPredefinidas = TAGS_FALLAS_COMUNES[item.id] || [
                    'Fuga o goteo visible',
                    'Desgaste excesivo',
                    'Roto / Dañado',
                    'No opera correctamente'
                  ]

                  const esAceiteNivel = item.id === 'aceite_nivel'

                  return (
                    <div
                      key={fieldId}
                      className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
                        itemActual?.estado === 'Crítico'
                          ? 'border-[#F2620F]/60 bg-[#B4430A]/15 shadow-md shadow-[#F2620F]/10'
                          : itemActual?.estado === 'Regular'
                          ? 'border-[#C5A059]/60 bg-[#C5A059]/15 shadow-md shadow-[#C5A059]/10'
                          : 'border-[rgba(243,239,231,0.08)] bg-[#101317]/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div>
                          <span className="text-[10px] uppercase font-['Barlow_Condensed'] font-semibold tracking-wider text-[#C5A059]">
                            {item.sistema}
                          </span>
                          <h4 className="font-['Barlow_Condensed'] text-base sm:text-lg font-bold text-white">
                            {item.componente}
                          </h4>
                        </div>

                        {/* Segmented Control Táctil de 3 Botones para Dedos (44px) */}
                        <Controller
                          control={control}
                          name={`items.${realIdx}.estado`}
                          render={({ field: selectField }) => (
                            <div className="grid grid-cols-3 gap-1 rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#0f0f10] p-1 shrink-0 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => selectField.onChange('Bueno')}
                                className={`flex items-center justify-center gap-1 h-10 sm:h-11 px-3 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                  selectField.value === 'Bueno'
                                    ? 'bg-[#3FA65C] text-[#16191E] shadow-md font-extrabold'
                                    : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Bueno</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  selectField.onChange('Regular')
                                  setValue('declaracion_defecto', 'con_defectos')
                                }}
                                className={`flex items-center justify-center gap-1 h-10 sm:h-11 px-3 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                  selectField.value === 'Regular'
                                    ? 'bg-[#C5A059] text-[#16191E] shadow-md font-extrabold'
                                    : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                                }`}
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Regular</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  selectField.onChange('Crítico')
                                  setValue('declaracion_defecto', 'con_defectos')
                                }}
                                className={`flex items-center justify-center gap-1 h-10 sm:h-11 px-3 rounded-lg font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                  selectField.value === 'Crítico'
                                    ? 'bg-[#F2620F] text-[#16191E] shadow-md font-extrabold'
                                    : 'text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white'
                                }`}
                              >
                                <ShieldAlert className="h-3.5 w-3.5" />
                                <span>Crítico</span>
                              </button>
                            </div>
                          )}
                        />
                      </div>

                      {/* Control Específico para Aceite/nivel (Línea en blanco del formato físico) */}
                      {esAceiteNivel && (
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#C5A059] font-bold">
                            Nivel de Aceite:
                          </span>
                          {CHIPS_ACEITE_NIVEL.map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setValue(`items.${realIdx}.detalle_extra`, chip)
                                if (chip !== 'Normal') {
                                  setValue(`items.${realIdx}.estado`, 'Regular')
                                  setValue(`items.${realIdx}.observacion`, `Aceite de motor con nivel: ${chip}`)
                                  setValue('declaracion_defecto', 'con_defectos')
                                }
                              }}
                              className={`h-6 px-2 rounded-md font-['Barlow_Condensed'] text-[10px] font-bold transition-all cursor-pointer ${
                                itemActual?.detalle_extra === chip
                                  ? 'bg-[#F2620F] text-[#16191E]'
                                  : 'bg-[#1C1C1C] text-[#B8B2A6] border border-white/10 hover:text-white'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Detalle de Falla y Evidencia Fotográfica */}
                      {tieneFalla && (
                        <div className="mt-3 pt-3 border-t border-[rgba(243,239,231,0.08)] space-y-2.5 animate-in fade-in duration-200">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-[#f3f4f6]">
                              Detalle de la Falla u Observación (Obligatorio)
                            </label>
                            <input
                              type="text"
                              placeholder="Describe la anomalía observada..."
                              {...register(`items.${realIdx}.observacion`)}
                              className="w-full rounded-xl border border-[#C5A059]/40 bg-[#14181D] py-2 px-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
                            />
                            {errorItem && (
                              <p className="mt-1 text-[11px] text-[#F2620F] font-medium">
                                {errorItem.message}
                              </p>
                            )}
                          </div>

                          {/* Chips de Selección Rápida de Fallas */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-[#B8B2A6] uppercase font-['Barlow_Condensed'] mr-1">
                              Atajos:
                            </span>
                            {fallasPredefinidas.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => aplicarFallaRapida(realIdx, tag)}
                                className="h-6 px-2 rounded-md bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] text-[10px] text-[#B8B2A6] font-medium hover:text-[#C5A059] hover:border-[#C5A059] transition-all cursor-pointer"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>

                          {/* Botones de Evidencia Fotográfica */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[rgba(243,239,231,0.06)]">
                            {tieneFoto ? (
                              <div className="flex items-center gap-2 rounded-xl border border-[#3FA65C]/40 bg-[#3FA65C]/10 p-1.5 pr-3">
                                <img 
                                  src={itemActual.foto_url} 
                                  alt="Evidencia" 
                                  className="h-10 w-10 rounded-lg object-cover border border-white/20" 
                                />
                                <div className="text-[11px] text-[#3FA65C] font-semibold">
                                  Fotografía registrada
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removerFotoEvidencia(realIdx)}
                                  className="ml-auto rounded-full p-1 text-[#B8B2A6] hover:bg-white/10 hover:text-white cursor-pointer"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label
                                  htmlFor={`camara-input-${realIdx}`}
                                  className="flex items-center gap-1.5 rounded-xl border border-[#F2620F]/40 bg-[#F2620F]/10 px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F] hover:bg-[#F2620F] hover:text-[#16191E] transition-all cursor-pointer"
                                >
                                  <Camera className="h-3.5 w-3.5" />
                                  <span>Abrir Cámara</span>
                                </label>
                                <input
                                  id={`camara-input-${realIdx}`}
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  ref={el => { fileInputRefs.current[realIdx] = el }}
                                  onChange={(e) => manejarCapturaFoto(realIdx, e)}
                                  className="hidden"
                                />

                                <button
                                  type="button"
                                  onClick={() => adjuntarFotoEvidenciaMuestra(realIdx)}
                                  className="flex items-center gap-1 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2.5 py-1.5 font-['Barlow_Condensed'] text-[11px] font-bold uppercase tracking-wider text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
                                >
                                  <Upload className="h-3 w-3" />
                                  <span>Cargar Muestra</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: VEREDICTO, CARRIER REPORT Y FIRMA DE OPERADOR (Formato Oficial)   */}
        {/* ========================================================================= */}
        {paso === 3 && (
          <div className="rounded-3xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/90 p-5 sm:p-6 backdrop-blur-md space-y-6 shadow-xl">
            <div className="border-b border-[rgba(243,239,231,0.08)] pb-3.5">
              <h3 className="font-['Barlow_Condensed'] text-2xl font-black uppercase tracking-wide text-white">
                Paso 3: Veredicto, Carrier Report y Firma de Operador
              </h3>
              <p className="text-xs text-[#B8B2A6] mt-0.5">
                Valida el reporte final, completa la sección Carrier/Agent y plasma tu firma digital directamente en la tableta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Izquierda: Veredicto y Observaciones */}
              <div className="space-y-4">
                {(() => {
                  const items = formValores.items || []
                  const criticos = items.filter(i => i.estado === 'Crítico')
                  const regulares = items.filter(i => i.estado === 'Regular')
                  const llantasDañadas = (formValores.llantas_diagrama || []).filter(l => l.estado === 'Dañada' || l.estado === 'Cambio')
                  const llantasWarning = (formValores.llantas_diagrama || []).filter(l => l.estado === 'Desgaste' || l.estado === 'Baja Presión')

                  const totalCriticos = criticos.length + llantasDañadas.length
                  const totalWarnings = regulares.length + llantasWarning.length
                  const requiereOT = totalCriticos > 0 || totalWarnings > 0

                  return (
                    <div
                      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                        totalCriticos > 0
                          ? 'border-[#F2620F] bg-[#B4430A]/20 shadow-lg shadow-[#F2620F]/15'
                          : totalWarnings > 0
                          ? 'border-[#C5A059] bg-[#C5A059]/20 shadow-lg shadow-[#C5A059]/15'
                          : 'border-[#3FA65C] bg-[#3FA65C]/20 shadow-lg shadow-[#3FA65C]/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {totalCriticos > 0 ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
                            <ShieldAlert className="h-7 w-7" />
                          </div>
                        ) : totalWarnings > 0 ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C5A059] text-[#16191E]">
                            <AlertTriangle className="h-7 w-7" />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3FA65C] text-[#16191E]">
                            <CheckCircle2 className="h-7 w-7" />
                          </div>
                        )}

                        <div>
                          <div className="font-['Barlow_Condensed'] text-xl font-black uppercase tracking-wider text-white">
                            {totalCriticos > 0
                              ? 'Unidad Fuera de Servicio · Requiere OT'
                              : totalWarnings > 0
                              ? 'Unidad Operativa con Advertencias'
                              : 'Unidad Aprobada 100% · Liberación de Viaje'}
                          </div>
                          <p className="text-xs text-[#f3f4f6]/90 mt-0.5">
                            {requiereOT
                              ? 'Se notificará al equipo de Taller Mecánico con la bitácora de anomalías.'
                              : 'La unidad no presenta defectos y está lista para despacho de patio.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 pt-3.5 border-t border-white/10 text-center">
                        <div className="rounded-xl bg-black/30 p-2">
                          <div className="font-['Barlow_Condensed'] text-2xl font-black text-[#F2620F] font-mono">
                            {totalCriticos}
                          </div>
                          <div className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#B8B2A6]">
                            Críticos
                          </div>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2">
                          <div className="font-['Barlow_Condensed'] text-2xl font-black text-[#C5A059] font-mono">
                            {totalWarnings}
                          </div>
                          <div className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#B8B2A6]">
                            Warnings
                          </div>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2">
                          <div className="font-['Barlow_Condensed'] text-2xl font-black text-[#3FA65C] font-mono">
                            {formValores.items.length - criticos.length - regulares.length}
                          </div>
                          <div className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#B8B2A6]">
                            Puntos OK
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* SECCIÓN OBSERVACIONES (Líneas del formato físico de la Image 2) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#C5A059]">
                    OBSERVACIONES:
                  </label>
                  <div className="rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#0F0F10] p-3 space-y-2">
                    <textarea
                      rows={4}
                      placeholder="Escribe aquí cualquier nota, condición especial de la carga o detalles adicionales..."
                      {...register('observaciones_generales')}
                      className="w-full bg-transparent text-xs text-white placeholder-[#B8B2A6]/40 focus:outline-none resize-none leading-relaxed font-mono"
                    />
                    <div className="border-t border-dashed border-white/10 pt-1 text-[10px] text-[#B8B2A6] flex justify-between">
                      <span>Líneas de bitácora oficial</span>
                      <span className="text-[#C5A059]">
                        {tipoVehiculo === 'caja' ? 'Caja / Traila ' : 'Tracto '} {formValores.unidad_id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Carrier Report y Firma de Operador */}
              <div className="space-y-4">
                {/* SECCIÓN OFICIAL: Carrier/Agent's Report (Image 3) */}
                <div className="rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#0F0F10] p-4 space-y-3">
                  <span className="text-xs font-['Barlow_Condensed'] font-black uppercase tracking-wider text-[#C5A059]">
                    Carrier/Agent's Report
                  </span>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-white/5 bg-[#14181D] hover:border-white/20 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('carrier_defectos_corregidos')}
                        className="mt-0.5 h-4 w-4 rounded border-white/30 text-[#F2620F] focus:ring-[#F2620F] cursor-pointer"
                      />
                      <span className="text-xs text-[#f3f4f6] font-medium leading-tight">
                        Defectos Anteriores Corregidos.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-white/5 bg-[#14181D] hover:border-white/20 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('carrier_sin_riesgo')}
                        className="mt-0.5 h-4 w-4 rounded border-white/30 text-[#F2620F] focus:ring-[#F2620F] cursor-pointer"
                      />
                      <span className="text-xs text-[#f3f4f6] font-medium leading-tight">
                        Los defectos anteriores no necesitan ser corregidos para un funcionamiento Seguro del vehículo.
                      </span>
                    </label>
                  </div>
                </div>

                {/* SECCIÓN FIRMA DE OPERADOR DE INSPECCION, FECHA Y HORA (Image 3) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#B8B2A6] flex items-center gap-1.5">
                      <PenTool className="h-3.5 w-3.5 text-[#F2620F]" />
                      <span>FIRMA DE OPERADOR DE INSPECCIÓN</span>
                    </label>
                    {tieneFirmaDigital && (
                      <button
                        type="button"
                        onClick={limpiarFirma}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#F2620F] hover:underline cursor-pointer"
                      >
                        <Eraser className="h-3 w-3" />
                        <span>Limpiar Firma</span>
                      </button>
                    )}
                  </div>

                  {/* Canvas Táctil Interactivo */}
                  <div className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                    tieneFirmaDigital
                      ? 'border-[#3FA65C]/80 bg-[#0d1013] shadow-lg shadow-[#3FA65C]/10'
                      : 'border-[#F2620F]/60 bg-[#0d1013]'
                  }`}>
                    {tieneFirmaDigital && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#3FA65C]/20 border border-[#3FA65C]/40 px-2 py-0.5 rounded-md text-[10px] font-mono text-[#3FA65C]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Firma Capturada</span>
                      </div>
                    )}
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={150}
                      onMouseDown={iniciarTrazo}
                      onMouseMove={dibujarTrazo}
                      onMouseUp={finalizarTrazo}
                      onMouseLeave={finalizarTrazo}
                      onTouchStart={iniciarTrazo}
                      onTouchMove={dibujarTrazo}
                      onTouchEnd={finalizarTrazo}
                      className="w-full h-36 touch-none cursor-crosshair"
                    />
                    {!tieneFirmaDigital && (
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-[#B8B2A6]/60 text-xs">
                        <PenTool className="h-6 w-6 mb-1 text-[#F2620F]/70" />
                        <span className="font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-white/80">
                          Traza tu firma con el dedo sobre este recuadro
                        </span>
                        <span className="text-[10px] text-[#F2620F] mt-0.5">
                          * Obligatoria para emitir reporte
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#B8B2A6]/40 uppercase">
                      WARHORSE OPERATOR SIGNATURE
                    </div>
                  </div>

                  {/* SELLO OFICIAL DE TIEMPO DEL DICTAMEN (Automático) */}
                  <div className="rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#101418] p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] font-['Barlow_Condensed'] font-black uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#C5A059]" />
                        Sello Oficial de Tiempo (Automático)
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#3FA65C]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3FA65C] animate-pulse" />
                        CERTIFICADO
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-[#B8B2A6] uppercase tracking-wider">
                          FECHA
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#C5A059]" />
                          <input
                            type="text"
                            readOnly
                            value={formValores.fecha || timestampActual.fecha}
                            className="w-full rounded-lg border border-white/10 bg-[#16191E] py-1.5 pl-8 pr-2 text-xs text-white font-mono font-bold cursor-default select-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-[#B8B2A6] uppercase tracking-wider">
                          HORA
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#3FA65C]" />
                          <input
                            type="text"
                            readOnly
                            value={formValores.hora || timestampActual.hora}
                            className="w-full rounded-lg border border-white/10 bg-[#16191E] py-1.5 pl-8 pr-2 text-xs text-[#3FA65C] font-mono font-bold cursor-default select-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#B8B2A6]/70 flex items-center justify-between">
                      <span>Timestamp certificado generado automáticamente al dictaminar.</span>
                      <span className="text-[#C5A059] font-mono">EN VIVO</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                      Nombre del Operador
                    </label>
                    <input
                      type="text"
                      placeholder="Escribe tu nombre completo como firma..."
                      {...register('firma_digital')}
                      className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3.5 text-sm text-white focus:border-[#F2620F] focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DOCK INFERIOR FIJO: NAVEGACIÓN Y ACCIÓN ERGONÓMICA EN TABLET             */}
        {/* ========================================================================= */}
        <div className="sticky bottom-0 z-30 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8 mt-6 border-t border-[rgba(243,239,231,0.15)] bg-[#101418]/95 px-4 py-3 sm:px-6 backdrop-blur-xl shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="font-['Barlow_Condensed'] text-xs uppercase tracking-wider text-[#B8B2A6] hidden sm:inline">
              Progreso:
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(num => (
                <div
                  key={num}
                  className={`h-2 rounded-full transition-all ${
                    paso === num
                      ? 'w-7 sm:w-8 bg-[#F2620F]'
                      : paso > num
                      ? 'w-3.5 sm:w-4 bg-[#3FA65C]'
                      : 'w-3.5 sm:w-4 bg-white/20'
                  }`}
                />
              ))}
            </div>
            <span className="font-['Barlow_Condensed'] text-xs font-bold text-white uppercase ml-1">
              Paso {paso} de 3
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {paso > 1 && (
              <button
                type="button"
                onClick={() => setPaso((prev) => (prev - 1) as 1 | 2)}
                className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3.5 sm:px-4 py-2.5 sm:py-3 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
            )}

            {paso === 1 && (
              <button
                key="btn-nav-paso1"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPaso(2)
                }}
                className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 sm:px-8 py-2.5 sm:py-3 font-['Barlow_Condensed'] text-sm sm:text-base font-bold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/25 hover:bg-[#D9550C] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Siguiente: Checklist & Diagrama</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {paso === 2 && (
              <button
                key="btn-nav-paso2"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPaso(3)
                }}
                className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 sm:px-8 py-2.5 sm:py-3 font-['Barlow_Condensed'] text-sm sm:text-base font-bold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/25 hover:bg-[#D9550C] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Siguiente: Carrier Report & Firma</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {paso === 3 && (
              <button
                key="btn-nav-paso3-finalizar"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSubmit(alEnviar)()
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-6 sm:px-8 py-3 sm:py-3.5 font-['Barlow_Condensed'] text-sm sm:text-base font-black uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/30 hover:bg-[#D9550C] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Procesando...' : `Finalizar y Emitir Reporte (${formValores.folio})`}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Modal del Documento Adjunto Oficial emitido */}
      <OrdenInspeccionModal
        inspeccion={ordenGenerada}
        abierto={modalAbierto}
        alCerrar={async () => {
          setModalAbierto(false)
          const nuevoFolio = await generarSiguienteFolioInspeccion()
          reset({
            tipo_vehiculo: tipoVehiculo,
            folio: nuevoFolio,
            numero_reporte_fisico: nuevoFolio,
            fecha: obtenerTimestampMexico().fecha,
            hora: obtenerTimestampMexico().hora,
            tipo_inspeccion: 'PreTrip',
            operador_id: usuario?.numeroEmpleado || 'EMP-409',
            operador_nombre: usuario?.nombre || 'Juan Morales',
            licencia: 'LIC-CHIH-98842',
            unidad_id: formValores.unidad_id,
            placas: formValores.placas,
            tipo_operacion: formValores.tipo_operacion,
            odometro_millas: tipoVehiculo === 'caja' ? undefined : 266500,
            kilometraje: tipoVehiculo === 'caja' ? 0 : 429000,
            nivel_combustible: tipoVehiculo === 'caja' ? undefined : '3/4',
            declaracion_defecto: 'sin_defectos',
            items: (tipoVehiculo === 'caja' ? SISTEMAS_INSPECCION_CAJA_DEFAULT : SISTEMAS_INSPECCION_DEFAULT).map(item => ({
              ...item,
              estado: 'Bueno',
              observacion: '',
              foto_url: '',
              detalle_extra: '',
            })),
            llantas_diagrama: tipoVehiculo === 'caja' ? LLANTAS_CAJA_DEFAULT : LLANTAS_DEFAULT,
            medida_profundidad_llantas: tipoVehiculo === 'caja' ? '14/32"' : '12/32"',
            medida_llantas: '295/75R22.5',
            observaciones_generales: '',
            carrier_defectos_corregidos: false,
            carrier_sin_riesgo: false,
            firma_digital: usuario?.nombre || 'Juan Morales',
            requiere_ot: false,
            sincronizado: false,
          })
          setPaso(1)
          navigate('/patio')
        }}
      />
    </div>
  )
}

export default PatioInspeccion
