import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\OrdenesTrabajo.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# TR pattern
tr_pattern = r'<tr key=\{ot\.id\} className="hv-fila">'
tr_new = r'<tr key={ot.id} className="hv-fila" onClick={() => setOtSeleccionada(ot)} style={{ cursor: "pointer", background: otSeleccionada?.id === ot.id ? "var(--bg-active)" : "inherit" }}>'
content = content.replace('<tr key={ot.id} className="hv-fila">', tr_new)

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
              <button style={{ flex: 1, padding: '10px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: FD, fontSize: 14 }}>
                Liberar Unidad
              </button>
            </div>
          </div>
        )}
      </div>"""

if "gridTemplateColumns" not in content:
    content = re.sub(r"<div style=\{\{\s*\.\.\.card,\s*padding:\s*'14px 20px',\s*overflowX:\s*'auto',\s*marginTop:\s*18,\s*animation:\s*'fadeUp 0\.4s ease'\s*\}\}>", grid_start, content)
    content = re.sub(r"<\s*TablaFooter ctrl=\{ctrl\}\s*/>\s*</div>", f"<TablaFooter ctrl={{ctrl}} />\n{grid_end}", content)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex patch applied")
