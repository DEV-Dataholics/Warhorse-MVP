// Tipos del dominio compartidos por las vistas del sistema Warhorse
// Basados en las especificaciones operativas, arquitectura de wizards y perfiles.

export type Rol = 'admin' | 'taller' | 'compras' | 'diesel' | 'operador'

// 5 Estados de Salud de la Flota (doc de Gestión de Estados)
export type EstadoUnidad = 
  | 'Activo al 100%'
  | 'Activo con Warning'
  | 'Inactivo en Reparación'
  | 'Inactivo - Yonke'
  | 'Inactivo'
  // Compatibilidad con valores legados en base de datos
  | 'Activo'
  | 'Yonke'
  | 'Vendido'

export type TipoUnidad = 'Tractor' | 'Caja' | 'Thermo' | 'Servicio'

export type Origen = 'Compra' | 'Yonke' | 'Inventario' | 'Nuevo'

export type Urgencia = 'Bajo' | 'Medio' | 'Crítico' | 'Inmediato' | 'Rápida' | 'Media' | 'Crítica'

export type EstadoRequisicion = 
  | 'Solicitado' 
  | 'En aprobación' 
  | 'En pago' 
  | 'En recolección' 
  | 'Más información' 
  | 'Cancelado' 
  | 'Rechazado' 
  | 'Instalado' 
  | 'Cotizado' 
  | 'Comprado' 
  | 'En trayecto' 
  | 'Bajo pedido'

// Estados de las Órdenes de Trabajo de Taller
export type EstadoOrdenTrabajo = 
  | 'Activa'
  | 'En Proceso'
  | 'Liberada'
  | 'Liberada Parcial'

export type TipoOrdenTrabajo = 'Correctiva' | 'Preventiva'

// Documentos y formatos adjuntos por etapa
export interface InspeccionDocumento {
  id?: number
  folio: string
  unidad_id: string
  operador_id: string
  operador_nombre: string
  tipo_operacion: 'Cruce' | 'Foráneo' | 'Local' | 'Backup'
  fecha: string
  kilometraje?: number
  nivel_combustible?: number
  tiene_fallas: boolean
  detalles_fallas?: Array<{
    sistema: string
    componente: string
    estado: 'Bueno' | 'Regular' | 'Crítico'
    observacion?: string
    fotografia_url?: string
  }>
  requiere_ot_correctiva: boolean
  firmado_digital: boolean
}

export interface OrdenTrabajoDocumento {
  id?: number
  folio: string
  tipo: TipoOrdenTrabajo
  estado: EstadoOrdenTrabajo
  unidad_id: string
  fecha_ingreso: string
  fecha_salida?: string | null
  diagnostico: string
  criticidad: Urgencia
  mecanico_responsable: string
  tipo_reparacion?: 'Tracto' | 'Caja' | 'Thermo'
  tipo_liberacion?: 'Total' | 'Parcial' | null
  pendientes?: string[]
  costo_mano_obra: number
  costo_refacciones: number
  costo_total: number
  evidencias?: Array<{
    categoria: string
    url: string
    nombre: string
  }>
}

export interface RequisicionDocumento {
  id?: number
  folio: string
  orden_trabajo_id?: number | null
  unidad_destino_id: string
  origen: 'Stock' | 'Yonke' | 'Compra Externa'
  unidad_donante_id?: string | null
  descripcion_pieza: string
  cantidad: number
  numero_parte?: string | null
  urgencia: Urgencia
  costo_estimado?: number | null
  costo_real?: number | null
  proveedor?: string | null
  numero_factura?: string | null
  archivo_factura_url?: string | null
  archivo_cotizacion_url?: string | null
  es_caja_chica: boolean
}
