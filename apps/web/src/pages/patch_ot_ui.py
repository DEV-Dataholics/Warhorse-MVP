import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\OrdenesTrabajo.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
state_pattern = r'const \[reparaciones, setReparaciones\] = useState<OrdenTrabajoApi\[\]>\(\[\]\)'
if "otSeleccionada" not in content:
    content = re.sub(state_pattern, "const [reparaciones, setReparaciones] = useState<OrdenTrabajoApi[]>([])\n  const [otSeleccionada, setOtSeleccionada] = useState<OrdenTrabajoApi | null>(null)", content)

# 2. Add cursor pointer and onClick to table rows
tr_pattern = r'<tr key=\{ot\.id\} className="hv-fila">'
tr_new = r'<tr key={ot.id} className="hv-fila" onClick={() => setOtSeleccionada(ot)} style={{ cursor: "pointer", background: otSeleccionada?.id === ot.id ? "var(--bg-active)" : "inherit" }}>'
content = content.replace(tr_pattern, tr_new)

# 3. Layout: change the main container to a CSS Grid if desktop
# Actually, the layout inside `return` is:
# return (
#   <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease' }}>
#     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
#       ...
#     </div>
#     <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 18, animation: 'fadeUp 0.4s ease' }}>
#       ...table...
#     </div>
#   ...
# )

# Let's wrap the card table in a grid container:
grid_start = """      <div style={{ display: 'grid', gridTemplateColumns: otSeleccionada ? '1fr 350px' : '1fr', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 18, animation: 'fadeUp 0.4s ease' }}>"""

grid_end = """        </div>
        
        {otSeleccionada && (
          <div style={{ ...card, padding: '20px', marginTop: 18, position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontFamily: FD }}>Detalle OT</h3>
              <button onClick={() => setOtSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>âœ•</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Unidad</span>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{otSeleccionada.unidad.id_unidad}</div>
              </div>
              
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Responsable</span>
                <div style={{ fontWeight: 600 }}>{otSeleccionada.responsable.nombre}</div>
                <div style={{ marginTop: 4 }}><span style={badge('#E3ECF7', '#1B4E8C', '#9FC0E4')}>{otSeleccionada.responsable.rol}</span></div>
              </div>
              
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>DiagnÃ³stico / Trabajo</span>
                <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8, marginTop: 4, lineHeight: 1.5 }}>
                  {otSeleccionada.diagnostico}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Materiales Requeridos ({otSeleccionada.materiales.length})</span>
                {otSeleccionada.materiales.length > 0 ? (
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: 20, color: 'var(--text-main)' }}>
                    {otSeleccionada.materiales.map((m, i) => (
                      <li key={i}>{m.pieza} (x{m.cantidad})</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>Ninguno</div>
                )}
              </div>
            </div>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button style={{ flex: 1, padding: '10px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Liberar Unidad
              </button>
            </div>
          </div>
        )}
      </div>"""

if "gridTemplateColumns" not in content:
    content = content.replace("<div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 18, animation: 'fadeUp 0.4s ease' }}>", grid_start)
    content = content.replace("        <TablaFooter ctrl={ctrl} />\n      </div>", f"        <TablaFooter ctrl={{ctrl}} />\n{grid_end}")

# 4. Dense layout for the table: reduce font size and paddings.
# In `OrdenesTrabajo.tsx` we can just patch `fontSize: 14` to `fontSize: 13`.
content = content.replace("fontSize: 14, minWidth: 700", "fontSize: 13, minWidth: 700")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched OrdenesTrabajo.tsx")
