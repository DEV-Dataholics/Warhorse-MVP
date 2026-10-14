import { useState, useCallback, useEffect, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { badge, card, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import { useDemo } from '../lib/demo'
import { getCargasExternas, asignarDesglose, borrarDesglose, type CargaExternaApi } from '../lib/api'
import { useTabla } from '../lib/useTabla'
import { SortTh, TablaFooter } from '../components/TablaControls'

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

interface FilaConciliada {
  unidad: string
  litros: number
  costo: number
  distancia: number
  rendimiento: number // km / L
}



export default function ConciliacionDiesel() {
  const { unidades, toast } = useDemo()
  const [combustibleCSV, setCombustibleCSV] = useState<string>('')
  const [samsaraCSV, setSamsaraCSV] = useState<string>('')
  const [resultados, setResultados] = useState<FilaConciliada[]>([])
  const [dragComb, setDragComb] = useState(false)
  const [dragSamsara, setDragSamsara] = useState(false)

  const handleFileDrop = (tipo: 'combustible' | 'samsara', file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (tipo === 'combustible') {
        setCombustibleCSV(text)
      } else {
        setSamsaraCSV(text)
      }
      toast(`Archivo "${file.name}" cargado correctamente.`)
    }
    reader.readAsText(file)
  }

  // Split loads state (mock dataset for external tanks)
  const [cargasExternas, setCargasExternas] = useState<CargaExternaApi[]>([])

  const cargarDatos = useCallback(() => {
    getCargasExternas().then(setCargasExternas).catch(e => toast(e.message))
  }, [toast])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const getValCarga = useCallback((c: CargaExternaApi, col: string) => {
    switch (col) {
      case 'fecha': return c.fecha
      case 'litros_totales': return c.litros_totales
      case 'costo_total': return c.costo_total
      case 'desglose': return c.desglose.length
      default: return ''
    }
  }, [])

  // Homologated pagination & sorting hook (TKT-WAR-154 standard)
  const ctrlCargas = useTabla<CargaExternaApi>(cargasExternas, 'fecha', 'desc', getValCarga, 10)

  const [desglosarCarga, setDesglosarCarga] = useState<CargaExternaApi | null>(null)
  const [tipoDestino, setTipoDestino] = useState<string>('Todos')
  const [nuevaUnidadDesglose, setNuevaUnidadDesglose] = useState('')
  const [folioSlip, setFolioSlip] = useState('')
  const [nuevosLitrosDesglose, setNuevosLitrosDesglose] = useState('')

  const parsearYCruzar = () => {
    if (!combustibleCSV.trim() || !samsaraCSV.trim()) {
      return toast('Por favor, ingresa los datos crudos en ambos campos de texto CSV.')
    }

    try {
      const lineasComb = combustibleCSV.split('\n').map(l => l.split(';')).filter(l => l.length >= 18)
      const lineasSamsara = samsaraCSV.split('\n').map(l => l.split(',')).filter(l => l.length >= 2)

      const mapaComb: Record<string, { litros: number; costo: number }> = {}
      lineasComb.forEach((row, i) => {
        if (i === 0 && row[0].toLowerCase().includes('cantidad')) return // Skip header
        const unidad = row[17]?.trim()
        const litros = Number(row[0]) || 0
        // Importe is row 4, which could have a '$' sign
        const costo = Number(row[4]?.replace(/[^0-9.-]+/g, "")) || 0
        if (unidad) {
          if (!mapaComb[unidad]) mapaComb[unidad] = { litros: 0, costo: 0 }
          mapaComb[unidad].litros += litros
          mapaComb[unidad].costo += costo
        }
      })

      const mapaSamsara: Record<string, number> = {}
      lineasSamsara.forEach((row, i) => {
        if (i === 0 && row[0].toLowerCase().includes('vehículo')) return // Skip header
        if (i === 0 && row[0].toLowerCase().includes('vehaculo')) return // Skip header
        const unidad = row[0]?.trim()
        // Samsara uses Distancia (mi), we need to convert to KM
        const distanciaMiles = Number(row[1]) || 0
        const distanciaKm = distanciaMiles * 1.60934
        if (unidad) {
          if (!mapaSamsara[unidad]) mapaSamsara[unidad] = 0
          mapaSamsara[unidad] += distanciaKm
        }
      })

      const cruzados: FilaConciliada[] = []
      const todasLasUnidades = new Set([...Object.keys(mapaComb), ...Object.keys(mapaSamsara)])

      todasLasUnidades.forEach(u => {
        const c = mapaComb[u] || { litros: 0, costo: 0 }
        const s = mapaSamsara[u] || 0
        cruzados.push({
          unidad: u,
          litros: Number(c.litros.toFixed(2)),
          costo: Number(c.costo.toFixed(2)),
          distancia: Number(s.toFixed(2)),
          rendimiento: c.litros > 0 ? Number((s / c.litros).toFixed(2)) : 0
        })
      })

      setResultados(cruzados.sort((a, b) => b.costo - a.costo))
      toast('Cruces de telemetría de Samsara y combustible calculados exitosamente.')
    } catch (e) {
      toast('Error al parsear los archivos CSV. Verifica el formato.')
    }
  }

  const unidadesFiltradas = unidades.filter(u => {
    if (tipoDestino === 'Todos') return true
    if (!u.tipo) return false
    const t = u.tipo.toLowerCase()
    const sel = tipoDestino.toLowerCase()
    return t.includes(sel) || (sel.includes('termo') && t.includes('termo')) || (sel.includes('caja') && t.includes('caja'))
  })

  const agregarDesglose = async () => {
    if (!desglosarCarga) return
    const l = Number(nuevosLitrosDesglose)
    if (!nuevaUnidadDesglose) return toast('Selecciona la unidad destino.')
    if (isNaN(l) || l <= 0) return toast('Ingresa una cantidad de litros válida.')
    if (!folioSlip.trim()) return toast('El Folio de slip es obligatorio.')

    const litrosAsignados = desglosarCarga.desglose.reduce((sum: number, item: any) => sum + item.litros, 0)
    if (litrosAsignados + l > desglosarCarga.litros_totales) {
      return toast('La suma del desglose supera el total de litros disponibles en el tanque.')
    }

    try {
      const u = unidades.find(un => un.id_unidad === nuevaUnidadDesglose)
      if (!u) return toast('Unidad no encontrada.')
      await asignarDesglose(desglosarCarga.id, {
        unidad_id: u.id,
        litros: l,
        folio_slip: folioSlip.trim()
      })
      toast('Carga parcial asignada exitosamente.')
      const c = await getCargasExternas()
      setCargasExternas(c)
      setDesglosarCarga(c.find(x => x.id === desglosarCarga.id) || null)
      setNuevaUnidadDesglose('')
      setNuevosLitrosDesglose('')
    } catch (e: any) {
      toast(e.message)
    }
  }

  const limpiarDesglose = async (desgloseId: number) => {
    if (!desglosarCarga) return
    try {
      await borrarDesglose(desglosarCarga.id, desgloseId)
      toast('AsignaciA3n de carga removida.')
      const c = await getCargasExternas()
      setCargasExternas(c)
      setDesglosarCarga(c.find(x => x.id === desglosarCarga.id) || null)
    } catch (e: any) {
      toast(e.message)
    }
  }

  return (
    <>
      <div style={{ animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Diésel y Combustible" />
        <h2 style={h2Titulo}>Conciliación Automática de Telemetría</h2>
        <p style={subTitulo}>
          Carga archivos de combustible y telemetría Samsara en crudo CSV para comparar distancias recorridas contra litros dispensados.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18, animation: 'fadeUp 0.4s ease' }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragComb(true) }}
          onDragLeave={() => setDragComb(false)}
          onDrop={(e) => { e.preventDefault(); setDragComb(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileDrop('combustible', f) }}
          style={{
            ...card,
            border: dragComb ? '2px dashed #C5A059' : '1px solid #E7E0D2',
            background: dragComb ? '#FDF3EC' : '#fff',
            transition: 'all 0.2s ease'
          }}
        >
          <label style={etiqueta}>
            CSV Combustible Crudo (WEX)
            <textarea
              style={{ ...campo, height: 120, fontFamily: 'monospace', fontSize: 13 }}
              placeholder="Cantidad;No Identificación;Producto;Valor Unitario;Importe;...;Eco;...&#10;10.004;34006;Diesel;$23.962;$258.50;...;CAJAS4;..."
              value={combustibleCSV}
              onChange={(e) => setCombustibleCSV(e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              📁 Suelta tu archivo CSV de combustible aquí para cargarlo automáticamente
            </span>
          </label>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragSamsara(true) }}
          onDragLeave={() => setDragSamsara(false)}
          onDrop={(e) => { e.preventDefault(); setDragSamsara(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileDrop('samsara', f) }}
          style={{
            ...card,
            border: dragSamsara ? '2px dashed #C5A059' : '1px solid #E7E0D2',
            background: dragSamsara ? '#FDF3EC' : '#fff',
            transition: 'all 0.2s ease'
          }}
        >
          <label style={etiqueta}>
            CSV Samsara Telemetría Cruda
            <textarea
              style={{ ...campo, height: 120, fontFamily: 'monospace', fontSize: 13 }}
              placeholder="Nombre del vehículo,Distancia (mi),...&#10;WH68,2012.1,..."
              value={samsaraCSV}
              onChange={(e) => setSamsaraCSV(e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              📁 Suelta tu archivo CSV de Samsara aquí para cargarlo automáticamente
            </span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, animation: 'fadeUp 0.42s ease' }}>
        <button
          onClick={parsearYCruzar}
          className="hv-naranja"
          style={{ padding: '12px 28px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 9, fontFamily: FD, fontSize: 17, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Procesar y Conciliar
        </button>
      </div>

      {resultados.length > 0 && (
        <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 18, animation: 'fadeUp 0.45s ease' }}>
          <h3 style={{ ...h3Titulo, marginBottom: 12 }}>Resultados de Eficiencia Cruzada</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 600 }}>
            <thead>
              <tr style={theadRow}>
                <th style={thCell}>Unidad</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Litros Dispensados</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Costo Total</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Distancia Samsara (km)</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Rendimiento Calculado (km/L)</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, idx) => (
                <tr key={idx} className="hv-fila">
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 16 }}>{r.unidad}</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.litros} L</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.costo)}</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.distancia} km</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: r.rendimiento > 2 ? '#2C7A44' : '#C53030' }}>
                    {r.rendimiento} km/L
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Split external loads section with standardized pagination */}
      <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 24, animation: 'fadeUp 0.48s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ ...h3Titulo, margin: 0 }}>Desglose de Tanques Externos / Cargas Compartidas</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
              Selecciona una carga general realizada a un contenedor o tanque externo para fragmentarla y asignarla a unidades/cajas individuales.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Mostrar:</span>
            <select
              value={ctrlCargas.pageSize}
              onChange={(e) => ctrlCargas.setPageSize(Number(e.target.value))}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 13 }}
            >
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
            <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>({ctrlCargas.total} cargas)</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={theadRow}>
              <SortTh col="fecha" label="Fecha" sortCol={ctrlCargas.sortCol} sortDir={ctrlCargas.sortDir} onSort={ctrlCargas.toggleSort} />
              <SortTh col="litros_totales" label="Litros Totales" sortCol={ctrlCargas.sortCol} sortDir={ctrlCargas.sortDir} onSort={ctrlCargas.toggleSort} style={{ textAlign: 'right' }} />
              <SortTh col="costo_total" label="Costo" sortCol={ctrlCargas.sortCol} sortDir={ctrlCargas.sortDir} onSort={ctrlCargas.toggleSort} style={{ textAlign: 'right' }} />
              <SortTh col="desglose" label="Desglose Asignado" sortCol={ctrlCargas.sortCol} sortDir={ctrlCargas.sortDir} onSort={ctrlCargas.toggleSort} />
              <th style={{ ...thCell, padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }} />
            </tr>
          </thead>
          <tbody>
            {ctrlCargas.filasPagina.map((c) => {
              const litrosAsignados = c.desglose.reduce((sum, item) => sum + item.litros, 0)
              return (
                <tr key={c.id} className="hv-fila">
                  <td style={tdCell}>{c.fecha}</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.litros_totales} L</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.costo_total)}</td>
                  <td style={tdCell}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {c.desglose.map((d: any, idx: number) => (
                        <span key={idx} style={badge('#E3ECF7', '#1B4E8C', '#9FC0E4')}>
                          {d.unidad_nombre || d.unidad}: {d.litros} L {d.folio_slip ? `[Slip: ${d.folio_slip}]` : ''}
                        </span>
                      ))}
                      {c.desglose.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin desglose aún</span>}
                    </div>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right' }}>
                    <button
                      onClick={() => { setDesglosarCarga(c) }}
                      className="hv-op85"
                      style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-gold)', cursor: 'pointer' }}
                    >
                      Fragmentar Carga ({c.litros_totales - litrosAsignados} L Libres)
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {ctrlCargas.total === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
            Sin registros de tanques externos.
          </div>
        )}

        <TablaFooter ctrl={ctrlCargas} />
      </div>

      {/* ── Modal Desglose ── */}
      {desglosarCarga && (
        <div
          onClick={() => setDesglosarCarga(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 580, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 10px' }}>
              Fragmentar Contenedor Externo
            </h3>
            <div style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Tanque del día <strong style={{ color: 'var(--text-main)' }}>{desglosarCarga.fecha}</strong> · Litros totales: <strong style={{ color: 'var(--text-main)' }}>{desglosarCarga.litros_totales} L</strong>.<br />
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <span>Asignados: {desglosarCarga.desglose.reduce((s: number, i: any) => s + i.litros, 0)} L</span>
                  <span style={{ color: 'var(--accent-gold)' }}>Disponibles: {desglosarCarga.litros_totales - desglosarCarga.desglose.reduce((s: number, i: any) => s + i.litros, 0)} L</span>
                </div>
                <div style={{ width: '100%', height: 10, background: 'var(--border-color)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${(desglosarCarga.desglose.reduce((s: number, i: any) => s + i.litros, 0) / desglosarCarga.litros_totales) * 100}%`, height: '100%', background: 'var(--accent-gold)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Selectores en cascada: Tipo de Destino -> Unidad Destino */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={etiqueta}>
                  Tipo de Destino (Filtro)
                  <select
                    style={campo}
                    value={tipoDestino}
                    onChange={(e) => {
                      setTipoDestino(e.target.value)
                      setNuevaUnidadDesglose('')
                    }}
                  >
                    <option value="Todos">Todos los destinos</option>
                    <option value="Tractor">Tractor / Tractocamión</option>
                    <option value="Termo">Termo / Thermo King</option>
                    <option value="Caja seca">Caja seca</option>
                    <option value="Generador">Generador / Planta</option>
                  </select>
                </label>

                <label style={etiqueta}>
                  Unidad Destino *
                  <select
                    style={campo}
                    value={nuevaUnidadDesglose}
                    onChange={(e) => setNuevaUnidadDesglose(e.target.value)}
                  >
                    <option value="">Selecciona unidad...</option>
                    {unidadesFiltradas.map(u => (
                      <option key={u.id} value={u.id_unidad}>{u.id_unidad} ({u.tipo})</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Folio de slip obligatorio y Litros a cargar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
                <label style={etiqueta}>
                  Folio de Slip (Comprobante Físico) *
                  <input
                    type="text"
                    style={campo}
                    placeholder="Ej. SLP-9842"
                    value={folioSlip}
                    onChange={(e) => setFolioSlip(e.target.value)}
                  />
                </label>

                <label style={etiqueta}>
                  Litros *
                  <input
                    type="number"
                    min={1}
                    max={desglosarCarga.litros_totales - desglosarCarga.desglose.reduce((s: number, i: any) => s + i.litros, 0)}
                    style={campo}
                    placeholder="Ej. 65"
                    value={nuevosLitrosDesglose}
                    onChange={(e) => {
                      const max = desglosarCarga.litros_totales - desglosarCarga.desglose.reduce((s: number, i: any) => s + i.litros, 0)
                      if (Number(e.target.value) > max) {
                        setNuevosLitrosDesglose(String(max))
                      } else {
                        setNuevosLitrosDesglose(e.target.value)
                      }
                    }}
                  />
                </label>

                <button
                  onClick={agregarDesglose}
                  className="hv-naranja"
                  style={{ padding: '12px 18px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer', height: 46 }}
                >
                  + Asignar
                </button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -4 }}>
                ℹ️ <em>Folio No-Único</em>: Un mismo comprobante puede amparar múltiples unidades. Firma digital y fotografía purgadas conforme a TKT-WAR-163.
              </div>

              {/* Desglose Registrado */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  Desglose Registrado en este Tanque:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {desglosarCarga.desglose.map((d: any, i: number) => (
                    <div key={d.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong>{d.unidad_nombre || d.unidad}</strong>: {d.litros} Litros
                        {d.folio_slip && (
                          <span style={{ marginLeft: 8, fontSize: 11.5, padding: '2px 7px', background: 'rgba(197, 160, 89, 0.15)', color: 'var(--accent-gold)', borderRadius: 4, fontWeight: 700 }}>
                            Slip: {d.folio_slip}
                          </span>
                        )}
                      </div>
                      <button onClick={() => limpiarDesglose(d.id)} title="Eliminar asignación" style={{ background: 'transparent', border: 'none', color: '#C53030', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>✕</button>
                    </div>
                  ))}
                  {desglosarCarga.desglose.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay unidades asignadas aún a este contenedor.</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setDesglosarCarga(null)}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
