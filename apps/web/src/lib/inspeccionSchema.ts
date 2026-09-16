import { z } from 'zod'

// Sub-esquema para el componente individual evaluado
export const itemInspeccionSchema = z
  .object({
    id: z.string(),
    sistema: z.string(),
    componente: z.string(),
    estado: z.enum(['Bueno', 'Regular', 'Crítico']),
    observacion: z.string().optional(),
    foto_url: z.string().optional(),
    detalle_extra: z.string().optional(),
  })
  .refine(
    item => {
      // Si el estado no es 'Bueno', el detalle de la falla es obligatorio
      if (item.estado !== 'Bueno') {
        return !!item.observacion && item.observacion.trim().length >= 3
      }
      return true
    },
    {
      message: 'Debe especificar el detalle de la falla u observación para este componente.',
      path: ['observacion'],
    }
  )

export type ItemInspeccion = z.infer<typeof itemInspeccionSchema>

// Sub-esquema para el Diagrama de Llantas y Ejes (Tractocamión 10 ruedas / 3 ejes)
export const llantaDiagramaSchema = z.object({
  id: z.string(),
  posicion: z.string(),
  nombre: z.string(),
  eje: z.number(), // 1, 2, 3
  lado: z.enum(['izq', 'der']),
  tipo: z.enum(['sencilla', 'dual_externa', 'dual_interna']),
  estado: z.enum(['OK', 'Desgaste', 'Baja Presión', 'Dañada', 'Cambio']),
  profundidad: z.string().optional(),
  observacion: z.string().optional(),
})

export type LlantaDiagrama = z.infer<typeof llantaDiagramaSchema>

// Matriz estándar de las 10 llantas del tractocamión (correspondiente al diagrama físico)
export const LLANTAS_DEFAULT: LlantaDiagrama[] = [
  // Eje 1: Direccional delantero
  { id: 'llanta_1', posicion: 'D-IZQ', nombre: 'Direccional Delantera Izquierda (P1)', eje: 1, lado: 'izq', tipo: 'sencilla', estado: 'OK', profundidad: '14/32"' },
  { id: 'llanta_2', posicion: 'D-DER', nombre: 'Direccional Delantera Derecha (P2)', eje: 1, lado: 'der', tipo: 'sencilla', estado: 'OK', profundidad: '14/32"' },
  // Eje 2: Tracción Intermedio (Dual)
  { id: 'llanta_3', posicion: 'T1-EXT-IZQ', nombre: 'Tracción 1 Externa Izquierda (P3)', eje: 2, lado: 'izq', tipo: 'dual_externa', estado: 'OK', profundidad: '12/32"' },
  { id: 'llanta_4', posicion: 'T1-INT-IZQ', nombre: 'Tracción 1 Interna Izquierda (P4)', eje: 2, lado: 'izq', tipo: 'dual_interna', estado: 'OK', profundidad: '12/32"' },
  { id: 'llanta_5', posicion: 'T1-INT-DER', nombre: 'Tracción 1 Interna Derecha (P5)', eje: 2, lado: 'der', tipo: 'dual_interna', estado: 'OK', profundidad: '12/32"' },
  { id: 'llanta_6', posicion: 'T1-EXT-DER', nombre: 'Tracción 1 Externa Derecha (P6)', eje: 2, lado: 'der', tipo: 'dual_externa', estado: 'OK', profundidad: '12/32"' },
  // Eje 3: Tracción Trasero (Dual)
  { id: 'llanta_7', posicion: 'T2-EXT-IZQ', nombre: 'Tracción 2 Externa Izquierda (P7)', eje: 3, lado: 'izq', tipo: 'dual_externa', estado: 'OK', profundidad: '12/32"' },
  { id: 'llanta_8', posicion: 'T2-INT-IZQ', nombre: 'Tracción 2 Interna Izquierda (P8)', eje: 3, lado: 'izq', tipo: 'dual_interna', estado: 'OK', profundidad: '12/32"' },
  { id: 'llanta_9', posicion: 'T2-INT-DER', nombre: 'Tracción 2 Interna Derecha (P9)', eje: 3, lado: 'der', tipo: 'dual_interna', estado: 'OK', profundidad: '12/32"' },
  { id: 'llanta_10', posicion: 'T2-EXT-DER', nombre: 'Tracción 2 Externa Derecha (P10)', eje: 3, lado: 'der', tipo: 'dual_externa', estado: 'OK', profundidad: '12/32"' },
]

