import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Kicker from '../components/Kicker'
import { SortTh, TablaFooter } from '../components/TablaControls'
import { ApiError, getOrdenesTrabajo, crearOrdenTrabajo, actualizarOrdenTrabajo, getResponsablesTaller, crearResponsableTaller, type ResponsableTaller, type OrdenTrabajoApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, FD, h2Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import { useTabla } from '../lib/useTabla'

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

const ROLES_TECNICOS = ['Mecánico A', 'Mecánico B', 'Auxiliar', 'Termoquineros']

export default function OrdenesTrabajo({ asTab: _asTab }: { asTab?: boolean } = {}) {
  const { unidades, toast } = useDemo()
  const [reparaciones, setReparaciones] = useState<OrdenTrabajoApi[]>([])
  const [responsables, setResponsables] = useState<ResponsableTaller[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
    const [otSeleccionada, setOtSeleccionada] = useState<OrdenTrabajoApi | null>(null)
    const [actualizando, setActualizando] = useState(false)


  const modal = (titulo: string, contenido: ReactNode, onGuardar: () => void, onCerrar: () => void) => (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
      >
        <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 14px' }}>
          {titulo}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{contenido}</div>
        {error && (
          <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onCerrar}
            className="hv-crema"
            style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className="hv-naranja"
            style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )

  // Modals state
  const [nuevaOT, setNuevaOT] = useState<boolean>(false)
  const [nuevoResp, setNuevoResp] = useState<boolean>(false)

  // Creation form state
  const [unidadId, setUnidadId] = useState('')
  const [responsableId, setResponsableId] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [materiales, setMateriales] = useState<{ pieza: string; cantidad: number }[]>([])
  const [archivosEvidencia, setArchivosEvidencia] = useState<{ categoria: string; nombre: string }[]>([])

  // Resp form state
  const [respNombre, setRespNombre] = useState('')
  const [respTipo, setRespTipo] = useState<'Tracto' | 'Caja'>('Tracto')
  const [respRol, setRespRol] = useState('Mecánico A')

  const ctrl = useTabla(
    reparaciones,
    'created_at',
    'desc',
    useCallback((row, col) => {
      if (col === 'unidad') return row.unidad.id_unidad
      if (col === 'responsable') return row.responsable.nombre
      return (row as unknown as Record<string, unknown>)[col] as string | number
    }, [])
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [ops, resps] = await Promise.all([getOrdenesTrabajo(), getResponsablesTaller()])
      setReparaciones(ops)
      setResponsables(resps)
    } catch (e) {
        setError('No tienes permisos para ver esta sección o hubo un error del servidor.')
    } finally {
      setCargando(false)
    }
  }, [toast])

  useEffect(() => { void cargar() }, [cargar])

  
  const renderEstado = (estado?: string) => {
    switch (estado) {
      case 'Liberada Parcial':
        return <span style={badge('#FEF3C7', '#B45309', '#FCD34D')}>✔️ Parcial</span>
      case 'Liberada':
        return <span style={badge('#D1FAE5', '#065F46', '#6EE7B7')}>✔️ Liberada</span>
      default:
        return <span style={badge('#DBEAFE', '#1E40AF', '#93C5FD')}>⏳ En Proceso</span>
    }
  }

  const handleCrearResponsable = async () => {
    if (!respNombre.trim()) return setError('Ingresa el nombre del responsable.')
    setError('')
    try {
      await crearResponsableTaller({ nombre: respNombre.trim(), tipo: respTipo, rol: respRol })
      toast(`Responsable "${respNombre}" agregado al taller.`)
      setRespNombre('')
      setNuevoResp(false)
      const resps = await getResponsablesTaller()
      setResponsables(resps)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el responsable.')
    }
  }

  const handleCrearOT = async () => {
    if (!unidadId) return setError('Selecciona la unidad.')
    if (!responsableId) return setError('Selecciona el técnico responsable.')
    if (!diagnostico.trim()) return setError('Describe el diagnóstico o trabajo realizado.')
    setError('')
    try {
      await crearOrdenTrabajo({
        unidad_id: Number(unidadId),
        responsable_id: Number(responsableId),
        diagnostico: diagnostico.trim(),
        materiales: materiales.filter(m => m.pieza.trim() !== ''),
        archivos_evidencia: archivosEvidencia.map(a => ({ categoria: a.categoria, url: '#', nombre: a.nombre })),
      })
      toast('Orden de trabajo registrada exitosamente.')
      setNuevaOT(false)
      // Reset form
      setUnidadId('')
      setResponsableId('')
      setDiagnostico('')
      setMateriales([])
      setArchivosEvidencia([])
      await cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la orden de trabajo.')
    }
  }

  const handleFileChange = (categoria: string, files: FileList | null) => {
    if (!files) return
    const nuevos = Array.from(files).map(f => ({ categoria, nombre: f.name }))
    setArchivosEvidencia(prev => [...prev, ...nuevos])
  }

  const removeFile = (idx: number) => {
    setArchivosEvidencia(prev => prev.filter((_, i) => i !== idx))
  }

  const addMaterialRow = () => {
    setMateriales(prev => [...prev, { pieza: '', cantidad: 1 }])
  }

  const updateMaterialRow = (idx: number, campo: 'pieza' | 'cantidad', valor: any) => {
    setMateriales(prev => prev.map((m, i) => {
      if (i !== idx) return m
      return { ...m, [campo]: campo === 'cantidad' ? Number(valor) : valor }
    }))
  }

  const removeMaterialRow = (idx: number) => {
    setMateriales(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Mantenimiento" />
          <h2 style={h2Titulo}>Órdenes de Trabajo y Reparaciones</h2>
          <p style={subTitulo}>
            Historial de mantenimiento sobre unidades, asignación de responsables por nivel técnico y gestión de evidencias para facturación.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              import('../lib/csv').then(({ descargarCSV }) => {
                const headers = ['Unidad', 'Responsable', 'Diagnóstico / Trabajo', 'Materiales', 'Fecha Registro']
                const rows = reparaciones.map((r) => [
                  String(r.unidad.id_unidad),
                  String(r.responsable?.nombre || '—'),
                  String(r.diagnostico),
                  String(r.materiales.map(m => `${m.pieza} (${m.cantidad})`).join('; ') || '—'),
                  String(r.created_at),
                ])
                const filename = `Reporte_OrdenesTrabajo_${new Date().toISOString().split('T')[0]}.csv`
                descargarCSV(headers, rows, filename)
                toast(`Reporte ${filename} descargado exitosamente.`)
              })
            }}
            className="hv-borde-ink"
            style={{ padding: '9px 14px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            ⬇️ Exportar CSV
          </button>
          <button
            onClick={() => { setError(''); setNuevoResp(true) }}
            className="hv-crema"
            style={{ padding: '9px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            + Agregar Técnico
          </button>
          <button
            onClick={() => { setError(''); setNuevaOT(true) }}
            className="hv-naranja"
            style={{ padding: '9px 18px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            + Nueva Orden
          </button>
        </div>
      </div>

      <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 18, animation: 'fadeUp 0.4s ease' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 15 }}>
            Cargando órdenes de trabajo...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={theadRow}>
                <SortTh col="unidad"      label="Unidad"       sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <SortTh col="responsable" label="Responsable"  sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
                <th style={thCell}>Rol Técnico</th>
                <th style={thCell}>Diagnóstico / Trabajo</th>
                <th style={{ ...thCell, textAlign: 'center' }}>Materiales</th>
                <th style={{ ...thCell, textAlign: 'center' }}>Evidencias</th>
                <SortTh col="created_at"  label="Fecha Registro" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />
              </tr>
            </thead>
            <tbody>
              {ctrl.filasPagina.map((ot) => (
                <tr key={ot.id} className="hv-fila" onClick={() => setOtSeleccionada(ot)} style={{ cursor: "pointer", background: otSeleccionada?.id === ot.id ? "var(--bg-active)" : "inherit" }}>
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 16 }}>{ot.unidad.id_unidad}</td>
                    <td style={tdCell}>{renderEstado(ot.estado)}</td>
                  <td style={{ ...tdCell, fontWeight: 600 }}>{ot.responsable.nombre}</td>
                  <td style={tdCell}>
                    <span style={badge('#E3ECF7', '#1B4E8C', '#9FC0E4')}>{ot.responsable.rol}</span>
                  </td>
                  <td style={{ ...tdCell, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ot.diagnostico}>
                    {ot.diagnostico}
                  </td>
                  <td style={{ ...tdCell, textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {ot.materiales.length} pzs
                    </span>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {ot.archivos_evidencia.map((a, i) => (
                        <span key={i} style={badge('#FDF3EC', '#B4430A', '#C5A059')} title={`${a.categoria}: ${a.nombre}`}>
                          📎 {a.categoria}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={tdCell}>{ot.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {ctrl.total === 0 && !cargando && (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 14 }}>
            No hay órdenes de trabajo registradas aún.
          </div>
        )}

        <TablaFooter ctrl={ctrl} />
      </div>

      {/* ── Modal Nueva OT ── */}
      {nuevaOT && (
        <div
          onClick={() => setNuevaOT(false)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 14px' }}>
              Registrar Orden de Trabajo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={etiqueta}>
                Unidad / Caja
                <select style={campo} value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
                  <option value="">Selecciona unidad...</option>
                  {unidades.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.id_unidad} ({u.tipo})</option>
                  ))}
                </select>
              </label>

              <label style={etiqueta}>
                Técnico Responsable
                <select style={campo} value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
                  <option value="">Selecciona responsable...</option>
                  {responsables.map(r => (
                    <option key={r.id} value={String(r.id)}>{r.nombre} ({r.tipo} - {r.rol})</option>
                  ))}
                </select>
              </label>

              <label style={etiqueta}>
                Diagnóstico / Detalles del Trabajo
                <textarea style={{ ...campo, height: 80, resize: 'none' }} placeholder="Escribe el diagnóstico y trabajos realizados..." value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
              </label>

              <div style={{ borderTop: '1px solid #E7E0D2', paddingTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  Materiales / Refacciones Utilizadas
                  <button onClick={addMaterialRow} style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    + Agregar Fila
                  </button>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {materiales.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input style={{ ...campo, flex: 3 }} placeholder="Nombre de refacción" value={m.pieza} onChange={(e) => updateMaterialRow(idx, 'pieza', e.target.value)} />
                      <input type="number" min={1} style={{ ...campo, flex: 1 }} value={m.cantidad} onChange={(e) => updateMaterialRow(idx, 'cantidad', e.target.value)} />
                      <button onClick={() => removeMaterialRow(idx)} style={{ background: 'transparent', border: 'none', color: '#C53030', fontWeight: 700, cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E7E0D2', paddingTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  Evidencias Documentales Categorizadas
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <label style={{ ...etiqueta, alignItems: 'center', justifyContent: 'center', border: '1px dashed #D8D2C4', borderRadius: 8, padding: 8, cursor: 'pointer', background: 'var(--bg-input)' }}>
                    <span style={{ fontSize: 12 }}>Antes/Después</span>
                    <input type="file" multiple style={{ display: 'none' }} onChange={(e) => handleFileChange('Antes/Después', e.target.files)} />
                  </label>
                  <label style={{ ...etiqueta, alignItems: 'center', justifyContent: 'center', border: '1px dashed #D8D2C4', borderRadius: 8, padding: 8, cursor: 'pointer', background: 'var(--bg-input)' }}>
                    <span style={{ fontSize: 12 }}>Lavado</span>
                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileChange('Lavado', e.target.files)} />
                  </label>
                  <label style={{ ...etiqueta, alignItems: 'center', justifyContent: 'center', border: '1px dashed #D8D2C4', borderRadius: 8, padding: 8, cursor: 'pointer', background: 'var(--bg-input)' }}>
                    <span style={{ fontSize: 12 }}>K9</span>
                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileChange('K9', e.target.files)} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {archivosEvidencia.map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: 6, fontSize: 12.5 }}>
                      <span><strong>[{a.categoria}]</strong> {a.nombre}</span>
                      <button onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', color: '#C53030', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setNuevaOT(false)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearOT}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Registrar Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nuevo Responsable ── */}
      {nuevoResp &&
        modal(
          'Agregar Técnico al Taller',
          <>
            <label style={etiqueta}>
              Nombre Completo
              <input style={campo} placeholder="Ej. Juan Pérez" value={respNombre} onChange={(e) => setRespNombre(e.target.value)} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Rubro
                <select style={campo} value={respTipo} onChange={(e) => setRespTipo(e.target.value as 'Tracto'|'Caja')}>
                  <option value="Tracto">Tracto</option>
                  <option value="Caja">Caja</option>
                </select>
              </label>
              <label style={etiqueta}>
                Rol / Especialidad
                <select style={campo} value={respRol} onChange={(e) => setRespRol(e.target.value)}>
                  {ROLES_TECNICOS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>
          </>,
          () => void handleCrearResponsable(),
          () => setNuevoResp(false)
        )}
    
      {otSeleccionada && !nuevaOT && !nuevoResp && (
        <div onClick={() => setOtSeleccionada(null)} style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 14, maxWidth: 600, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #1E40AF', animation: 'fadeUp 0.2s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, margin: '0 0 4px', color: 'var(--text-main)' }}>
                  Orden de Trabajo: {otSeleccionada.unidad.id_unidad}
                </h3>
                {renderEstado(otSeleccionada.estado)}
              </div>
              <button onClick={() => setOtSeleccionada(null)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            
            <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Diagnóstico de Ingreso:</p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{otSeleccionada.diagnostico}</p>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, background: 'var(--bg-input)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Responsable:</p>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{otSeleccionada.responsable.nombre}</p>
              </div>
              <div style={{ flex: 1, background: 'var(--bg-input)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Materiales:</p>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)' }}>
                  {otSeleccionada.materiales.map((m, i) => <li key={i}>{m.cantidad}x {m.pieza}</li>)}
                  {otSeleccionada.materiales.length === 0 && <li>Ninguno</li>}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 16 }}>Actualizar Estado</h4>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  disabled={actualizando || otSeleccionada.estado === 'Liberada Parcial'}
                  onClick={async () => {
                    setActualizando(true);
                    try {
                      await actualizarOrdenTrabajo(otSeleccionada.id, { estado: 'Liberada Parcial' });
                      toast('Unidad liberada con observaciones (Warning)');
                      setReparaciones(reparaciones.map(r => r.id === otSeleccionada.id ? { ...r, estado: 'Liberada Parcial' } : r));
                      setOtSeleccionada({ ...otSeleccionada, estado: 'Liberada Parcial' });
                    } catch (e) { setError('Error al actualizar') }
                    setActualizando(false);
                  }}
                  style={{ flex: 1, padding: '14px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', borderRadius: 8, fontWeight: 'bold', fontSize: 14, cursor: actualizando ? 'wait' : 'pointer' }}
                >
                  ⚠️ LIBERACIÓN PARCIAL
                </button>
                <button
                  disabled={actualizando || otSeleccionada.estado === 'Liberada'}
                  onClick={async () => {
                    setActualizando(true);
                    try {
                      await actualizarOrdenTrabajo(otSeleccionada.id, { estado: 'Liberada' });
                      toast('Unidad liberada completamente');
                      setReparaciones(reparaciones.map(r => r.id === otSeleccionada.id ? { ...r, estado: 'Liberada' } : r));
                      setOtSeleccionada({ ...otSeleccionada, estado: 'Liberada' });
                    } catch (e) { setError('Error al actualizar') }
                    setActualizando(false);
                  }}
                  style={{ flex: 1, padding: '14px', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: 8, fontWeight: 'bold', fontSize: 14, cursor: actualizando ? 'wait' : 'pointer' }}
                >
                  ✅ LIBERACIÓN TOTAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}