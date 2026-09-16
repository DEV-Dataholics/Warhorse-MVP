import { z } from 'zod'

export const TIPOS_TRANSACCION_INVENTARIO = [
  'ENTRADA',
  'SALIDA',
  'AJUSTE ENTRADA',
  'AJUSTE SALIDA',
] as const

export type TipoTransaccionInventario = typeof TIPOS_TRANSACCION_INVENTARIO[number]

export const DEPARTAMENTOS_ALMACEN = [
  'TALLER CAJAS',
  'TALLER TRACTOS',
  'AMBOS TALLERES',
  'TRÁFICO',
  'RH',
  'OTRO',
] as const

export type DepartamentoAlmacen = typeof DEPARTAMENTOS_ALMACEN[number]

export const PROVEEDORES_FRECUENTES = [
  'Diesel Parts',
  'Apymsa',
  'Tarango',
  'Cemaco',
  'Agmaq',
  'Promare',
  'Trasejusa',
  'Semco',
  'Muñoz Car',
  'Camionera',
  'Cummins',
  'Tracto Partes Ortiz',
  'Volvo',
  'Tusa',
  'Rolesa',
  'Cadisa',
  'Primagu',
  'Sams',
] as const

export const AUTORIZADORES_FRECUENTES = [
  'JESUS SOTO',
  'ALAN',
  'MONTZAY',
  'FRAGA',
  'MARISOL SOTO',
  'ING. ROBERTO SALAZAR',
] as const

// Interfaz para una fila del Kardex / Control Mensual de Inventario (12 columnas)
export interface MovimientoInventario {
  id: number | string // Consecutivo (#)
  numero_parte?: string | null
  descripcion_parte: string
  proveedor?: string | null
  tipo_transaccion: TipoTransaccionInventario
  cantidad: number
  balance: number // Stock resultante
  fecha: string // Formato D/M/YYYY o YYYY-MM-DD
  solicitante?: string | null // Mecánico, Auxiliar o Unidad (ej. FRAGA, HECTOR, WH-35)
  departamento?: DepartamentoAlmacen | string | null
  autorizado_por?: string | null
  comentarios?: string | null
  created_at?: string
}

// Esquema Zod de validación para registrar un nuevo movimiento
export const movimientoInventarioSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  numero_parte: z.string().nullable().optional(),
  descripcion_parte: z.string().min(2, 'La descripción de la parte es obligatoria'),
  proveedor: z.string().nullable().optional(),
  tipo_transaccion: z.enum(TIPOS_TRANSACCION_INVENTARIO),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  balance: z.number().nonnegative().optional(),
  fecha: z.string().min(6, 'La fecha es obligatoria'),
  solicitante: z.string().nullable().optional(),
  departamento: z.string().nullable().optional(),
  autorizado_por: z.string().nullable().optional(),
  comentarios: z.string().nullable().optional(),
})

export type FormMovimientoInventario = z.infer<typeof movimientoInventarioSchema>

/**
 * Convierte un arreglo de movimientos de inventario en una cadena CSV
 * con la cabecera y estructura de 12 columnas exactas a las del cliente.
 */
export function exportarMovimientosACSV(movimientos: MovimientoInventario[]): string {
  const lineas: string[] = [
    ',,,,CONTROL DE INVENTARIO MENSUAL,,,,,,,,',
    ',,,,,,,,,,,,',
    '#,Numero de Parte#,Descripcion de Parte,Proveedor,Tipo de Transaccion (ENTERADA/SALIDA/AJUSTE),Cantidad,Balance,Fecha,Solicitante,Departamento,Autorizado por:,Comentarios,',
  ]

  movimientos.forEach((m, idx) => {
    const escapado = (val: any) => {
      if (val === null || val === undefined) return ''
      const str = String(val).trim()
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const fila = [
      escapado(m.id || idx + 1),
      escapado(m.numero_parte || ''),
      escapado(m.descripcion_parte),
      escapado(m.proveedor || ''),
      escapado(m.tipo_transaccion),
      escapado(m.cantidad),
      escapado(m.balance),
      escapado(m.fecha),
      escapado(m.solicitante || ''),
      escapado(m.departamento || ''),
      escapado(m.autorizado_por || ''),
      escapado(m.comentarios || ''),
      '',
    ].join(',')

    lineas.push(fila)
  })

  return lineas.join('\r\n')
}

/**
 * Parsea el contenido en texto de un archivo CSV oficial de Control de Inventario Mensual.
 */
export function parsearCSVOficial(csvTexto: string): MovimientoInventario[] {
  const lineas = csvTexto.split(/\r?\n/)
  const movimientos: MovimientoInventario[] = []

  let inicioDatos = false

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim()
    if (!linea) continue

    // Detectar la fila de encabezado
    if (linea.toLowerCase().includes('descripcion de parte') || linea.toLowerCase().includes('tipo de transaccion')) {
      inicioDatos = true
      continue
    }

    if (!inicioDatos) continue

    // Parsear columnas respetando comillas
    const cols = parsearLineaCSV(linea)
    if (cols.length < 4) continue

    const id = cols[0]?.trim() || String(movimientos.length + 1)
    const numero_parte = cols[1]?.trim() || null
    const descripcion_parte = cols[2]?.trim()
    if (!descripcion_parte) continue

    const proveedor = cols[3]?.trim() || null
    let tipo_transaccion_raw = cols[4]?.trim().toUpperCase() || 'SALIDA'

    let tipo_transaccion: TipoTransaccionInventario = 'SALIDA'
    if (tipo_transaccion_raw.includes('ENTRADA') && !tipo_transaccion_raw.includes('AJUSTE')) {
      tipo_transaccion = 'ENTRADA'
    } else if (tipo_transaccion_raw.includes('AJUSTE') && tipo_transaccion_raw.includes('ENTRADA')) {
      tipo_transaccion = 'AJUSTE ENTRADA'
    } else if (tipo_transaccion_raw.includes('AJUSTE') && tipo_transaccion_raw.includes('SALIDA')) {
      tipo_transaccion = 'AJUSTE SALIDA'
    } else if (tipo_transaccion_raw.includes('SALIDA')) {
      tipo_transaccion = 'SALIDA'
    }

    const cantidad = Math.abs(parseFloat(cols[5]?.replace(/[^0-9.-]/g, '') || '1')) || 1
    const balance = parseFloat(cols[6]?.replace(/[^0-9.-]/g, '') || '0') || 0
    const fecha = cols[7]?.trim() || new Date().toISOString().substring(0, 10)
    const solicitante = cols[8]?.trim() || null
    const departamento = cols[9]?.trim() || null
    const autorizado_por = cols[10]?.trim() || null
    const comentarios = cols[11]?.trim() || null

    movimientos.push({
      id,
      numero_parte,
      descripcion_parte,
      proveedor,
      tipo_transaccion,
      cantidad,
      balance,
      fecha,
      solicitante,
      departamento,
      autorizado_por,
      comentarios,
    })
  }

  return movimientos
}

function parsearLineaCSV(linea: string): string[] {
  const resultado: string[] = []
  let enComillas = false
  let valorActual = ''

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i]
    if (char === '"') {
      if (enComillas && linea[i + 1] === '"') {
        valorActual += '"'
        i++
      } else {
        enComillas = !enComillas
      }
    } else if (char === ',' && !enComillas) {
      resultado.push(valorActual)
      valorActual = ''
    } else {
      valorActual += char
    }
  }
  resultado.push(valorActual)
  return resultado
}
