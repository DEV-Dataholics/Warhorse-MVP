import { get, set, del } from 'idb-keyval'
import type { OrdenInspeccionForm } from './inspeccionSchema'

const PREFIJO_BORRADOR = 'wh_borrador_inspeccion_'
const PREFIJO_HISTORIAL = 'wh_historial_inspecciones'

/**
 * Guarda un borrador de inspección en tiempo real en IndexedDB.
 */
export async function guardarBorradorLocal(
  operadorId: string,
  datos: Partial<OrdenInspeccionForm>
): Promise<void> {
  const clave = `${PREFIJO_BORRADOR}${operadorId}`
  const datosConTimestamp = {
    ...datos,
    _guardado_en: new Date().toISOString(),
  }
  await set(clave, datosConTimestamp)
}

/**
 * Obtiene el borrador activo para el operador en turno.
 */
export async function obtenerBorradorLocal(
  operadorId: string
): Promise<(Partial<OrdenInspeccionForm> & { _guardado_en?: string }) | null> {
  const clave = `${PREFIJO_BORRADOR}${operadorId}`
  const borrador = await get(clave)
  return borrador || null
}

/**
 * Elimina el borrador tras haberse finalizado la inspección.
 */
export async function eliminarBorradorLocal(operadorId: string): Promise<void> {
  const clave = `${PREFIJO_BORRADOR}${operadorId}`
  await del(clave)
}

/**
 * Obtiene de forma síncrona el folio con formato histórico INS-YYYY-00001.
 */
export function obtenerFolioConsecutivoSincrono(): string {
  const anio = new Date().getFullYear()
  const clave = `wh_consecutivo_inspeccion_${anio}`
  const actual = parseInt(localStorage.getItem(clave) || '0', 10)
  const siguiente = actual + 1
  return `INS-${anio}-${String(siguiente).padStart(5, '0')}`
}

/**
 * Consulta el historial persistido (IndexedDB y localStorage) para determinar
 * con total precisión el siguiente folio correlativo histórico (ej. INS-2026-00001).
 */
export async function generarSiguienteFolioInspeccion(): Promise<string> {
  const anio = new Date().getFullYear()
  const clave = `wh_consecutivo_inspeccion_${anio}`
  let maxNum = parseInt(localStorage.getItem(clave) || '0', 10)

  try {
    const historial = await obtenerHistorialLocal()
    const regex = new RegExp(`^INS-?${anio}-?(\\d+)$`, 'i')
    for (const item of historial) {
      if (item.folio) {
        const match = item.folio.match(regex)
        if (match && match[1]) {
          const num = parseInt(match[1], 10)
          if (num > maxNum) {
            maxNum = num
          }
        }
      }
    }
  } catch {
    // Modo resiliente
  }

  const siguiente = maxNum + 1
  return `INS-${anio}-${String(siguiente).padStart(5, '0')}`
}

/**
 * Registra el folio que se acaba de emitir para avanzar el consecutivo histórico.
 */
export function registrarFolioEmitido(folio: string): void {
  const anio = new Date().getFullYear()
  const regex = new RegExp(`^INS-?${anio}-?(\\d+)$`, 'i')
  const match = folio.match(regex)
  if (match && match[1]) {
    const num = parseInt(match[1], 10)
    const clave = `wh_consecutivo_inspeccion_${anio}`
    const actual = parseInt(localStorage.getItem(clave) || '0', 10)
    if (num > actual) {
      localStorage.setItem(clave, String(num))
    }
  }
}

/**
 * Guarda una orden de inspección finalizada en el registro local permanente de IndexedDB.
 */
export async function guardarInspeccionFinalizada(
  inspeccion: OrdenInspeccionForm
): Promise<void> {
  const listaActual: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  // Agregar al inicio para orden cronológico inverso
  const nuevaLista = [inspeccion, ...listaActual.filter(i => i.folio !== inspeccion.folio)]
  await set(PREFIJO_HISTORIAL, nuevaLista)
  registrarFolioEmitido(inspeccion.folio)
}

/**
 * Retorna todas las inspecciones almacenadas localmente en la tablet o navegador.
 */
export async function obtenerHistorialLocal(): Promise<OrdenInspeccionForm[]> {
  // Purga de inicio en CERO absoluto para el recorrido limpio E2E
  if (!localStorage.getItem('wh_reset_cero_aplicado_v2')) {
    await set(PREFIJO_HISTORIAL, [])
    localStorage.setItem('wh_reset_cero_aplicado_v2', 'true')
    return []
  }
  const lista: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []

  // Sanitización de integridad: Corregir asignación errónea de operador_id si el nombre era de Dirección WarHorse
  let huboCorreccion = false
  const listaSaneada = lista.map(item => {
    if (item.operador_nombre === 'Dirección WarHorse' && item.operador_id === 'EMP-409') {
      huboCorreccion = true
      return { ...item, operador_id: 'EMP-ADMIN' }
    }
    return item
  })

  if (huboCorreccion) {
    await set(PREFIJO_HISTORIAL, listaSaneada)
  }

  return listaSaneada
}

/**
 * Marca una orden local como sincronizada con el backend de Laragon.
 */
export async function marcarInspeccionSincronizada(folio: string): Promise<void> {
  const lista: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  const actualizada = lista.map(item => {
    if (item.folio === folio) {
      return { ...item, sincronizado: true }
    }
    return item
  })
  await set(PREFIJO_HISTORIAL, actualizada)
}

/**
 * Marca una inspección como atendida por una Orden de Trabajo generada en Taller.
 */
export async function marcarInspeccionAtendida(
  folioInspeccion: string,
  folioOT: string
): Promise<void> {
  const lista: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  const actualizada = lista.map(item => {
    if (item.folio === folioInspeccion) {
      return {
        ...item,
        ot_generada: folioOT,
        fecha_atencion_ot: new Date().toISOString(),
      }
    }
    return item
  })
  await set(PREFIJO_HISTORIAL, actualizada)
}

/**
 * Marca todas las inspecciones con anomalías pendientes de una unidad como resueltas tras ser liberada en Taller.
 */
export async function marcarInspeccionesUnidadResueltas(
  unidadId: string,
  folioOT: string
): Promise<void> {
  const lista: OrdenInspeccionForm[] = (await get(PREFIJO_HISTORIAL)) || []
  const actualizada = lista.map(item => {
    if (item.unidad_id.toLowerCase() === unidadId.toLowerCase() && !item.ot_generada) {
      return {
        ...item,
        ot_generada: folioOT,
        fecha_atencion_ot: new Date().toISOString(),
      }
    }
    return item
  })
  await set(PREFIJO_HISTORIAL, actualizada)
}


/**
 * Deja el historial local en CERO absoluto para pruebas E2E desde el inicio.
 */
export async function limpiarHistorialCompletoPatio(): Promise<void> {
  await set(PREFIJO_HISTORIAL, [])
}

/**
 * Inicializador de datos de patio: Mantiene el estado en 0 para simulaciones reales de inicio.
 */
export async function inicializarDatosMuestraPatio(): Promise<void> {
  // Estado CERO: No se inyectan folios demo para permitir recorrido fidedigno desde cero
}
