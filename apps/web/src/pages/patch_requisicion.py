import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Requisicion.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_opcional = """<option value="">-- Opcional --</option>"""
s_opcional_new = """<option value="">-- Selecciona una Orden de Trabajo --</option>"""

if s_opcional in content:
    content = content.replace(s_opcional, s_opcional_new)

s_ayuda = """<span style={ayudaCampo}>Si la requisiciAA3n pertenece a una orden activa de taller</span>"""
# We don't need to replace this if it's messed up with unicode, we can just replace the whole label partially

s_label_old = """Orden de Trabajo (Folio de Taller)
              <span style={ayudaCampo}>Si la requisiciAA3n pertenece a una orden activa de taller</span>"""
s_label_new = """Orden de Trabajo (Folio de Taller) *
              <span style={ayudaCampo}>Toda requisición debe pertenecer a una OT (Gatekeeper)</span>"""
content = re.sub(r'Orden de Trabajo \(Folio de Taller\)\n.*<span style=\{ayudaCampo\}>.*?</span>', s_label_new, content)

s_val = """if (!pieza && !selArticuloId) return setError('Falta describir o seleccionar la pieza.')
      if (esYonke && !donante) return setError('Falta indicar el tracto donante.')
      if (!paraInventario && !destino) return setError('Falta seleccionar unidad destino.')"""

s_val_new = """if (!pieza && !selArticuloId) return setError('Falta describir o seleccionar la pieza.')
      if (esYonke && !donante) return setError('Falta indicar el tracto donante.')
      if (!paraInventario && !destino) return setError('Falta seleccionar unidad destino.')
      if (!ordenTrabajoId) return setError('Falta seleccionar una Orden de Trabajo obligatoria.')"""

if "if (!ordenTrabajoId)" not in content:
    content = content.replace(s_val, s_val_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Requisicion.tsx")
