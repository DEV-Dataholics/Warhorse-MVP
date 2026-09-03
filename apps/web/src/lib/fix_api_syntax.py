import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\lib\api.ts'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_text = """  kpis_compras?: {
    total_compras_formal: number
    total_caja_chica: number
    reqs_pendientes: number
  }
}>
  seleccion: SeleccionDashboard | null
  parametros: { umbral_pct: number; ventana_meses: number }
}"""

good_text = """  kpis_compras?: {
    total_compras_formal: number
    total_caja_chica: number
    reqs_pendientes: number
  }
  seleccion: SeleccionDashboard | null
  parametros: { umbral_pct: number; ventana_meses: number }
}"""

content = content.replace(bad_text, good_text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
