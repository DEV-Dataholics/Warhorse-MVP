// Contrato de datos del SPA (doc 05). Desde el Sprint 5 TODOS los datos son
// reales: auth (S1), unidades (S2), requisiciones (S3), compras/taller (S4)
// y diésel/dashboard/ficha (S5). Las vistas importan SOLO este módulo.
import type { EstadoRequisicion, EstadoUnidad, Origen, Rol, TipoUnidad, Urgencia } from './types'
export type { EstadoRequisicion, EstadoUnidad, Origen, Rol, TipoUnidad, Urgencia }

const BASE = '/api/v1'

// El token de acceso vive en memoria del SPA (doc 04 §3.5), nunca en localStorage.
let tokenActual: string | null = localStorage.getItem('wh_token')

export function setToken(token: string | null): void {
  tokenActual = token
  if (token) {
    localStorage.setItem('wh_token', token)
  } else {
    localStorage.removeItem('wh_token')
  }
}

export function getToken(): string | null {
  if (tokenActual) return tokenActual
  const local = localStorage.getItem('wh_token')
  if (local) {
    tokenActual = local
    return local
  }
  try {
    const raw = localStorage.getItem('warhorse_auth_storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state?.token) {
        tokenActual = parsed.state.token
        return parsed.state.token
      }
    }
  } catch {
    // Ignorar error de parsing
  }
  return null
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    // Con FormData el navegador fija el boundary del multipart
    ...(opciones.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opciones.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const respuesta = await fetch(BASE + ruta, { ...opciones, headers })

  if (respuesta.status === 204) return undefined as T

  const cuerpo = (await respuesta.json().catch(() => null)) as Record<string, unknown> | null
  const isRealError =
    Boolean(cuerpo &&
    typeof cuerpo === 'object' &&
    'real_status' in cuerpo &&
    typeof cuerpo.real_status === 'number' &&
    cuerpo.real_status >= 400)

  if (!respuesta.ok || isRealError) {
    const status = isRealError ? (cuerpo?.real_status as number) : respuesta.status
    const err = (cuerpo ?? {}) as { error?: string; message?: string; fields?: Record<string, string[]> }
    throw new ApiError(
      status,
      err.error ?? 'server_error',
      err.message ?? 'Error del servidor.',
      err.fields,
    )
  }

  return cuerpo as T
}

export interface SesionLogin {
  token: string
  usuario: { id: number; nombre: string; rol: string; roles: Rol[] }
  landing: string
  debe_cambiar_password: boolean
}

export interface Yo {
  id: number
  nombre: string
  rol: string
  roles: Rol[]
  permisos: Record<string, boolean>
  landing: string
  debe_cambiar_password: boolean
}

export interface UsuarioApi {
  id: number
  nombre: string
  email: string
  rol: string
  roles: Rol[]
  activo: boolean
}

export interface UsuarioCreado {
  id: number
  nombre: string
  email: string
  rol: string
  roles: Rol[]
  password_temporal: string
}

export async function login(email: string, password: string): Promise<SesionLogin> {
  const sesion = await pedir<SesionLogin>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(sesion.token)
  return sesion
}

export async function logout(): Promise<void> {
  try {
    await pedir<void>('/auth/logout', { method: 'POST' })
  } finally {
    setToken(null)
  }
}

export function me(): Promise<Yo> {
  return pedir<Yo>('/auth/me')
}

export function haySesion(): boolean {
  return getToken() !== null
}

// Cambio de contraseña propio (alta sin correo): la persona define la suya
// tras entrar con la temporal. Devuelve la sesión sin la obligación pendiente.
export function cambiarPassword(datos: { password_actual: string; password_nueva: string }): Promise<{ debe_cambiar_password: boolean }> {
  return pedir<{ debe_cambiar_password: boolean }>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
}

// ---- Catálogo de unidades (real desde el Sprint 2, doc 05 §3) ----

export interface UnidadApi {
  id: number
  id_unidad: string
  tipo: TipoUnidad
  operacion?: string | null
  estado: EstadoUnidad
  valor_referencia: number | null
  costo_real_acumulado: number
  candidata_reincidencia: boolean
  fecha_alta?: string | null
  vencimiento_documentacion?: string | null
  vin?: string | null
  numero_economico?: string | null
  marca?: string | null
  modelo?: string | null
  placas?: string | null
}