// Lista oficial de 36 parámetros extraídos exactamente del formato físico "REPORTE DE INSPECCION DE VIAJE" (Warhorse Brokerage)
export const SISTEMAS_INSPECCION_DEFAULT = [
  // --- Columna 1 del formato físico ---
  { id: 'masa_fuga_aceite', sistema: 'Motor y Fluidos', componente: 'Masa (Fuga de aceite)' },
  { id: 'lineas_de_aire', sistema: 'Aire y Frenos', componente: 'Líneas de Aire' },
  { id: 'ejes_fuga_aceite', sistema: 'Motor y Fluidos', componente: 'Ejes (Fuga de aceite)' },
  { id: 'baterias_estado', sistema: 'Tren Motriz y Chasis', componente: 'Batería(s) (Manchadas/infladas)' },
  { id: 'bandas_mangueras', sistema: 'Motor y Fluidos', componente: 'Bandas/Mangueras' },
  { id: 'chasis_estado', sistema: 'Tren Motriz y Chasis', componente: 'Chasis (quebrado/dañado)' },
  { id: 'frenos_ajuste_balatas', sistema: 'Aire y Frenos', componente: 'Frenos (Ajuste de balatas)' },
  { id: 'bolsas_de_aire', sistema: 'Aire y Frenos', componente: 'Bolsas de aire' },
  { id: 'rotachamber_fuga', sistema: 'Aire y Frenos', componente: 'Rotachamber (fuga/manguera)' },
  { id: 'clutch_ajuste', sistema: 'Tren Motriz y Chasis', componente: 'Clutch/Ajuste' },
  { id: 'aceite_nivel', sistema: 'Motor y Fluidos', componente: 'Aceite/nivel' },
  { id: 'dispositivos_acoplamiento', sistema: 'Tren Motriz y Chasis', componente: 'Dispositivos de Acoplamiento' },
  { id: 'fantasmas_luces', sistema: 'Luces y Eléctrico', componente: 'Fantasmas' },

  // --- Columna 2 del formato físico ---
  { id: 'documentos_permisos', sistema: 'Seguridad y Documentos', componente: 'Documentos (Aseguranza, Permisos, etc.)' },
  { id: 'chirrion', sistema: 'Aire y Frenos', componente: 'Chirrión' },
  { id: 'mangueras_servicio', sistema: 'Motor y Fluidos', componente: 'Mangueras de servicio' },
  { id: 'motor_fuga_aceite', sistema: 'Motor y Fluidos', componente: 'Motor (fuga de aceite)' },
  { id: 'quinta_rueda_engrasada', sistema: 'Tren Motriz y Chasis', componente: 'Quinta rueda (engrasada)' },
  { id: 'sistema_escape_motor', sistema: 'Motor y Fluidos', componente: 'Sistema de Escape de Motor' },
  { id: 'extintor_incendios', sistema: 'Seguridad y Documentos', componente: 'Extintor de Incendios' },
  { id: 'sistema_combustible_derrame', sistema: 'Motor y Fluidos', componente: 'Sistema de Combustible (Derrame diésel)' },
  { id: 'placas_delantera_trasera', sistema: 'Cabina y Carrocería', componente: 'Placas Delantera/Trasera' },
  { id: 'claxon', sistema: 'Luces y Eléctrico', componente: 'Claxon' },
  { id: 'fusibles_stop', sistema: 'Luces y Eléctrico', componente: 'Fusibles/Stop' },
  { id: 'calca_inspeccion_engomado', sistema: 'Seguridad y Documentos', componente: 'Calca de inspección/Engomado' },
  { id: 'anticongelante', sistema: 'Motor y Fluidos', componente: 'Anticongelante' },

  // --- Columna 3 del formato físico ---
  { id: 'luces_altas_bajas', sistema: 'Luces y Eléctrico', componente: 'Luces/Altas/Bajas' },
  { id: 'espejos', sistema: 'Cabina y Carrocería', componente: 'Espejos' },
  { id: 'zoqueteras_polveras', sistema: 'Cabina y Carrocería', componente: 'Zoqueteras/Polveras' },
  { id: 'vidrio_delantero', sistema: 'Cabina y Carrocería', componente: 'Vidrio delantero (sin defectos)' },
  { id: 'suspension', sistema: 'Tren Motriz y Chasis', componente: 'Suspensión' },
  { id: 'llantas_rines', sistema: 'Seguridad y Documentos', componente: 'Llantas/Rines' },
  { id: 'tuercas_ajustadas', sistema: 'Seguridad y Documentos', componente: 'Tuercas (ajustadas/no flojas)' },
  { id: 'transmisiones', sistema: 'Tren Motriz y Chasis', componente: 'Transmisión(s)' },
  { id: 'limpiaparabrisas_fluido', sistema: 'Cabina y Carrocería', componente: 'Limpiaparabrisas/Fluido' },
  { id: 'otro_defecto', sistema: 'Seguridad y Documentos', componente: 'Otro' },
]

