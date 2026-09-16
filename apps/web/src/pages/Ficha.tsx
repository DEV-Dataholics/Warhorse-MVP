import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Camion from '../components/Camion'
import { getFicha, getUnidades, type FichaApi, type UnidadApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, estadoUnidadColors, FD, fmt, h2Titulo, h3Titulo, tdCell, thCell, theadRow } from '../lib/estilos'

export default function Ficha() {
  const { id } = useParams()
  const { unidades } = useDemo()
  const navigate = useNavigate()
  const [ficha, setFicha] = useState<FichaApi | null>(null)
  const [unidadesLocales, setUnidadesLocales] = useState<UnidadApi[]>([])

  const listaEfectiva = unidades && unidades.length > 0 ? unidades : unidadesLocales
  // La URL trae el id de flota (WH125) o el id numérico; el catálogo vivo resuelve la unidad
  const unidad = listaEfectiva.find((u) => u.id_unidad === id || String(u.id) === id)

  useEffect(() => {
    if (!unidades || unidades.length === 0) {
      getUnidades().then(setUnidadesLocales).catch(() => {})
    }
  }, [unidades])

  useEffect(() => {
    if (!unidad) return
    void getFicha(unidad.id).then(setFicha)
  }, [unidad])

  if (!ficha) {
    return (
      <div className="p-8 text-center text-xs text-[#B8B2A6] animate-pulse font-['Barlow_Condensed'] uppercase tracking-wider">
        Cargando expediente y ficha técnica de la unidad...
      </div>
    )
  }

  const ft = ficha.unidad
  const esYonke = ft.estado === 'Yonke'
  const fc = estadoUnidadColors[ft.estado] ?? estadoUnidadColors.Activo

  const fichaKpis = [
    { label: 'Gasto Diésel', valor: fmt(ficha.kpis.diesel) },
    { label: 'Gasto Refacciones', valor: fmt(ficha.kpis.refacciones) },
    { label: 'Gasto Taller', valor: fmt(ficha.kpis.taller) },
    { label: 'Valor estimado de la unidad', valor: ft.valor_referencia ? fmt(ft.valor_referencia) : '—' },
  ]

  const selloEstimado = (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: '#FDE8DC', color: '#B4430A', border: '1px dashed #C5A059', borderRadius: 5, padding: '3px 8px' }}>
      Estimado
    </span>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="hv-borde-naranja"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '9px 14px', fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
        >
          ← Tablero
        </button>
        <h2 style={h2Titulo}>Ficha · {ft.id_unidad}</h2>
        <span style={{ ...badge(fc[0], fc[1], fc[2]), fontSize: 13, padding: '5px 14px' }}>{ft.estado}</span>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontFamily: FD, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Costo total acumulado
          </div>
          <div style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {fmt(ficha.kpis.costo_real_acumulado)}
          </div>
        </div>
      </div>

      {!esYonke && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, animation: 'fadeUp 0.4s ease' }}>
            {fichaKpis.map((k) => (
              <div key={k.label} style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 2px rgba(20,24,29,0.05)' }}>
                <div style={{ fontFamily: FD, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{k.label}</div>
                <div style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{k.valor}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ ...h3Titulo, margin: '0 0 14px' }}>Historial de reparaciones</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr style={theadRow}>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Ingreso</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Diagnóstico</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Criticidad</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Liberación</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Días en taller</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Costo taller</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.reparaciones.map((r, i) => (
                    <tr key={r.fecha_ingreso + '-' + i} className="hv-fila">
                      <td style={{ ...tdCell, padding: 10, whiteSpace: 'nowrap' }}>{r.fecha_ingreso}</td>
                      <td style={{ ...tdCell, padding: 10, fontWeight: 600 }}>
                        {r.diagnostico}
                        {r.es_reincidencia && (
                          <span style={{ marginLeft: 8 }}>
                            <span style={badge('#FDE8DC', '#B4430A', '#C5A059')}>Reincidencia</span>
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdCell, padding: 10 }}>
                        <span style={critStyle(r.criticidad)}>{r.criticidad}</span>
                      </td>
                      <td style={{ ...tdCell, padding: 10 }}>
                        {r.tipo_liberacion === null ? (
                          <span style={badge('#EAE6DC', '#4A4438', '#C9C2B2')}>En taller</span>
                        ) : (
                          <span style={r.tipo_liberacion === 'Total' ? badge('#E5F3E9', '#2C7A44', '#9FD4B0') : badge('#FDE8DC', '#B4430A', '#C5A059')}>
                            {r.tipo_liberacion === 'Total' ? 'Total' : 'Mejoralito'}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdCell, padding: 10, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: (r.dias_en_taller ?? 0) >= 30 ? 700 : 400 }}>
                        {r.dias_en_taller === null ? '—' : r.dias_en_taller + (r.dias_en_taller === 1 ? ' día' : ' días')}
                      </td>
                      <td style={{ ...tdCell, padding: 10, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(r.costo_taller)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ficha.reparaciones.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
                  Sin reparaciones registradas para esta unidad.
                </div>
              )}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ ...h3Titulo, margin: '0 0 4px' }}>Piezas instaladas</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)' }}>
              Las piezas de Yonke llevan costo <em>estimado</em>: es una asignación interna, no una factura.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ficha.piezas_instaladas.map((q, i) => (
                <div key={q.descripcion_pieza + '-' + i} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: '1px solid #EFEAE0', borderRadius: 10, padding: '12px 16px' }}>
                  <span style={q.origen === 'Yonke' ? badge('#FDE8DC', '#B4430A', '#C5A059') : badge('#EAE6DC', '#16191E', '#C9C2B2')}>
                    {q.origen}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14.5 }}>{q.descripcion_pieza}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {q.origen === 'Yonke' ? 'donada por ' + (q.unidad_donante_id ?? '—') : 'compra a proveedor'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: FD, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>
                      {q.costo !== null ? fmt(q.costo) : 'Pendiente'}
                    </span>
                    {q.es_estimado && selloEstimado}
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {q.estado} · {q.fecha}
                  </span>
                </div>
              ))}
              {ficha.piezas_instaladas.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
                  Sin piezas registradas para esta unidad.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {esYonke && (
        <div style={card}>
          <h3 style={{ ...h3Titulo, margin: '0 0 4px' }}>Piezas donadas a otras unidades</h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)' }}>
            Esta unidad es donante del yonke interno. Cada pieza que sale lleva un costo estimado asignado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ficha.piezas_donadas.map((q, i) => (
              <div key={q.descripcion_pieza + '-' + i} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: '1px solid #EFEAE0', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{q.descripcion_pieza}</span>
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                  → instalada en <strong style={{ color: 'var(--accent-gold)' }}>{q.unidad_destino}</strong>
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FD, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>
                    {fmt(q.costo_estimado)}
                  </span>
                  {selloEstimado}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{q.fecha}</span>
              </div>
            ))}
            {ficha.piezas_donadas.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 28, color: 'var(--text-muted)', fontSize: 14 }}>
                <Camion stroke="#16191E" strokeWidth={3} style={{ width: 120, opacity: 0.35 }} />
                Aún no hay piezas donadas registradas de esta unidad.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