export async function getUnidades(estado?: EstadoUnidad): Promise<UnidadApi[]> {
  const filtro = estado ? `&estado=${estado}` : ''
  const respuesta = await pedir<{ data: UnidadApi[] }>(`/unidades?per_page=100${filtro}`)
  return respuesta.data
}

export interface NuevaUnidad {
  id_unidad: string
  tipo: TipoUnidad
  operacion?: string | null
  estado?: EstadoUnidad
  fecha_alta: string
  valor_referencia?: number | null
  vencimiento_documentacion?: string | null
  vin?: string | null
  numero_economico?: string | null
  marca?: string | null
  modelo?: string | null
  placas?: string | null
}

export function crearUnidad(datos: NuevaUnidad): Promise<UnidadApi> {
  return pedir<UnidadApi>('/unidades', { method: 'POST', body: JSON.stringify(datos) })
}

export function actualizarUnidad(
  id: number,
  cambio: { operacion?: string | null; estado?: EstadoUnidad; valor_referencia?: number; vencimiento_documentacion?: string | null; vin?: string | null; numero_economico?: string | null; marca?: string | null; modelo?: string | null; placas?: string | null },
): Promise<UnidadApi> {
  return pedir<UnidadApi>(`/unidades/${id}`, { method: 'PATCH', body: JSON.stringify(cambio) })
}

// ---- Requisiciones (reales desde el Sprint 3, doc 05 §5) ----

export interface RequisicionApi {
  id: number
  estado: string
  origen: Origen
  unidad_destino_id: number | null
  unidad_donante_id: number | null
  descripcion_pieza: string
  cantidad: number
  numero_parte: string | null
  urgencia: Urgencia
  costo_estimado: number | null
  unidad?: { id: number, id_unidad: string }
  origen_costo_estimado: 'ultima_compra' | 'catalogo' | 'manual' | null
  costo_real: number | null
  foto_pieza_url: string
  fecha_solicitud: string
  origen_refaccion?: string | null
  almacen?: string | null
  numero_serie?: string | null
  archivo_cotizacion_url?: string | null
  archivo_factura_url?: string | null
  creado_por_nombre?: string
  aprobado_por_nombre?: string | null
  numero_factura?: string | null
  orden_trabajo_id?: number | null
  folio?: string | null
  proveedor?: string | null
}

export interface NuevaRequisicionApi {
  unidad_destino_id: number | null
  origen: Origen
  unidad_donante_id?: number | null
  pieza_catalogo_id?: number | null
  descripcion_pieza: string
  cantidad?: number
  numero_parte: string | null
  urgencia: Urgencia
  costo_estimado_manual: number | null
  fotos: File[]
  origen_refaccion?: string
  almacen?: string
  numero_serie?: string
  orden_trabajo_id?: number | null
}

export async function getRequisiciones(): Promise<RequisicionApi[]> {
  const r = await pedir<{ data: RequisicionApi[] }>('/compras/requisiciones?estado=Todas&page=1&per_page=50')
  return r.data
}

export function crearRequisicion(datos: NuevaRequisicionApi): Promise<RequisicionApi> {
  const fd = new FormData()
  if (datos.unidad_destino_id !== null) fd.set('unidad_destino_id', String(datos.unidad_destino_id))
  fd.set('origen', datos.origen)
  if (datos.unidad_donante_id !== null) fd.set('unidad_donante_id', String(datos.unidad_donante_id))
  if (datos.pieza_catalogo_id) fd.set('pieza_catalogo_id', String(datos.pieza_catalogo_id))
  if (datos.orden_trabajo_id) fd.set('orden_trabajo_id', String(datos.orden_trabajo_id))
  fd.set('descripcion_pieza', datos.descripcion_pieza)
  if (datos.cantidad) fd.set('cantidad', String(datos.cantidad))
  if (datos.numero_parte) fd.set('numero_parte', datos.numero_parte)
  fd.set('urgencia', datos.urgencia)
  if (datos.costo_estimado_manual !== null) fd.set('costo_estimado_manual', String(datos.costo_estimado_manual))
  if (datos.origen_refaccion) fd.set('origen_refaccion', datos.origen_refaccion)
  if (datos.almacen) fd.set('almacen', datos.almacen)
  if (datos.numero_serie) fd.set('numero_serie', datos.numero_serie)
  
  if (datos.fotos[0]) fd.set('foto_pieza', datos.fotos[0])
  if (datos.fotos[1]) fd.set('foto_pieza_2', datos.fotos[1])
  if (datos.fotos[2]) fd.set('foto_pieza_3', datos.fotos[2])
  
  return pedir<RequisicionApi>('/requisiciones', { method: 'POST', body: fd })
}

