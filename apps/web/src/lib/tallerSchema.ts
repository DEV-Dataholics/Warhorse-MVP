import { z } from 'zod'

// 32 Artículos oficiales organizados en las 4 columnas del formato impreso
export interface ArticuloInspeccionTaller {
  id: string
  columna: 1 | 2 | 3 | 4
  etiqueta: string
}

export const ARTICULOS_INSPECCION_TALLER: ArticuloInspeccionTaller[] = [
  // --- Columna 1 ---
  { id: 'compresor_aire', columna: 1, etiqueta: 'Compresor Aire' },
  { id: 'linea_de_aire', columna: 1, etiqueta: 'Línea de Aire' },
  { id: 'baterias', columna: 1, etiqueta: 'Baterías' },
  { id: 'carroceria', columna: 1, etiqueta: 'Carrocería' },
  { id: 'accesorios_frenos', columna: 1, etiqueta: 'Accesorios de Frenos' },
  { id: 'frenos_servicio', columna: 1, etiqueta: 'Frenos de Servicio' },
  { id: 'freno_estacionario', columna: 1, etiqueta: 'Freno Estacionario' },
  { id: 'prensa', columna: 1, etiqueta: 'Prensa' },

  // --- Columna 2 ---
  { id: 'linea_combustible', columna: 2, etiqueta: 'Línea de Combustible' },
  { id: 'motor', columna: 2, etiqueta: 'Motor' },
  { id: 'quinta_rueda', columna: 2, etiqueta: 'Quinta Rueda' },
  { id: 'eje_trasero', columna: 2, etiqueta: 'Eje Trasero' },
  { id: 'eje_delantero', columna: 2, etiqueta: 'Eje Delantero' },
  { id: 'tanques_combustible', columna: 2, etiqueta: 'Tanques de Combustible' },
  { id: 'alternador', columna: 2, etiqueta: 'Alternador' },
  { id: 'luces', columna: 2, etiqueta: 'Luces' },

  // --- Columna 3 ---
  { id: 'escape', columna: 3, etiqueta: 'Escape' },
  { id: 'presion_aceite', columna: 3, etiqueta: 'Presión de Aceite' },
  { id: 'radiador', columna: 3, etiqueta: 'Radiador' },
  { id: 'cristales', columna: 3, etiqueta: 'Cristales' },
  { id: 'reflejantes', columna: 3, etiqueta: 'Reflejantes' },
  { id: 'extintor', columna: 3, etiqueta: 'Extintor' },
  { id: 'claxon', columna: 3, etiqueta: 'Claxon' },
  { id: 'espejos', columna: 3, etiqueta: 'Espejos' },

  // --- Columna 4 ---
  { id: 'llantas', columna: 4, etiqueta: 'Llantas' },
  { id: 'transmision', columna: 4, etiqueta: 'Transmisión' },
  { id: 'rines', columna: 4, etiqueta: 'Rines' },
  { id: 'limpiaparabrisas', columna: 4, etiqueta: 'Limpiaparabrisas' },
  { id: 'muelles', columna: 4, etiqueta: 'Muelles' },
  { id: 'retenes', columna: 4, etiqueta: 'Retenes' },
  { id: 'direccion', columna: 4, etiqueta: 'Dirección' },
  { id: 'otros', columna: 4, etiqueta: 'Otros' },
]

export const DISPOSICIONES_SALIDA_NO_CONFORME = [
  'Uso de la unidad como está',
  'Reparación de unidad',
  'Préstamo de unidad alterna',
  'Suspensión de servicio',
  'Notificación al cliente',
] as const

export type DisposicionSalida = typeof DISPOSICIONES_SALIDA_NO_CONFORME[number]

export interface FilaReparacionRefaccion {
  id: string
  reparacion_realizada: string
  refacciones: string
  origen: 'Almacén' | 'Compras / Proveedor' | 'Yonke'
  cantidad?: number
  pieza_id?: number
  costo_unitario?: number
}

// Esquema Zod de validación del Reporte del Mecánico (Nº 0801)
export const reporteMecanicoSchema = z.object({
  numero_reporte_fisico: z.string().min(1, 'El número de reporte físico es requerido'),
  fecha_entrega: z.string().min(8, 'La fecha de entrega es requerida'),
  fuera_de_servicio: z.object({
    uso_grua: z.boolean(),
    reparo_mecanico: z.boolean(),
  }),
  warning: z.boolean(),
  multa: z.boolean(),
  numero_unidad: z.string().min(1, 'El número de unidad es requerido'),
  tipo_inspeccion: z.enum(['PreTrip', 'PostTrip']),
  nombre_operador: z.string().min(2, 'El nombre del operador es requerido'),
  cliente: z.string().min(2, 'El cliente es requerido'),
  nombre_mecanico: z.string().min(2, 'El nombre del mecánico es requerido'),
  articulos_defectuosos: z.array(z.string()),
  detalles_sintoma_falla: z.string().min(5, 'Describa el síntoma de falla'),
  disposicion_salida: z.enum(DISPOSICIONES_SALIDA_NO_CONFORME),
  firma_encargado_taller: z.string().min(2, 'Se requiere la firma del encargado de taller'),
  fecha_inicio_reparacion: z.string().min(8, 'Fecha de inicio requerida'),
  fecha_termino_reparacion: z.string().min(8, 'Fecha de término requerida'),
  filas_reparaciones: z.array(z.object({
    id: z.string(),
    reparacion_realizada: z.string().min(1, 'Especifique la reparación'),
    refacciones: z.string(),
    origen: z.enum(['Almacén', 'Compras / Proveedor', 'Yonke']),
    cantidad: z.number().optional(),
    pieza_id: z.number().optional(),
    costo_unitario: z.number().optional(),
  })),
  declaraciones_liberacion: z.object({
    condicion_satisfactoria: z.boolean(),
    defectos_corregidos: z.boolean(),
    defectos_pendientes_seguros: z.boolean(),
  }),
  firmas: z.object({
    mecanico: z.string().min(2, 'Firma del mecánico requerida'),
    operador: z.string().min(2, 'Firma del operador requerida'),
    jefe_taller: z.string().min(2, 'Firma del jefe de taller requerida'),
  }),
})