// 8 posiciones de llantas en 2 ejes tandem para Cajas/Trailas
export const LLANTAS_CAJA_DEFAULT: LlantaDiagrama[] = [
  // Eje 1 (Tandem Delantero de Caja)
  { id: 'caja_e1_ext_izq', posicion: 'T1-EXT-IZQ', nombre: 'Tandem 1 Ext. Izquierda', eje: 1, lado: 'izq', tipo: 'dual_externa', estado: 'OK', profundidad: '14/32"' },
  { id: 'caja_e1_int_izq', posicion: 'T1-INT-IZQ', nombre: 'Tandem 1 Int. Izquierda', eje: 1, lado: 'izq', tipo: 'dual_interna', estado: 'OK', profundidad: '14/32"' },
  { id: 'caja_e1_int_der', posicion: 'T1-INT-DER', nombre: 'Tandem 1 Int. Derecha', eje: 1, lado: 'der', tipo: 'dual_interna', estado: 'OK', profundidad: '14/32"' },
  { id: 'caja_e1_ext_der', posicion: 'T1-EXT-DER', nombre: 'Tandem 1 Ext. Derecha', eje: 1, lado: 'der', tipo: 'dual_externa', estado: 'OK', profundidad: '14/32"' },

  // Eje 2 (Tandem Trasero de Caja)
  { id: 'caja_e2_ext_izq', posicion: 'T2-EXT-IZQ', nombre: 'Tandem 2 Ext. Izquierda', eje: 2, lado: 'izq', tipo: 'dual_externa', estado: 'OK', profundidad: '14/32"' },
  { id: 'caja_e2_int_izq', posicion: 'T2-INT-IZQ', nombre: 'Tandem 2 Int. Izquierda', eje: 2, lado: 'izq', tipo: 'dual_interna', estado: 'OK', profundidad: '14/32"' },
  { id: 'caja_e2_int_der', posicion: 'T2-INT-DER', nombre: 'Tandem 2 Int. Derecha', eje: 2, lado: 'der', tipo: 'dual_interna', estado: 'OK', profundidad: '14/32"' },
  { id: 'caja_e2_ext_der', posicion: 'T2-EXT-DER', nombre: 'Tandem 2 Ext. Derecha', eje: 2, lado: 'der', tipo: 'dual_externa', estado: 'OK', profundidad: '14/32"' },
]

