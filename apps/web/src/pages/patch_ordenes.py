import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\OrdenesTrabajo.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_func = """export default function OrdenesTrabajo() {"""
s_func_new = """export default function OrdenesTrabajo({ asTab }: { asTab?: boolean } = {}) {"""

if s_func in content:
    content = content.replace(s_func, s_func_new)

s_header = """      <div style={{ marginBottom: 30 }}>
        <Kicker texto="Mantenimiento" />
        <h2 style={h2Titulo}>Órdenes de Trabajo</h2>
        <p style={subTitulo}>Crea y gestiona las OT de unidades.</p>
      </div>"""
s_header_new = """      {!asTab && (
        <div style={{ marginBottom: 30 }}>
          <Kicker texto="Mantenimiento" />
          <h2 style={h2Titulo}>Órdenes de Trabajo</h2>
          <p style={subTitulo}>Crea y gestiona las OT de unidades.</p>
        </div>
      )}"""

if "marginBottom: 30" in content and "asTab" not in content:
    content = content.replace(s_header, s_header_new)
    
s_map = """            {reparacionesFiltradas.map(rep => (
              <tr key={rep.id} style={{ ...theadRow, background: 'transparent' }}>"""
s_map_new = """            {reparacionesFiltradas.map(rep => (
              <tr key={rep.id} style={{ ...theadRow, background: 'transparent', borderLeft: rep.categoria === 'Preventivo' ? '4px solid #3B82F6' : (rep.categoria === 'Correctivo' ? '4px solid #EF4444' : '4px solid transparent') }}>"""

if "borderLeft: rep.categoria" not in content:
    content = content.replace(s_map, s_map_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched OrdenesTrabajo.tsx")
