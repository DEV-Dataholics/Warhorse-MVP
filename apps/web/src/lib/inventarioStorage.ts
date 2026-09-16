import { type MovimientoInventario, parsearCSVOficial } from './inventarioSchema'

const CLAVE_STORAGE_MOVIMIENTOS = 'warhorse_movimientos_inventario_kardex'

// Semilla inicial representativa extraída del Control de Inventario Mensual 2026 oficial
export const MOVIMIENTOS_SEMILLA_INICIAL: MovimientoInventario[] = [
  {
    "id": "74",
    "numero_parte": null,
    "descripcion_parte": "tornillos 5/8x2 rosca seguida con tuerca",
    "proveedor": "tusa",
    "tipo_transaccion": "ENTRADA",
    "cantidad": 60,
    "balance": 60,
    "fecha": "4/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "1",
    "numero_parte": null,
    "descripcion_parte": "wiper 22",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "2",
    "numero_parte": null,
    "descripcion_parte": "base para hembra grande",
    "proveedor": "promare o trasejusa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "3",
    "numero_parte": null,
    "descripcion_parte": "carbuclean",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 4,
    "balance": 4,
    "fecha": "5/2/2026",
    "solicitante": "HECTOR",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "4",
    "numero_parte": null,
    "descripcion_parte": "conexion de resorte 3/8",
    "proveedor": "cemaco",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": null,
    "departamento": "SELECCIONAR",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "5",
    "numero_parte": null,
    "descripcion_parte": "valvula control tablero",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "6",
    "numero_parte": null,
    "descripcion_parte": "conector 9007",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "7",
    "numero_parte": null,
    "descripcion_parte": "foco 9007",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "8",
    "numero_parte": null,
    "descripcion_parte": "foco 9006",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 4,
    "balance": 4,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "9",
    "numero_parte": null,
    "descripcion_parte": "ganchos p/cofre",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "10",
    "numero_parte": null,
    "descripcion_parte": "mangas p/ soldar",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 4,
    "balance": 4,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "11",
    "numero_parte": null,
    "descripcion_parte": "hembra hexagonal",
    "proveedor": "promare o trasejusa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "12",
    "numero_parte": null,
    "descripcion_parte": "cadenero p/puerta",
    "proveedor": "promare o trasejusa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 28,
    "balance": 28,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "13",
    "numero_parte": null,
    "descripcion_parte": "pivotes p rin de fierro",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 8,
    "balance": 8,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "14",
    "numero_parte": null,
    "descripcion_parte": "parches xrp-10",
    "proveedor": "muñoz car",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 19,
    "balance": 19,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "15",
    "numero_parte": null,
    "descripcion_parte": "parches pr12",
    "proveedor": "muñoz car",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 7,
    "balance": 7,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "16",
    "numero_parte": null,
    "descripcion_parte": "balero eje 3",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "17",
    "numero_parte": null,
    "descripcion_parte": "zapatas p/ pila 3/8",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 3,
    "balance": 3,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "18",
    "numero_parte": null,
    "descripcion_parte": "disco de corte 7",
    "proveedor": "agmaq",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 3,
    "balance": 3,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "19",
    "numero_parte": "2972800",
    "descripcion_parte": "plafon redondo rojo 4",
    "proveedor": "apymsa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 20,
    "balance": 20,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "20",
    "numero_parte": null,
    "descripcion_parte": "maria rojas",
    "proveedor": "apymsa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 45,
    "balance": 45,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "21",
    "numero_parte": null,
    "descripcion_parte": "luz p placa blanca",
    "proveedor": "apymsa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 69,
    "balance": 69,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "22",
    "numero_parte": null,
    "descripcion_parte": "maria ambar",
    "proveedor": "apymsa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 49,
    "balance": 49,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "23",
    "numero_parte": null,
    "descripcion_parte": "manita azul p caja",
    "proveedor": "promare o trasejusa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "24",
    "numero_parte": null,
    "descripcion_parte": "manita roja p caja",
    "proveedor": "promare o trasejusa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "25",
    "numero_parte": null,
    "descripcion_parte": "manita azul p manguera",
    "proveedor": "promare",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "26",
    "numero_parte": null,
    "descripcion_parte": "manita roja p manguera",
    "proveedor": "promare",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "27",
    "numero_parte": null,
    "descripcion_parte": "llave de paso 1/2",
    "proveedor": "cemaco",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": null,
    "departamento": "SELECCIONAR",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "28",
    "numero_parte": null,
    "descripcion_parte": "contra bisagras",
    "proveedor": "promare",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 9,
    "balance": 9,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "29",
    "numero_parte": null,
    "descripcion_parte": "reveseros 3 cuadrado",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "30",
    "numero_parte": null,
    "descripcion_parte": "valvula selectora 9 velocidades",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "31",
    "numero_parte": "46305",
    "descripcion_parte": "reten 46305pro",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": null,
    "departamento": "SELECCIONAR",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "32",
    "numero_parte": null,
    "descripcion_parte": "filtro lubricacion motor",
    "proveedor": "CAMIONERA",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "33",
    "numero_parte": "3499016",
    "descripcion_parte": "valvula de escape rapida",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": null,
    "departamento": "SELECCIONAR",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "34",
    "numero_parte": "905151",
    "descripcion_parte": "kit de filtros diesel",
    "proveedor": "CAMIONERA",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "35",
    "numero_parte": null,
    "descripcion_parte": "bisagras wabash",
    "proveedor": "promare",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 14,
    "balance": 14,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "36",
    "numero_parte": null,
    "descripcion_parte": "cinta para aislar",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 24,
    "balance": 24,
    "fecha": "5/2/2026",
    "solicitante": "AMBOS TALLERES",
    "departamento": "SELECCIONAR",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "37",
    "numero_parte": null,
    "descripcion_parte": "disco de corte 4",
    "proveedor": "agmaq",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 15,
    "balance": 15,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "38",
    "numero_parte": null,
    "descripcion_parte": "arrancadores",
    "proveedor": "diesel parts",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 4,
    "balance": 4,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "39",
    "numero_parte": null,
    "descripcion_parte": "valvula bendix freno",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "40",
    "numero_parte": null,
    "descripcion_parte": "focos h11",
    "proveedor": "diesel parts o apymsa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 4,
    "balance": 4,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "41",
    "numero_parte": null,
    "descripcion_parte": "foco 9005",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "42",
    "numero_parte": null,
    "descripcion_parte": "foco 3157 blanco",
    "proveedor": "diesel parts o apymsa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 8,
    "balance": 8,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "43",
    "numero_parte": null,
    "descripcion_parte": "foco 3157 ambar",
    "proveedor": "diesel parts o apymsa",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 10,
    "balance": 10,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "44",
    "numero_parte": null,
    "descripcion_parte": "hembra chica",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 2,
    "balance": 2,
    "fecha": "5/2/2026",
    "solicitante": "FRAGA",
    "departamento": "TALLER TRACTOS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "45",
    "numero_parte": "35058",
    "descripcion_parte": "reten 35058 pro",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 1,
    "balance": 1,
    "fecha": "5/2/2026",
    "solicitante": null,
    "departamento": "SELECCIONAR",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "46",
    "numero_parte": null,
    "descripcion_parte": "puntas 3/8 firing",
    "proveedor": null,
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 11,
    "balance": 11,
    "fecha": "5/2/2026",
    "solicitante": "KEVIN",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "47",
    "numero_parte": null,
    "descripcion_parte": "brocas 9/32 x12",
    "proveedor": "agmaq",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 8,
    "balance": 8,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "48",
    "numero_parte": null,
    "descripcion_parte": "brocas 5/16x12",
    "proveedor": "agmaq",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 6,
    "balance": 6,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  },
  {
    "id": "49",
    "numero_parte": null,
    "descripcion_parte": "brocas 5/16x4",
    "proveedor": "agmaq",
    "tipo_transaccion": "AJUSTE ENTRADA",
    "cantidad": 14,
    "balance": 14,
    "fecha": "5/2/2026",
    "solicitante": "JAZ",
    "departamento": "TALLER CAJAS",
    "autorizado_por": "JESUS SOTO",
    "comentarios": null
  }
]