// 18 Puntos Físicos Oficiales para CAJAS / TRAILAS (Warhorse Brokerage)
export const SISTEMAS_INSPECCION_CAJA_DEFAULT = [
  // --- Acoplamiento y Estructura (9 puntos) ---
  { id: 'caja_dispositivos_acoplamiento', sistema: 'Acoplamiento y Estructura', componente: 'Dispositivos de Acoplamiento' },
  { id: 'caja_king_pin', sistema: 'Acoplamiento y Estructura', componente: 'King Pin (Perno Rey)' },
  { id: 'caja_patines_patas', sistema: 'Acoplamiento y Estructura', componente: 'Patines/Patas' },
  { id: 'caja_chasis_danado', sistema: 'Acoplamiento y Estructura', componente: 'Chasis (Dañado)' },
  { id: 'caja_techo', sistema: 'Acoplamiento y Estructura', componente: 'Techo' },
  { id: 'caja_piso', sistema: 'Acoplamiento y Estructura', componente: 'Piso de caja' },
  { id: 'caja_puertas_filtraciones', sistema: 'Acoplamiento y Estructura', componente: 'Puertas (Bisagras, Filtraciones)' },
  { id: 'caja_placas', sistema: 'Acoplamiento y Estructura', componente: 'Placas' },
  { id: 'caja_documentos', sistema: 'Acoplamiento y Estructura', componente: 'Documentos de la caja' },

  // --- Aire, Frenos y Suspensión (6 puntos) ---
  { id: 'caja_lineas_aire', sistema: 'Aire, Frenos y Suspensión', componente: 'Líneas de Aire' },
  { id: 'caja_manitas_servicio', sistema: 'Aire, Frenos y Suspensión', componente: 'Manitas(Conexiones manguera de servicio)' },
  { id: 'caja_frenos_ajuste', sistema: 'Aire, Frenos y Suspensión', componente: 'Frenos/Ajuste' },
  { id: 'caja_rotochamber', sistema: 'Aire, Frenos y Suspensión', componente: 'Rotochamber' },
  { id: 'caja_ejes_fuga_aceite', sistema: 'Aire, Frenos y Suspensión', componente: 'Ejes (fuga de aceite)' },
  { id: 'caja_suspension_bolsas', sistema: 'Aire, Frenos y Suspensión', componente: 'Suspensión (bolsas de aire)' },

  // --- Carrocería y Seguridad (3 puntos) ---
  { id: 'caja_luces_plafones', sistema: 'Carrocería y Seguridad', componente: 'Luces(Marías, plafones, laterales/Reflectores)' },
  { id: 'caja_zoqueteras_polveras', sistema: 'Carrocería y Seguridad', componente: 'Zoqueteras/Polveras' },
  { id: 'caja_otro', sistema: 'Carrocería y Seguridad', componente: 'Otro' },
]

// Esquema maestro de la Orden de Inspección de Viaje (PreTrip / PostTrip / Tracto / Caja)
export const ordenInspeccionSchema = z.object({
  folio: z.string().min(3),
  numero_reporte_fisico: z.string().optional(),
  tipo_vehiculo: z.enum(['tracto', 'caja']),
  fecha: z.string().min(8),
  hora: z.string().min(2),
  tipo_inspeccion: z.enum(['PreTrip', 'PostTrip']),
  operador_id: z.string().min(2, 'El número de empleado es requerido'),
  operador_nombre: z.string().min(3, 'El nombre del operador es requerido'),
  licencia: z.string().min(3, 'El número de licencia es requerido'),
  unidad_id: z.string().min(2, 'Debe seleccionar una unidad o traila'),
  numero_caja: z.string().optional(),
  placas: z.string().min(2),
  tipo_operacion: z.enum(['Cruce', 'Foráneo', 'Local', 'Backup']),
  odometro_millas: z.number().min(0, 'El odómetro no puede ser negativo').optional(),
  kilometraje: z.number().min(0, 'El kilometraje no puede ser negativo'),
  nivel_combustible: z.enum(['Reserva', '1/4', '1/2', '3/4', 'Lleno']).optional(),
  declaracion_defecto: z.enum(['con_defectos', 'sin_defectos']),
  items: z.array(itemInspeccionSchema),
  // Diagrama de Llantas y Ejes (Tracto 10 ruedas o Caja 8 ruedas)
  llantas_diagrama: z.array(llantaDiagramaSchema),
  medida_profundidad_llantas: z.string(),
  medida_llantas: z.string(),
  // Observaciones y Carrier/Agent's Report
  observaciones_generales: z.string(),
  carrier_defectos_corregidos: z.boolean(),
  carrier_sin_riesgo: z.boolean(),
  firma_digital: z.string().min(2, 'Debe confirmar su firma digital o nombre para validar'),
  requiere_ot: z.boolean(),
  sincronizado: z.boolean(),
  ot_generada: z.string().optional(),
  fecha_atencion_ot: z.string().optional(),
})

export type OrdenInspeccionForm = z.infer<typeof ordenInspeccionSchema>
