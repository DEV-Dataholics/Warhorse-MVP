import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\lib\api.ts'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_dash = """export interface DashboardApi {
  unidades: Array<{
    id_unidad: string
    estado: string
    critico: boolean
    costo_diesel: number
    costo_refacciones: number
    costo_total: number
  }>
  kpis: {
    total_diesel: number
    total_refacciones: number
    costo_total: number
    top_criticos: number
    reparacion_activa: number
    disponibilidad_pct: number
  }
}"""

s_dash_new = """export interface DashboardApi {
  unidades: Array<{
    id_unidad: string
    estado: string
    critico: boolean
    costo_diesel: number
    costo_refacciones: number
    costo_total: number
  }>
  kpis: {
    total_diesel: number
    total_refacciones: number
    costo_total: number
    top_criticos: number
    reparacion_activa: number
    disponibilidad_pct: number
  }
  kpis_compras?: {
    total_compras_formal: number
    total_caja_chica: number
    reqs_pendientes: number
  }
}"""

if "kpis_compras" not in content:
    content = content.replace(s_dash, s_dash_new)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched DashboardApi")
