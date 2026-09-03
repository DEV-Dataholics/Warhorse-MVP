import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\OrdenesTrabajo.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

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

if "{!asTab && (" not in content:
    content = content.replace(s_header, s_header_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched asTab")