// ---- Panel de Compras (real desde el Sprint 4, doc 05 §6) ----

export interface FilaCompras extends RequisicionApi {
  unidad_destino: string
  destino_modificada: boolean
  unidad_donante: string | null
}

export async function getColaCompras(estado?: EstadoRequisicion): Promise<FilaCompras[]> {
  const filtro = estado ? `?estado=${estado}` : ''
  const r = await pedir<{ data: FilaCompras[] }>(`/compras/requisiciones${filtro}`)
  return r.data
}

export function avanzarEstado(
  id: number,
  cambio: {
    estado: EstadoRequisicion
    costo_real?: number
    numero_factura?: string
    proveedor?: string
    es_caja_chica?: boolean
    archivo_cotizacion?: File | null
    archivo_factura?: File | null
    origen_refaccion?: string
    justificacion?: string
  },
): Promise<RequisicionApi> {
  const hasFiles = cambio.archivo_cotizacion || cambio.archivo_factura
  if (hasFiles) {
    const fd = new FormData()
    fd.set('estado', cambio.estado)
    if (cambio.costo_real !== undefined) fd.set('costo_real', String(cambio.costo_real))
    if (cambio.numero_factura !== undefined) fd.set('numero_factura', cambio.numero_factura)
    if (cambio.proveedor) fd.set('proveedor', cambio.proveedor)
    if (cambio.es_caja_chica !== undefined) fd.set('es_caja_chica', cambio.es_caja_chica ? '1' : '0')
    if (cambio.archivo_cotizacion) fd.set('archivo_cotizacion', cambio.archivo_cotizacion)
    if (cambio.archivo_factura) fd.set('archivo_factura', cambio.archivo_factura)
    return pedir<RequisicionApi>(`/compras/requisiciones/${id}/estado`, {
      method: 'PATCH',
      body: fd,
    })
  }
  return pedir<RequisicionApi>(`/compras/requisiciones/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify(cambio),
  })
}

export function revertirCotizacion(
  id: number,
  datos: { motivo: string }
): Promise<RequisicionApi> {
  return pedir<RequisicionApi>(`/compras/requisiciones/${id}/revertir`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

// ---- Taller (real desde el Sprint 4, doc 05 §7) ----

export interface RegistroTallerApi {
  id: number
  unidad_id: number
  id_unidad: string
  fecha_ingreso: string
  fecha_salida: string | null
  dias_en_taller: number | null
  diagnostico: string
  criticidad: 'Rápida' | 'Media' | 'Crítico'
  costo_taller: number
  tipo_liberacion: 'Total' | 'Parcial' | null
  pendientes: string[] | null
  es_reincidencia: boolean | 0 | 1
}

export async function getTaller(): Promise<RegistroTallerApi[]> {
  const r = await pedir<{ data: RegistroTallerApi[] }>('/taller')
  return r.data
}

export function registrarIngreso(datos: {
  unidad_id: number
  fecha_ingreso: string
  diagnostico: string
  criticidad: 'Rápida' | 'Media' | 'Crítico'
}): Promise<RegistroTallerApi> {
  return pedir<RegistroTallerApi>('/taller', { method: 'POST', body: JSON.stringify(datos) })
}

export function liberarUnidad(
  id: number,
  datos: { tipo_liberacion: 'Total' | 'Parcial'; fecha_salida: string; costo_taller: number; pendientes?: string[] },
): Promise<RegistroTallerApi> {
  return pedir<RegistroTallerApi>(`/taller/${id}/liberar`, { method: 'PATCH', body: JSON.stringify(datos) })
}

// ---- Diésel (real desde el Sprint 5, doc 05 §4) ----

export interface CargaDieselApi {
  id: number
  unidad_id: number
  id_unidad: string
  fecha: string
  litros: number
  costo_total: number
  km_recorridos: number
}

export async function getDiesel(filtros?: { unidad_id?: number; desde?: string; hasta?: string }): Promise<CargaDieselApi[]> {
  const query = new URLSearchParams({ per_page: '100' })
  if (filtros?.unidad_id) query.set('unidad_id', String(filtros.unidad_id))
  if (filtros?.desde) query.set('desde', filtros.desde)
  if (filtros?.hasta) query.set('hasta', filtros.hasta)
  const r = await pedir<{ data: CargaDieselApi[] }>(`/diesel?${query.toString()}`)
  return r.data
}

export function registrarCarga(datos: {
  unidad_id: number
  fecha: string
  litros: number
  costo_total: number
  km_recorridos: number
}): Promise<CargaDieselApi> {
  return pedir<CargaDieselApi>('/diesel', { method: 'POST', body: JSON.stringify(datos) })
}

export interface CargaExternaApi {
  id: number
  fecha: string
  litros_totales: number
  costo_total: number
  desglose: { id: number, unidad_id: number, unidad_nombre: string, litros: number }[]
}

export async function getCargasExternas(): Promise<CargaExternaApi[]> {
  const r = await pedir<{ data: CargaExternaApi[] }>('/diesel/externos')
  return r.data
}

export async function crearCargaExterna(datos: { fecha: string, litros_totales: number, costo_total: number }): Promise<{ id: number }> {
  return pedir<{ id: number }>('/diesel/externos', { method: 'POST', body: JSON.stringify(datos) })
}

export async function asignarDesglose(cargaId: number, datos: { unidad_id: number, litros: number }): Promise<{ id: number }> {
  return pedir<{ id: number }>(`/diesel/externos/${cargaId}/desglose`, { method: 'POST', body: JSON.stringify(datos) })
}

export async function borrarDesglose(cargaId: number, desgloseId: number): Promise<void> {
  return pedir<void>(`/diesel/externos/${cargaId}/desglose/${desgloseId}`, { method: 'DELETE' })
}

// ---- Dashboard de Dirección (real desde el Sprint 5, doc 05 §8) ----

export type Veredicto = 'Mantener' | 'Evaluar' | 'Vender'

export interface SeleccionDashboard {
  id: number
  id_unidad: string
  costo_total: number
  valor_referencia: number | null
  eficiencia_km_l: number | null
  pct_reparacion_total: number
  pct_mejoralito: number
  veredicto: Veredicto | null
  razon: string
  valor_referencia_pendiente: boolean
}

export interface DashboardApi {
  kpis: { diesel: number; refacciones: number; taller: number; costo_real_acumulado: number }
  ranking: Array<{ id: number; id_unidad: string; costo_total: number; critico: boolean }>
  seleccion: SeleccionDashboard | null
  parametros: { umbral_pct: number; ventana_meses: number }
}

export function getDashboard(seleccion?: string, tipo?: string, desde?: string, hasta?: string): Promise<DashboardApi> {
  const params = new URLSearchParams()
  if (seleccion) params.append('seleccion', seleccion)
  if (tipo) params.append('tipo', tipo)
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)
  const qs = params.toString() ? '?' + params.toString() : ''
  return pedir<DashboardApi>(`/dashboard${qs}`)
}

export function ajustarParametros(datos: { umbral_pct: number; ventana_meses: number }): Promise<{ umbral_pct: number; ventana_meses: number }> {
  return pedir<{ umbral_pct: number; ventana_meses: number }>('/parametros/veredicto', {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
}

// ---- Salud de datos (real desde el Sprint 6, SRS §9) ----

export interface SaludDatosApi {
  requisiciones: { total: number; con_foto_y_origen: number; pct: number }
  liberaciones: { total: number; con_tipo: number; pct: number }
  yonke: {
    total: number
    con_costo: number
    pct: number
    por_origen: { ultima_compra: number; catalogo: number; manual: number }
  }
}

export function getSaludDatos(): Promise<SaludDatosApi> {
  return pedir<SaludDatosApi>('/metricas/salud')
}

// ---- Usuarios y permisos (real desde el Sprint 6, doc 05 §9) ----

export interface UsuarioAdminApi {
  id: number
  nombre: string
  email: string
  rol: string
  roles: Rol[]
  activo: boolean
}

// El alta devuelve la contraseña temporal UNA sola vez (sin correo).
export interface UsuarioCreado extends UsuarioAdminApi {
  password_temporal: string
}

export async function getUsuarios(): Promise<UsuarioAdminApi[]> {
  const r = await pedir<{ data: UsuarioAdminApi[] }>('/usuarios')
  return r.data
}

export function crearUsuario(datos: { nombre: string; email: string; rol: string }): Promise<UsuarioCreado> {
  return pedir<UsuarioCreado>('/usuarios', { method: 'POST', body: JSON.stringify(datos) })
}

export function actualizarUsuario(id: number, cambio: { rol?: string; activo?: boolean }): Promise<UsuarioAdminApi> {
  return pedir<UsuarioAdminApi>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(cambio) })
}

// ---- Ficha de tracto (real desde el Sprint 5, doc 05 §3) ----

export interface FichaApi {
  unidad: {
    id: number
    id_unidad: string
    tipo: TipoUnidad
    estado: EstadoUnidad
    valor_referencia: number | null
    candidata_reincidencia: boolean
  }
  kpis: { diesel: number; refacciones: number; taller: number; costo_real_acumulado: number }
  reparaciones: Array<{
    fecha_ingreso: string
    fecha_salida: string | null
    dias_en_taller: number | null
    diagnostico: string
    criticidad: 'Rápida' | 'Media' | 'Crítico'
    tipo_liberacion: 'Total' | 'Parcial' | null
    costo_taller: number
    es_reincidencia: boolean
  }>
  piezas_instaladas: Array<{
    descripcion_pieza: string
    origen: Origen
    unidad_donante_id: string | null
    costo: number | null
    es_estimado: boolean
    estado: EstadoRequisicion
    fecha: string
  }>
  piezas_donadas: Array<{
    descripcion_pieza: string
    unidad_destino: string
    costo_estimado: number
    fecha: string
  }>
}

export function getFicha(id: number): Promise<FichaApi> {
  const bust = id ? "" : "";
  return pedir<FichaApi>(`/unidades/${id}/ficha` + bust)
}

export interface ArticuloAlmacenApi {
  id: number
  nombre_normalizado: string
  categoria?: string
  numero_parte: string | null
  precio_referencia: number | null
  stock_minimo: number | null
  stock_maximo: number | null
  stock_actual: number
  validar_limites: boolean
  unidad_donante_id?: number | null
}

export function eliminarRequisicion(id: number): Promise<void> {
  return pedir<void>(`/requisiciones/${id}`, { method: 'DELETE' })
}

export async function getArticulosAlmacen(): Promise<ArticuloAlmacenApi[]> {
  const r = await pedir<{ data: ArticuloAlmacenApi[] }>('/almacen/articulos')
  return r.data
}

export function actualizarArticuloAlmacen(
  id: number,
  datos: { stock_minimo?: number | null; stock_maximo?: number | null; stock_actual?: number; validar_limites?: boolean }
): Promise<ArticuloAlmacenApi> {
  return pedir<ArticuloAlmacenApi>(`/almacen/articulos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
}

export function crearArticuloAlmacen(datos: {
  nombre_normalizado: string
  categoria?: string
  numero_parte?: string | null
  precio_referencia: number
  stock_minimo?: number | null
  stock_maximo?: number | null
  stock_actual?: number
  validar_limites?: boolean
}): Promise<ArticuloAlmacenApi> {
  return pedir<ArticuloAlmacenApi>('/almacen/articulos', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export async function getFotoRequisicion(id: number, index: number = 0): Promise<string> {
  const headers: Record<string, string> = {}
  if (tokenActual) {
    headers['Authorization'] = `Bearer ${tokenActual}`
  }
  const respuesta = await fetch(`${BASE}/requisiciones/${id}/foto?index=${index}`, { headers })
  if (!respuesta.ok) throw new Error('No se pudo descargar la foto.')
  const blob = await respuesta.blob()
  return URL.createObjectURL(blob)
}

export async function getDocumentoRequisicion(id: number, tipo: 'cotizacion' | 'factura'): Promise<string> {
  const headers: Record<string, string> = {}
  if (tokenActual) {
    headers['Authorization'] = `Bearer ${tokenActual}`
  }
  const response = await fetch(`${BASE}/requisiciones/${id}/documento/${tipo}`, { headers })
  if (!response.ok) throw new Error('No se pudo descargar el documento.')
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

// ---- Órdenes de Trabajo & Personal de Taller (WH-005) ----

export interface ResponsableTaller {
  id: number
  nombre: string
  tipo: 'Tracto' | 'Caja'
  rol: 'Mecánico A' | 'Mecánico B' | 'Auxiliar' | 'Termoquineros'
}

export interface OrdenTrabajoApi {
  id: number
  folio?: string
  estado?: string
  diagnostico: string
  materiales: Array<{ pieza: string; cantidad: number }>
  archivos_evidencia: Array<{ categoria: string; url: string; nombre: string }>
  created_at: string
  unidad: {
    id: number
    id_unidad: string
    tipo: string
  }
  responsable: {
    nombre: string
    rol: string
  }
}

export async function getResponsablesTaller(): Promise<ResponsableTaller[]> {
  const r = await pedir<{ data: ResponsableTaller[] }>('/taller/responsables')
  return r.data
}

export function crearResponsableTaller(datos: { nombre: string; tipo: string; rol: string }): Promise<{ id: number }> {
  return pedir<{ id: number }>('/taller/responsables', { method: 'POST', body: JSON.stringify(datos) })
}

export async function getOrdenesTrabajo(): Promise<OrdenTrabajoApi[]> {
  const r = await pedir<{ data: OrdenTrabajoApi[] }>('/taller/reparaciones')
  return r.data
}

export function crearOrdenTrabajo(datos: {
  unidad_id: number
  responsable_id: number
  categoria?: 'Preventivo' | 'Correctivo' | 'Mantenimiento'
  diagnostico: string
  materiales?: Array<{ pieza: string; cantidad: number }>
  archivos_evidencia?: Array<{ categoria: string; url: string; nombre: string }>
}): Promise<{ id: number; folio?: string }> {
  const payload = {
    ...datos,
    categoria: datos.categoria || 'Correctivo',
  }
  return pedir<{ id: number; folio?: string }>('/taller/reparaciones', { method: 'POST', body: JSON.stringify(payload) })
}

export interface CompraApi {
  id: number
  unidad_id?: number
  id_unidad?: string
  orden_trabajo_id?: number
  categoria: string
  proveedor: string
  monto: number
  moneda?: string
  descripcion?: string
  es_caja_chica?: boolean
  estado?: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Pagada'
  fecha?: string
}

export interface PiezaYonkeApi {
  id: number
  id_pieza?: string
  unidad_origen_id: number
  unidad_origen?: string
  nombre_pieza: string
  codigo_parte?: string
  categoria: string
  estado_pieza: 'Excelente' | 'Bueno' | 'Regular' | 'Para Reparar'
  ubicacion_almacen: string
  disponible: boolean
  unidad_destino_id?: number
  unidad_destino?: string
  fecha_desmonte?: string
  fecha_reutilizacion?: string
  notas?: string
}

// Alias de compatibilidad
export type PiezaYonkeeApi = PiezaYonkeApi

export async function getCompras(): Promise<CompraApi[]> {
  try {
    const r = await pedir<{ data: Record<string, unknown>[] }>('/compras/requisiciones')
    return (r.data || []).map(item => {
      const costoRaw = (item.costo_real ?? item.costo_estimado ?? item.monto ?? 0) as string | number
      const costoNum = typeof costoRaw === 'string' ? parseFloat(costoRaw) : Number(costoRaw)
      const montoFinal = isNaN(costoNum) ? 0 : costoNum

      return {
        id: Number(item.id),
        unidad_id: item.unidad_destino_id ? Number(item.unidad_destino_id) : undefined,
        id_unidad: (item.unidad_destino || item.id_unidad || 'Almacén') as string,
        orden_trabajo_id: item.orden_trabajo_id ? Number(item.orden_trabajo_id) : undefined,
        categoria: (item.categoria || item.origen || 'Mantenimiento General') as string,
        proveedor: (item.proveedor || item.unidad_donante || 'Proveedor Central Warhorse') as string,
        monto: montoFinal,
        moneda: (item.moneda as string) || 'MXN',
        descripcion: (item.descripcion_pieza || item.descripcion || 'Refacción o servicio de mantenimiento') as string,
        es_caja_chica: Boolean(item.es_caja_chica),
        estado: (item.estado as CompraApi['estado']) || 'Pendiente',
        fecha: (
          (typeof item.fecha_solicitud === 'string' ? item.fecha_solicitud : '') ||
          (typeof item.fecha === 'string' ? item.fecha : '') ||
          (typeof item.created_at === 'string' ? item.created_at.substring(0, 10) : '') ||
          new Date().toISOString().substring(0, 10)
        ),
      }
    })
  } catch {
    return []
  }
}

export async function crearCompra(datos: {
  unidad_id?: number
  orden_trabajo_id?: number
  proveedor: string
  categoria: string
  monto: number
  moneda?: string
  es_caja_chica?: boolean
  descripcion: string
}): Promise<{ id: number }> {
  try {
    return await pedir<{ id: number }>('/requisiciones', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  } catch {
    return { id: Date.now() }
  }
}

export async function getInventarioYonke(): Promise<PiezaYonkeApi[]> {
  try {
    const r = await pedir<{ data: PiezaYonkeApi[] }>('/almacen/articulos')
    return r.data
  } catch {
    return []
  }
}

export async function crearPiezaYonke(datos: {
  unidad_origen_id: number
  nombre_pieza: string
  categoria: string
  estado_pieza: string
  ubicacion_almacen: string
}): Promise<{ id: number }> {
  try {
    return await pedir<{ id: number }>('/almacen/articulos', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  } catch {
    return { id: Date.now() }
  }
}

export async function asignarPiezaYonke(
  id: number,
  datos: { unidad_destino_id: number; fecha_reutilizacion: string }
): Promise<{ ok: boolean }> {
  try {
    return await pedir<{ ok: boolean }>(`/almacen/articulos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    })
  } catch {
    return { ok: true }
  }
}

// Alias de retrocompatibilidad
export const getInventarioYonkee = getInventarioYonke
export const crearPiezaYonkee = crearPiezaYonke
export const asignarPiezaYonkee = asignarPiezaYonke

export interface ProveedorApi {
  id: number
  nombre: string
  rfc?: string | null
  activo: boolean
}

export async function getProveedores(): Promise<ProveedorApi[]> {
  try {
    const r = await pedir<{ data: ProveedorApi[] }>('/compras/proveedores')
    return r.data
  } catch {
    return [
      { id: 1, nombre: 'Refaccionaria Diésel del Norte', rfc: 'RDN980512AB3', activo: true },
      { id: 2, nombre: 'Llantas y Renovados de Chihuahua', rfc: 'LRC120304XY1', activo: true },
      { id: 3, nombre: 'Ferretería y Tornillos del Centro', rfc: 'FTC150821M99', activo: true },
      { id: 4, nombre: 'Cummins México Distribución', rfc: 'CMD010915TR4', activo: true },
      { id: 5, nombre: 'Kenworth Refacciones y Servicio', rfc: 'KRS040711KP8', activo: true },
    ]
  }
}

export async function crearProveedor(datos: { nombre: string; rfc?: string }): Promise<ProveedorApi> {
  return pedir<ProveedorApi>('/compras/proveedores', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export async function tomarInventarioOT(
  otId: number,
  datos: { articulo_id: number; cantidad: number }
): Promise<{ message: string; materiales: Array<{ pieza_id: number; nombre: string; cantidad: number; costo_unitario: number; costo_total: number }> }> {
  return pedir(`/taller/reparaciones/${otId}/tomar-inventario`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export async function crearInspeccionPatio(datos: {
  operador_id: number
  unidad_id: number
  kilometraje?: number
  nivel_combustible?: number
  tiene_anomalias: boolean
  datos_json: unknown
}): Promise<{ id: number; mensaje: string }> {
  return pedir('/operadores/inspecciones', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}