/**
 * Obtiene la lista completa de movimientos de inventario registrados.
 */
export async function obtenerMovimientosInventario(): Promise<MovimientoInventario[]> {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE_MOVIMIENTOS)
    if (!raw) {
      localStorage.setItem(CLAVE_STORAGE_MOVIMIENTOS, JSON.stringify(MOVIMIENTOS_SEMILLA_INICIAL))
      return MOVIMIENTOS_SEMILLA_INICIAL
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOVIMIENTOS_SEMILLA_INICIAL
  } catch (err) {
    console.warn('Error al leer movimientos de inventario local, usando semilla', err)
    return MOVIMIENTOS_SEMILLA_INICIAL
  }
}

/**
 * Registra un nuevo movimiento en el Kardex y calcula el balance acumulado.
 */
export async function registrarMovimientoInventario(
  mov: Omit<MovimientoInventario, 'id' | 'created_at'>
): Promise<MovimientoInventario> {
  const movimientos = await obtenerMovimientosInventario()
  
  // Calcular nuevo balance basado en el historial previo de esa misma refacción
  const descNormalizada = mov.descripcion_parte.toLowerCase().trim()
  const ultimoMov = [...movimientos]
    .reverse()
    .find(m => m.descripcion_parte.toLowerCase().trim() === descNormalizada)

  let balancePrevio = ultimoMov ? ultimoMov.balance : 0
  let nuevoBalance = balancePrevio

  if (mov.tipo_transaccion === 'ENTRADA' || mov.tipo_transaccion === 'AJUSTE ENTRADA') {
    nuevoBalance = balancePrevio + mov.cantidad
  } else if (mov.tipo_transaccion === 'SALIDA' || mov.tipo_transaccion === 'AJUSTE SALIDA') {
    nuevoBalance = Math.max(0, balancePrevio - mov.cantidad)
  }

  const nuevoMovimiento: MovimientoInventario = {
    ...mov,
    id: movimientos.length + 1,
    balance: mov.balance !== undefined ? mov.balance : nuevoBalance,
    created_at: new Date().toISOString(),
  }

  const nuevaLista = [nuevoMovimiento, ...movimientos]
  localStorage.setItem(CLAVE_STORAGE_MOVIMIENTOS, JSON.stringify(nuevaLista))

  return nuevoMovimiento
}

/**
 * Importa movimientos masivos desde un archivo CSV con el formato oficial de 12 columnas.
 */
export async function importarMovimientosDesdeCSV(
  textoCsv: string
): Promise<{ total: number; agregados: number }> {
  const parseados = parsearCSVOficial(textoCsv)
  if (parseados.length === 0) {
    return { total: 0, agregados: 0 }
  }

  const existentes = await obtenerMovimientosInventario()
  // Unir sin duplicar estrictamente por id o combinación fecha+desc+cant
  const combinados = [...parseados, ...existentes]
  
  // Limitar a máximo 2,000 registros para óptimo rendimiento de renderizado en cliente
  const finales = combinados.slice(0, 2000)
  localStorage.setItem(CLAVE_STORAGE_MOVIMIENTOS, JSON.stringify(finales))

  return { total: parseados.length, agregados: parseados.length }
}

/**
 * Restablece los movimientos a la semilla oficial inicial.
 */
export async function restablecerMovimientosSemilla(): Promise<void> {
  localStorage.setItem(CLAVE_STORAGE_MOVIMIENTOS, JSON.stringify(MOVIMIENTOS_SEMILLA_INICIAL))
}
