import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Dashboard.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_state = """export default function Dashboard() {
  const { selTractoId, setSelTractoId, toast } = useDemo()"""
s_state_new = """export default function Dashboard() {
  const [tabActual, setTabActual] = useState<'operativa' | 'compras'>('operativa')
  const { selTractoId, setSelTractoId, toast } = useDemo()"""

if "tabActual" not in content:
    content = content.replace(s_state, s_state_new)

s_return = """  return (
    <>"""
s_return_new = """  return (
    <>
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <button
          onClick={() => setTabActual('operativa')}
          style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: 15, fontWeight: tabActual === 'operativa' ? 700 : 500, color: tabActual === 'operativa' ? 'var(--accent-gold)' : 'var(--text-muted)', borderBottom: tabActual === 'operativa' ? '2px solid var(--accent-gold)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Dirección Operativa
        </button>
        <button
          onClick={() => setTabActual('compras')}
          style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: 15, fontWeight: tabActual === 'compras' ? 700 : 500, color: tabActual === 'compras' ? 'var(--accent-gold)' : 'var(--text-muted)', borderBottom: tabActual === 'compras' ? '2px solid var(--accent-gold)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Dirección de Compras
        </button>
      </div>
      
      {tabActual === 'compras' && dash?.kpis_compras && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease' }}>
          <div>
            <Kicker texto="Dirección" />
            <h2 style={h2Titulo}>Tablero de Compras</h2>
            <p style={subTitulo}>Análisis de adquisiciones y control estricto de Caja Chica.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Gasto Formal (OTs)</span>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', marginTop: 8 }}>{fmt(dash.kpis_compras.total_compras_formal)}</div>
            </div>
            
            <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Gasto Caja Chica</span>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-red)', marginTop: 8 }}>{fmt(dash.kpis_compras.total_caja_chica)}</div>
            </div>
            
            <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Requisiciones Pendientes</span>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-gold)', marginTop: 8 }}>{dash.kpis_compras.reqs_pendientes}</div>
            </div>
          </div>
          
          <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)', marginTop: 16 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--text-main)' }}>Proporción de Gasto</h3>
            <div style={{ display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ width: `${(dash.kpis_compras.total_compras_formal / (dash.kpis_compras.total_compras_formal + dash.kpis_compras.total_caja_chica || 1)) * 100}%`, background: 'var(--accent-gold)' }} title="Formal" />
              <div style={{ width: `${(dash.kpis_compras.total_caja_chica / (dash.kpis_compras.total_compras_formal + dash.kpis_compras.total_caja_chica || 1)) * 100}%`, background: 'var(--accent-red)' }} title="Caja Chica" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Formal ({(dash.kpis_compras.total_compras_formal / (dash.kpis_compras.total_compras_formal + dash.kpis_compras.total_caja_chica || 1) * 100).toFixed(1)}%)</span>
              <span>Caja Chica ({(dash.kpis_compras.total_caja_chica / (dash.kpis_compras.total_compras_formal + dash.kpis_compras.total_caja_chica || 1) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: tabActual === 'operativa' ? 'block' : 'none' }}>"""

if "tabActual ===" not in content:
    content = content.replace(s_return, s_return_new)

    # I need to close the div for operative tab at the very end.
    # The end of the file is:
    #       {errorModal && (
    #         ...
    #       )}
    #     </>
    #   )
    # }
    
    # We can just replace </> with </div></>
    # Wait, the closing tags are at the very end.
    content = content.replace("    </>\n  )\n}", "      </div>\n    </>\n  )\n}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched Dashboard.tsx")