export type ReporteMecanicoTallerForm = z.infer<typeof reporteMecanicoSchema>

/**
 * Mapea fallas detectadas en la inspección de patio a los artículos defectuosos
 * del reporte del mecánico para pre-marcar automáticamente las casillas correspondientes.
 */
export function mapearFallasPatioAArticulosTaller(itemsConFalla: Array<{ id: string; componente?: string; sistema?: string }>): string[] {
  const defectuosos = new Set<string>()

  const reglasMapeo: Record<string, string[]> = {
    // Frenos y aire
    lineas_de_aire: ['linea_de_aire'],
    frenos_ajuste_balatas: ['frenos_servicio', 'accesorios_frenos'],
    bolsas_de_aire: ['linea_de_aire', 'accesorios_frenos'],
    rotachamber_fuga: ['accesorios_frenos', 'linea_de_aire'],
    chirrion: ['frenos_servicio', 'accesorios_frenos'],
    mangueras_servicio: ['linea_de_aire'],

    // Motor y fluidos
    motor_fuga_aceite: ['motor', 'presion_aceite'],
    aceite_nivel: ['presion_aceite', 'motor'],
    anticongelante: ['radiador', 'motor'],
    bandas_mangueras: ['motor', 'radiador'],
    sistema_combustible_derrame: ['tanques_combustible', 'linea_combustible'],
    sistema_escape_motor: ['escape'],

    // Chasis, tren motriz y acoplamiento
    quinta_rueda_engrasada: ['quinta_rueda'],
    dispositivos_acoplamiento: ['quinta_rueda'],
    clutch_ajuste: ['transmision'],
    transmisiones: ['transmision'],
    chasis_estado: ['carroceria'],
    suspension: ['muelles'],
    ejes_fuga_aceite: ['eje_trasero', 'eje_delantero', 'retenes'],
    masa_fuga_aceite: ['retenes', 'eje_delantero'],

    // Luces y eléctrico
    baterias_estado: ['baterias'],
    alternador: ['alternador'],
    luces_altas_bajas: ['luces'],
    fantasmas_luces: ['luces', 'reflejantes'],
    fusibles_stop: ['luces'],
    claxon: ['claxon'],

    // Cabina y carrocería
    espejos: ['espejos'],
    vidrio_delantero: ['cristales'],
    limpiaparabrisas_fluido: ['limpiaparabrisas'],
    zoqueteras_polveras: ['carroceria'],

    // Llantas y seguridad
    llantas_rines: ['llantas', 'rines'],
    tuercas_ajustadas: ['rines', 'llantas'],
    extintor_incendios: ['extintor'],
    calca_inspeccion_engomado: ['otros'],
    documentos_permisos: ['otros'],
    placas_delantera_trasera: ['carroceria'],
    otro_defecto: ['otros'],
  }

  itemsConFalla.forEach(item => {
    const mapeados = reglasMapeo[item.id]
    if (mapeados && mapeados.length > 0) {
      mapeados.forEach(artId => defectuosos.add(artId))
    } else {
      // Búsqueda heurística por texto del componente
      const texto = `${item.id} ${item.componente || ''} ${item.sistema || ''}`.toLowerCase()
      if (texto.includes('freno')) defectuosos.add('frenos_servicio')
      if (texto.includes('aire')) defectuosos.add('linea_de_aire')
      if (texto.includes('aceite')) defectuosos.add('presion_aceite')
      if (texto.includes('motor')) defectuosos.add('motor')
      if (texto.includes('llanta')) defectuosos.add('llantas')
      if (texto.includes('rin')) defectuosos.add('rines')
      if (texto.includes('luz') || texto.includes('luces') || texto.includes('faro') || texto.includes('stop')) defectuosos.add('luces')
      if (texto.includes('escape')) defectuosos.add('escape')
      if (texto.includes('bateria')) defectuosos.add('baterias')
      if (texto.includes('radiador') || texto.includes('enfri')) defectuosos.add('radiador')
      if (texto.includes('cristal') || texto.includes('parabrisas')) defectuosos.add('cristales')
      if (texto.includes('muelle') || texto.includes('suspensi')) defectuosos.add('muelles')
      if (texto.includes('quinta')) defectuosos.add('quinta_rueda')
    }
  })

  return Array.from(defectuosos)
}
