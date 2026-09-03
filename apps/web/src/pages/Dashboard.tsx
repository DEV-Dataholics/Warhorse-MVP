import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { Truck, Droplets, Wrench, Wallet, ShieldAlert, ArrowRight } from 'lucide-react'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { ApiError, ajustarParametros, getDashboard, type DashboardApi, type Veredicto } from '../lib/api'
import { useDemo } from '../lib/demo'
import { card, FD, fmt, h2Titulo, h3Titulo, subTitulo } from '../lib/estilos'

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', color: 'var(--text-main)', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }

// Presentación del veredicto server-side (RF-DASH-04)
const veredictoUi: Record<Veredicto | 'pendiente', { label: string; color: string; bgFranja: string }> = {
  Vender: { label: 'Vender / dar de baja', color: '#EF4444', bgFranja: '#EF4444' },
  Evaluar: { label: 'Evaluar', color: 'var(--accent-gold)', bgFranja: '#C5A059' },
  Mantener: { label: 'Mantener', color: '#4ADE80', bgFranja: '#4ADE80' },
  pendiente: { label: 'Valor pendiente', color: 'var(--text-muted)', bgFranja: 'transparent' },
}

export default function Dashboard() {
  const { selTractoId, setSelTractoId, toast } = useDemo()
  const navigate = useNavigate()
  const [dash, setDash] = useState<DashboardApi | null>(null)
  
  const [cargando, setCargando] = useState(true)
  const [ajustar, setAjustar] = useState(false)
  const [umbralForm, setUmbralForm] = useState('')
  const [ventanaForm, setVentanaForm] = useState('')
  const [errorModal, setErrorModal] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [tipoUnidad, setTipoUnidad] = useState('Todos')

  const cargar = useCallback(async (seleccion: string, tipo: string, desde: string, hasta: string) => {
    setCargando(true)
    
    try {
      setDash(await getDashboard(seleccion || undefined, tipo === 'Todos' ? undefined : tipo, desde || undefined, hasta || undefined))
    } catch (e) {
      
      setDash(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar(selTractoId, tipoUnidad, fechaDesde, fechaHasta)
  }, [cargar, selTractoId, tipoUnidad, fechaDesde, fechaHasta])

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando tablero...</div>

  const kpis = !dash ? [] : [
    { label: 'Gasto Diésel', valor: fmt(dash.kpis.diesel), sub: 'Histórico cargado · ' + dash.ranking.length + ' tractos', Icon: Droplets },
    { label: 'Gasto Refacciones', valor: fmt(dash.kpis.refacciones), sub: 'Incluye piezas de yonke estimadas', Icon: Truck },
    { label: 'Gasto Taller', valor: fmt(dash.kpis.taller), sub: 'Mano de obra y diagnóstico', Icon: Wrench },
    { label: 'Costo Real Acumulado', valor: fmt(dash.kpis.costo_real_acumulado), sub: 'Diésel + refacciones + taller', Icon: Wallet },
  ]

  // Barras en el orden de flota del demo; el ranking del server marca la crítica
  const barras = dash ? dash.ranking.slice().sort((a, b) => a.id_unidad.localeCompare(b.id_unidad)) : []
  const maxCosto = dash && dash.ranking.length > 0 ? Math.max(1, ...dash.ranking.map((t) => t.costo_total)) : 1
  const sel = dash?.seleccion

  const ef = sel?.eficiencia_km_l ?? null
  const gaugeDeg = ef === null ? -90 : Math.round((Math.min(3, Math.max(0, ef)) / 3) * 180 - 90)

  const pctTotal = sel?.pct_reparacion_total ?? 100
  const donutC = 2 * Math.PI * 45
  const donutDash = ((pctTotal / 100) * donutC).toFixed(1) + ' ' + donutC.toFixed(1)

  const ui = veredictoUi[sel?.veredicto ?? 'pendiente']

  const abrirAjuste = () => {
    setErrorModal('')
    if (dash) setUmbralForm(String(dash.parametros.umbral_pct))
    if (dash) setVentanaForm(String(dash.parametros.ventana_meses))
    setAjustar(true)
  }

  const guardarAjuste = async () => {
    setErrorModal('')
    try {
      await ajustarParametros({ umbral_pct: Number(umbralForm), ventana_meses: Number(ventanaForm) })
      setAjustar(false)
      toast('Parámetros actualizados — veredictos recalculados.')
      await cargar(selTractoId, tipoUnidad, fechaDesde, fechaHasta)
    } catch (e) {
      if (e instanceof ApiError) {
        const campos = e.fields ? Object.values(e.fields).flat() : []
        setErrorModal(campos[0] ?? e.message)
      } else {
        setErrorModal('No se pudieron guardar los parámetros.')
      }
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Dirección" />
          <h2 style={h2Titulo}>Tablero Directivo</h2>
          <p style={subTitulo}>¿Vale la pena meterle más lana a este tracto? Haz clic en una barra para analizarlo.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 9, padding: '12px 16px', fontSize: 13.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Desde:</span>
            <input type="date" style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 13 }} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Hasta:</span>
            <input type="date" style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 13 }} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Tipo:</span>
            <select style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 13, background: 'var(--bg-input)' }} value={tipoUnidad} onChange={(e) => setTipoUnidad(e.target.value)}>
              <option>Todos</option>
              <option>Tractor</option>
              <option>Caja</option>
              <option>Thermo</option>
              <option>Servicio</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'none', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 9, padding: '9px 16px', fontSize: 14 }}>
          Periodo:{' '}
          <strong style={{ fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>JULIO 2026</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>▾</span>
        </div>
      </div>

      <div data-tour="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, animation: 'fadeUp 0.4s ease' }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 10px 30px -10px rgba(197, 160, 89, 0.15)', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{k.label}</span>
              <k.Icon size={18} color="#C5A059" style={{ opacity: 0.8 }} />
            </div>
            <span style={{ fontFamily: FD, fontSize: 38, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-main)', lineHeight: 1 }}>{k.valor}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{k.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'stretch', animation: 'fadeUp 0.45s ease' }}>
        <div data-tour="barras" style={{ ...card, gridColumn: '1/-1', overflow: 'hidden', minWidth: 0, maxWidth: '100%', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, margin: '0 0 18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={h3Titulo}>Gasto consolidado por tracto</h3>
              <Ayuda tip="Suma de diésel + refacciones + taller por unidad en el periodo. Clic en una barra o selecciónala en el buscador para analizarla." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Analizar Unidad:</span>
              <select
                style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 7, fontSize: 13, background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', fontWeight: 600 }}
                value={sel?.id_unidad ?? ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelTractoId(e.target.value)
                  }
                }}
              >
                <option value="">Selecciona una unidad...</option>
                {barras.map((b) => (
                  <option key={b.id} value={b.id_unidad}>
                    {b.id_unidad} ({fmt(b.costo_total)})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, height: 222, width: '100%', minWidth: 0, padding: '10px 2px 12px 2px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)', overflow: 'hidden' }}>
              {barras.map((t) => {
                const esSel = t.id_unidad === sel?.id_unidad
                const h = Math.max(8, Math.round((t.costo_total / maxCosto) * 140))
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelTractoId(t.id_unidad)}
                    title={'Analizar ' + t.id_unidad}
                    className="hv-op85"
                    style={{ flex: '1 1 0', minWidth: 0, maxWidth: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', height: '100%' }}
                  >
                    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontFamily: FD, fontSize: 10.5, lineHeight: 1.1, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {fmt(t.costo_total)}
                    </span>
                    <span
                      style={{
                        width: '100%', maxWidth: 24, minWidth: 12, height: h, borderRadius: '4px 4px 0 0',
                        background: t.critico ? '#C5A059' : 'rgba(255,255,255,0.1)',
                        outline: esSel ? '2px solid #C5A059' : 'none', outlineOffset: 2,
                        transition: 'all 0.3s ease', transformOrigin: 'bottom', animation: 'growBar 0.5s ease',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: FD, fontSize: 10.5, fontWeight: esSel ? 700 : 600, letterSpacing: '0.03em',
                        color: esSel ? '#C5A059' : '#6F6A60',
                        borderBottom: esSel ? '3px solid #C5A059' : '3px solid transparent', paddingBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                      }}
                    >
                      {t.id_unidad}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={h3Titulo}>Rendimiento · {sel?.id_unidad ?? '—'}</h3>
            <Ayuda tip="Kilómetros por litro reales, calculados de las cargas de diésel dentro de la ventana. Zona verde = eficiente; naranja = revisar operación o motor." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <svg viewBox="0 0 200 120" style={{ width: 'min(240px,100%)' }} role="img" aria-label={ef === null ? 'Sin cargas de diésel en la ventana' : `Eficiencia: ${ef.toFixed(1)} kilómetros por litro`}>
              <path d="M 24 104 A 76 76 0 0 1 62 38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" strokeLinecap="round" />
              <path d="M 62 38 A 76 76 0 0 1 138 38" fill="none" stroke="#C5A059" strokeWidth="14" strokeLinecap="round" />
              <path d="M 138 38 A 76 76 0 0 1 176 104" fill="none" stroke="#4ADE80" strokeWidth="14" strokeLinecap="round" />
              <line x1="100" y1="104" x2="100" y2="42" stroke="#f3f4f6" strokeWidth="4" strokeLinecap="round" transform={`rotate(${gaugeDeg} 100 104)`} style={{ transition: 'transform 0.5s ease' }} />
              <circle cx="100" cy="104" r="7" fill="#f3f4f6" />
            </svg>
            <div style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {ef === null ? '—' : ef.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>km/L</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {ef === null ? 'Sin cargas de diésel en la ventana' : 'Costo diésel vs. kilómetros recorridos'}
            </div>
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={h3Titulo}>Mantenimiento · {sel?.id_unidad ?? '—'}</h3>
            <Ayuda tip='Proporción de reparaciones liberadas "en su totalidad" vs. "mejoralito" (parches). Mucho mejoralito = unidad reincidente.' />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
            <svg viewBox="0 0 120 120" style={{ width: 130, flex: 'none' }} role="img" aria-label={`Mantenimiento: ${pctTotal}% reparación total, ${100 - pctTotal}% mejoralito`}>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#C5A059" strokeWidth="18" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#4ADE80" strokeWidth="18" strokeDasharray={donutDash} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
              <text x="60" y="68" textAnchor="middle" style={{ fontFamily: FD, fontWeight: 700, fontSize: 24 }} fill="#f3f4f6">
                {pctTotal}%
              </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#4ADE80' }} />
                Reparación Total · {pctTotal}%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-gold)' }} />
                Mejoralito · {100 - pctTotal}%
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 200 }}>
                Calculado del historial de reparaciones liberadas.
              </div>
            </div>
          </div>
        </div>

        <div
          data-tour="decision"
          style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', position: 'relative', border: '1px solid ' + ui.bgFranja }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <ShieldAlert size={16} color={ui.color} />
            <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: ui.color }}>
              Decisión sugerida · {sel?.id_unidad ?? '—'}
            </div>
            <div style={{ marginLeft: 'auto' }}><Ayuda tip="Regla: si el costo acumulado supera el % umbral del valor de la unidad, el Hub sugiere evaluar o vender." /></div>
          </div>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 36, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.02em', color: ui.color }}>
            {ui.label}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--text-main)', lineHeight: 1.55 }}>{sel?.razon ?? 'Sin unidades activas que analizar.'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              onClick={() => navigate('/catalogo')}
              className="hv-op85"
              style={{ padding: '11px 20px', background: 'linear-gradient(135deg, #C5A059 0%, #9A7B3E 100%)', color: '#000', border: 'none', borderRadius: 9, fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Revisar unidades <ArrowRight size={18} />
            </button>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-muted)' }}>
              Umbral {dash?.parametros?.umbral_pct || 0}% · Ventana {dash?.parametros?.ventana_meses || 0} meses
              <button
                onClick={abrirAjuste}
                className="hv-op85"
                style={{ background: 'transparent', border: '1px solid rgba(197, 160, 89, 0.5)', borderRadius: 7, padding: '7px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--accent-gold)', cursor: 'pointer' }}
              >
                Ajustar parámetros
              </button>
            </span>
          </div>
        </div>
      </div>

      {ajustar && (
        <div
          onClick={() => setAjustar(false)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Ajustar parámetros"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 440, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 10px' }}>
              Ajustar parámetros
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--text-muted)' }}>
              El veredicto se recalcula al instante para toda la flota (RF-DASH-05). El cambio queda auditado.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Umbral (%)
                <input type="number" min={20} max={80} style={campo} value={umbralForm} onChange={(e) => setUmbralForm(e.target.value)} />
              </label>
              <label style={etiqueta}>
                Ventana (meses)
                <input type="number" min={1} max={36} style={campo} value={ventanaForm} onChange={(e) => setVentanaForm(e.target.value)} />
              </label>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Umbral permitido: 20–80%. Ventana permitida: 1–36 meses.
            </p>
            {errorModal && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {errorModal}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setAjustar(false)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void guardarAjuste()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
