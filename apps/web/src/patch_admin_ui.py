import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Admin.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add 'trazabilidad' to type Entidad
if "'trazabilidad'" not in content:
    content = content.replace("type Entidad = 'usuarios' | 'unidades' | 'proveedores' | 'fallas'", "type Entidad = 'usuarios' | 'unidades' | 'proveedores' | 'fallas' | 'trazabilidad'")

# 2. Add 'trazabilidad' to the tabs array
if "'trazabilidad'" in content.split("['usuarios', 'unidades', 'proveedores', 'fallas']")[0]:
    pass
else:
    content = content.replace("['usuarios', 'unidades', 'proveedores', 'fallas']", "['usuarios', 'unidades', 'proveedores', 'fallas', 'trazabilidad']")

# 3. Add JSON Viewer Modal or Logic
json_modal = """
  const [jsonView, setJsonView] = useState<{old: any, new: any} | null>(null)

  const renderJsonView = () => {
    if (!jsonView) return null
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '80%', maxWidth: 800, maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Comparativa de Cambios</h3>
            <button onClick={() => setJsonView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>Ã—</button>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h4>Old State</h4>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>{jsonView.old ? JSON.stringify(JSON.parse(jsonView.old), null, 2) : 'N/A'}</pre>
            </div>
            <div style={{ flex: 1 }}>
              <h4>New State</h4>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>{jsonView.new ? JSON.stringify(JSON.parse(jsonView.new), null, 2) : 'N/A'}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }
"""

if "jsonView" not in content:
    content = content.replace("const [error, setError] = useState('')", "const [error, setError] = useState('')\n" + json_modal)
    content = content.replace("return (", "return (\n    <>\n      {renderJsonView()}")
    content = content.replace("    </div>\n  )\n}", "    </div>\n    </>\n  )\n}")

# 4. Modify fetch URL for 'trazabilidad' -> 'audit-logs'
# const resp = await pedir<any[]>(`/admin/${entidad === 'trazabilidad' ? 'audit-logs' : entidad}`)
if "entidad === 'trazabilidad' ? 'audit-logs' : entidad" not in content:
    content = content.replace("`/admin/${entidad}`", "`/admin/${entidad === 'trazabilidad' ? 'audit-logs' : entidad}`")

# 5. Modify rendering logic for trazabilidad table
render_tabla = """
  const renderTabla = () => {
    if (cargando) return <div>Cargando...</div>
    if (datos.length === 0) return <div>No hay registros en {tab}.</div>

    if (tab === 'trazabilidad') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={theadRow}>
              <th style={thCell}>Fecha</th>
              <th style={thCell}>User ID</th>
              <th style={thCell}>MÃ³dulo</th>
              <th style={thCell}>AcciÃ³n</th>
              <th style={thCell}>ID Registro</th>
              <th style={thCell}>Cambios</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila, i) => (
              <tr key={i} className="hv-fila">
                <td style={tdCell}>{fila.created_at}</td>
                <td style={tdCell}>{fila.usuario_id || 'SYSTEM'}</td>
                <td style={tdCell}>{fila.modulo}</td>
                <td style={tdCell}>{fila.accion}</td>
                <td style={tdCell}>{fila.registro_id}</td>
                <td style={tdCell}>
                  <button onClick={() => setJsonView({old: fila.old_state, new: fila.new_state})} style={{ background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>Ver JSON</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const columnas = Object.keys(datos[0]).filter(k => k !== 'deleted_at')
"""

if "tab === 'trazabilidad'" not in content:
    # Need to regex replace the renderTabla
    # Replace from const renderTabla = () => { to const columnas = Object.keys(datos[0]).filter(k => k !== 'deleted_at')
    # Actually just replace `const columnas`
    content = content.replace("const columnas = Object.keys(datos[0]).filter(k => k !== 'deleted_at')", render_tabla.replace("  const renderTabla = () => {\n    if (cargando) return <div>Cargando...</div>\n    if (datos.length === 0) return <div>No hay registros en {tab}.</div>\n\n", ""))

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Admin.tsx for Audit Logs")
