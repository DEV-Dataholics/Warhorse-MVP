import { useState, useEffect } from 'react'
import { useDemo } from '../lib/demo'
import { card, h2Titulo, FD } from '../lib/estilos'
import OrdenesTrabajo from './OrdenesTrabajo'
import Kicker from '../components/Kicker'

const API_URL = '/api/v1'

function InspeccionesEntrantes() {
  const { toast } = useDemo()
  const [entrantes, setEntrantes] = useState<any[]>([])

  useEffect(() => {
    let failCount = 0;
    const fetchEntrantes = async () => {
        try {
            const res = await fetch(`${API_URL}/operadores/entrantes`);
            if (!res.ok) {
                failCount++;
                if (failCount > 2) clearInterval(interval); // stop polling if backend keeps failing
                return;
            }
            failCount = 0;
            const data = await res.json();
            if (data && Array.isArray(data.data)) setEntrantes(data.data);
            else if (Array.isArray(data)) setEntrantes(data);
        } catch (e) {
            failCount++;
            if (failCount > 2) clearInterval(interval);
        }
    };
    fetchEntrantes();
    const interval = setInterval(fetchEntrantes, 5000) // Polling cada 5s
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, fontFamily: FD, fontSize: 18 }}>Alertas de Patio (Requieren OT)</h3>
      {entrantes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No hay inspecciones con anomalías pendientes.</p>
      ) : (
        entrantes.map((ins, i) => (
          <div key={i} style={{ ...card, borderLeft: '4px solid #DC2626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Eco {ins.unidad}</strong> - Reportado por {ins.operador_nombre}
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {ins.datos_json?.luces_falla && '💡 Luces '}
                  {ins.datos_json?.frenos_falla && '🛑 Frenos '}
                  {ins.datos_json?.llantas_falla && '⚙️ Llantas '}
                  {ins.datos_json?.motor_falla && '🔧 Motor '}
                  {ins.datos_json?.observaciones && `📝 ${ins.datos_json.observaciones}`}
                </div>
              </div>
              <button 
                className="btn-gold" 
                onClick={() => toast('Redirigiendo a crear OT para ECO ' + ins.unidad)}
              >
                Atender
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function BuscadorCompras() {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)

  const buscar = async () => {
    if (!q) return
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/compras/buscar?q=${q}`)
      const data = await res.json()
      if (res.ok) setResultados(data)
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, fontFamily: FD, fontSize: 18 }}>Rastreador de Piezas</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          value={q} 
          onChange={e => setQ(e.target.value)} 
          placeholder="Ej. Eco 14, Balatas, ID 42..." 
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
        />
        <button className="btn-gold" onClick={buscar} disabled={cargando}>
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {resultados.map((r, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Requisición #{r.id} - Eco {r.unidad}</strong>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: '#E5E7EB', color: '#374151' }}>{r.estado}</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 14 }}>{r.justificacion}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Taller() {
  const [tab, setTab] = useState<'inspecciones' | 'ots' | 'compras'>('inspecciones')

  const tabStyle = (active: boolean) => ({
    padding: '12px 24px',
    cursor: 'pointer',
    borderBottom: active ? '3px solid #C5A059' : '3px solid transparent',
    fontWeight: active ? 700 : 500,
    color: active ? 'var(--text-main)' : 'var(--text-muted)'
  })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 40px' }}>
      <div style={{ marginBottom: 30 }}>
        <Kicker texto="Módulo 2" />
        <h2 style={h2Titulo}>Escritorio de Control de Taller</h2>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div style={tabStyle(tab === 'inspecciones')} onClick={() => setTab('inspecciones')}>
          Entrantes (Patio)
        </div>
        <div style={tabStyle(tab === 'ots')} onClick={() => setTab('ots')}>
          Órdenes de Trabajo
        </div>
        <div style={tabStyle(tab === 'compras')} onClick={() => setTab('compras')}>
          Rastreador de Piezas
        </div>
      </div>

      <div>
        {tab === 'inspecciones' && <InspeccionesEntrantes />}
        {tab === 'ots' && <OrdenesTrabajo asTab={true} />}
        {tab === 'compras' && <BuscadorCompras />}
      </div>
    </div>
  )
}
