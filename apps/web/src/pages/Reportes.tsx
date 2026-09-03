import { useState } from 'react'
import Kicker from '../components/Kicker'
import { getReporte } from '../lib/api'
import { useDemo } from '../lib/demo'
import { h2Titulo, subTitulo } from '../lib/estilos'
import { descargarCSV } from '../lib/csv'

export default function Reportes() {
  const { toast } = useDemo()
  const [cargando, setCargando] = useState(false)

  const exportar = async (tipo: 'inventario' | 'compras-ot' | 'salud-flota' | 'inspecciones', nombreArchivo: string) => {
    setCargando(true)
    try {
      const datos = await getReporte(tipo)
      if (!datos || datos.length === 0) {
        toast('No hay datos para exportar.')
        return
      }
      const headers = Object.keys(datos[0])
      const rows = datos.map(d => headers.map(h => String(d[h] ?? '')))
      const filename = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`
      descargarCSV(headers, rows, filename)
      toast(`Reporte ${filename} descargado exitosamente.`)
    } catch (e) {
      toast(`Error al descargar reporte ${nombreArchivo}.`)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease' }}>
      <div>
        <Kicker texto="Módulo de Analítica" />
        <h2 style={h2Titulo}>Reportes Estáticos</h2>
        <p style={subTitulo}>
          Consola de exportación de inteligencia de negocios. 
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        
        {/* Reporte 1 */}
        <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 600 }}>1. Inventario Global</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Stock, partes de Yonke y compras externas consolidadas.</p>
          <button 
            disabled={cargando}
            onClick={() => void exportar('inventario', 'Reporte_Inventario')}
            className="hv-naranja"
            style={{ padding: '10px 16px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: cargando ? 'not-allowed' : 'pointer' }}
          >
            Descargar CSV
          </button>
        </div>

        {/* Reporte 2 */}
        <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 600 }}>2. Compras OTs</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Adquisiciones ligadas a Órdenes de Trabajo (Excluye Caja Chica).</p>
          <button 
            disabled={cargando}
            onClick={() => void exportar('compras-ot', 'Reporte_Compras_OTs')}
            className="hv-naranja"
            style={{ padding: '10px 16px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: cargando ? 'not-allowed' : 'pointer' }}
          >
            Descargar CSV
          </button>
        </div>

        {/* Reporte 3 */}
        <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 600 }}>3. Salud de la Flota</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Estatus actualizado del parque vehicular (Unit Health).</p>
          <button 
            disabled={cargando}
            onClick={() => void exportar('salud-flota', 'Reporte_Salud_Flota')}
            className="hv-naranja"
            style={{ padding: '10px 16px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: cargando ? 'not-allowed' : 'pointer' }}
          >
            Descargar CSV
          </button>
        </div>

        {/* Reporte 4 */}
        <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 600 }}>4. Histórico Inspecciones</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Bitácora inmutable de hallazgos reportados en patio.</p>
          <button 
            disabled={cargando}
            onClick={() => void exportar('inspecciones', 'Reporte_Inspecciones')}
            className="hv-naranja"
            style={{ padding: '10px 16px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: cargando ? 'not-allowed' : 'pointer' }}
          >
            Descargar CSV
          </button>
        </div>

      </div>
    </div>
  )
}
