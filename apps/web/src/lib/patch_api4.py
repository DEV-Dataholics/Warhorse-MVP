import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\lib\api.ts'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add getReporte
s_api = """export async function getArticulosAlmacen(): Promise<ArticuloAlmacenApi[]> {"""
s_api_new = """export async function getReporte(tipo: 'inventario' | 'compras-ot' | 'salud-flota' | 'inspecciones'): Promise<any[]> {
  return pedir<any[]>(`/reportes/${tipo}`)
}

export async function getArticulosAlmacen(): Promise<ArticuloAlmacenApi[]> {"""
if "getReporte(" not in content:
    content = content.replace(s_api, s_api_new)

# Add kpis_compras to DashboardApi
s_dash = """export interface DashboardApi {
  kpis: { diesel: number; refacciones: number; taller: number; costo_real_acumulado: number }
  ranking: Array<{ id: number; id_unidad: string; costo_total: number; critico: boolean }>"""
s_dash_new = """export interface DashboardApi {
  kpis: { diesel: number; refacciones: number; taller: number; costo_real_acumulado: number }
  kpis_compras?: {
    total_compras_formal: number
    total_caja_chica: number
    reqs_pendientes: number
  }
  ranking: Array<{ id: number; id_unidad: string; costo_total: number; critico: boolean }>"""
if "kpis_compras" not in content:
    content = content.replace(s_dash, s_dash_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
