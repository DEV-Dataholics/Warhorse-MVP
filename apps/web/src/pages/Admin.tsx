import { useState, useEffect } from 'react'
import Kicker from '../components/Kicker'
import { card, theadRow, thCell, tdCell,  h2Titulo } from '../lib/estilos'
import { pedir } from '../lib/api'

type Entidad = 'usuarios' | 'unidades' | 'proveedores' | 'fallas' | 'trazabilidad'

export default function Admin() {
  const [tab, setTab] = useState<Entidad>('usuarios')
  const [datos, setDatos] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    cargarDatos(tab)
  }, [tab])

  const cargarDatos = async (entidad: Entidad) => {
    setCargando(true)
    setError('')
    try {
      let endpoint = '';
      if (entidad === 'usuarios') endpoint = '/usuarios';
      else if (entidad === 'unidades') endpoint = '/unidades';
      else if (entidad === 'trazabilidad') endpoint = '/auditoria';
      else endpoint = '/usuarios'; // fallback
      const resp = await pedir<any>(endpoint);
      setDatos(Array.isArray(resp) ? resp : (resp.data || []))
    } catch (e: any) {
      setError(e.message || `Error al cargar ${entidad}`)
      setDatos([])
    } finally {
      setCargando(false)
    }
  }

  const desactivar = async (id: number) => {
    if (!confirm('¿Estás seguro de querer inactivar este registro (Soft Delete)?')) return
    try {
      
      let endpoint = '';
      if (tab === 'usuarios') endpoint = '/usuarios';
      else if (tab === 'unidades') endpoint = '/unidades';
      else endpoint = '/usuarios';
      await pedir(`${endpoint}/${id}`, { method: 'DELETE' });
    
      cargarDatos(tab)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {['usuarios', 'unidades', 'proveedores', 'fallas', 'trazabilidad'].map(t => (
        <button
          key={t}
          onClick={() => setTab(t as Entidad)}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            background: tab === t ? 'var(--accent-gold)' : 'var(--bg-glass)',
            fontWeight: tab === t ? 700 : 500,
            textTransform: 'capitalize'
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )

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
              <th style={thCell}>Módulo</th>
              <th style={thCell}>Acción</th>
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

    if (datos.length === 0) return <div style={{ padding: 20 }}>No hay registros en ${tab}.</div>;
    const columnas = Object.keys(datos[0]).filter(k => k !== 'deleted_at');

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={theadRow}>
            {columnas.map(c => <th key={c} style={thCell}>{c}</th>)}
            <th style={thCell}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, i) => (
            <tr key={i} className="hv-fila">
              {columnas.map(c => (
                <td key={c} style={tdCell}>
                  {String(fila[c])}
                </td>
              ))}
              <td style={tdCell}>
                <button
                  onClick={() => desactivar(fila.id)}
                  style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}
                >
                  Inactivar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <>
      {renderJsonView()}
      <div style={{ padding: 24, animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Configuración y RBAC" />
        <h1 style={{ ...h2Titulo, marginBottom: 20 }}>Gestión de Catálogos</h1>
        
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

        {renderTabs()}

        <div style={{ ...card, padding: 20, overflowX: 'auto' }}>
          {renderTabla()}
        </div>
      </div>
    </>
  )
}
