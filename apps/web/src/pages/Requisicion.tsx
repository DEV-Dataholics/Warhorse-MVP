import { useState, useEffect, type CSSProperties } from 'react'
import { useWizardStore } from '../store/wizardStore'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { crearRequisicion, getArticulosAlmacen, getOrdenesTrabajo, getRequisiciones, type ArticuloAlmacenApi, type OrdenTrabajoApi, type RequisicionApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { FD, h2Titulo, subTitulo, urgColors } from '../lib/estilos'
import type { Origen, Urgencia } from '../lib/types'

const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }
const ayudaCampo: CSSProperties = { fontSize: 12.5, fontWeight: 400, color: 'var(--text-muted)' }

export default function Requisicion() { 
  const { unidades, toast } = useDemo()
  const [destino, setDestino] = useState('')
  const [destinoInput, setDestinoInput] = useState('')
  const [origen, setOrigen] = useState<Origen>('Compra')
  const [donante, setDonante] = useState('')
  const [pieza, setPieza] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [costo, setCosto] = useState('')
  const [urgencia, setUrgencia] = useState<Urgencia>('Medio')
  const [numeroParte, setNumeroParte] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [paraInventario, setParaInventario] = useState(false)
  const [origenRefaccion, setOrigenRefaccion] = useState('')
  const [almacen, setAlmacen] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const { compras, agregarItemCompra, removerItemCompra, clearCompras, setOtId } = useWizardStore()
  const ordenTrabajoId = compras.otId || ''
  const setOrdenTrabajoId = setOtId
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajoApi[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [articulos, setArticulos] = useState<ArticuloAlmacenApi[]>([])
  const [selArticuloId, setSelArticuloId] = useState('')
  const [categoriaSel, setCategoriaSel] = useState('')
  
  const carrito = compras.items
  const [historial, setHistorial] = useState<RequisicionApi[]>([])

  useEffect(() => {
    getArticulosAlmacen().then(setArticulos).catch(() => {})
    getOrdenesTrabajo().then(setOrdenesTrabajo).catch(() => {})
    getRequisiciones().then(setHistorial).catch(() => {})
  }, [])

  // Catálogo VIVO (RF-UNI-01): los selectores leen de la API, no del mock
  const destinoOpts = unidades.filter((t) => t.estado === 'Activo')
  const donanteOpts = unidades.filter((t) => t.estado === 'Yonke')
  const esYonke = origen === 'Yonke'

  const limpiarError = () => setError('')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files)
      if (fotos.length + files.length > 3) {
        setError('La carga de evidencias está limitada a un máximo de 3 fotografías.')
        return
      }
      setFotos((prev) => [...prev, ...files])
      limpiarError()
    }
  }


  const agregarAlCarrito = () => {
    const esInventario = origen === 'Inventario'
    if (!paraInventario && !destino) return setError('Selecciona el tracto destino.')
    
    let descripcionPieza = pieza.trim()
    let sku = numeroParte.trim() || null
    let piezaCatId: number | null = selArticuloId ? Number(selArticuloId) : null

    if (esInventario) {
      if (!selArticuloId) return setError('Selecciona el artículo del inventario.')
      const art = articulos.find(a => String(a.id) === selArticuloId)
      if (!art) return setError('Artículo de catálogo inválido.')
      if (art.stock_actual <= 0) return setError('No hay stock disponible en almacén para este artículo.')
      descripcionPieza = art.nombre_normalizado
      sku = art.numero_parte
      piezaCatId = art.id
    } else {
      if (!descripcionPieza) return setError('Describe la pieza solicitada.')
      if (descripcionPieza.length > 350) return setError('La descripción de la pieza no puede exceder los 350 caracteres.')
      if (esYonke && !donante) return setError('El origen Yonke obliga a registrar la unidad donante.')
    }
    
    if (fotos.length === 0) return setError('La foto de la pieza o etiqueta del VIN es obligatoria.')
    if (fotos.length > 3) return setError('La carga de evidencias está limitada a un máximo de 3 fotografías.')

    const item = {
      unidad_destino_id: paraInventario ? null : Number(destino),
      origen,
      unidad_donante_id: esYonke ? Number(donante) : null,
      pieza_catalogo_id: piezaCatId,
      descripcion_pieza: descripcionPieza,
      cantidad: cantidad === '' ? 1 : Number(cantidad),
      numero_parte: sku,
      urgencia,
      costo_estimado_manual: costo === '' ? null : Number(costo),
      fotos: [...fotos],
      origen_refaccion: origenRefaccion.trim() || undefined,
      almacen: almacen.trim() || undefined,
      numero_serie: numeroSerie.trim() || undefined,
      orden_trabajo_id: ordenTrabajoId === '' ? null : Number(ordenTrabajoId),
      display_pieza: descripcionPieza,
      display_destino: destinoInput
    }

    agregarItemCompra(item)
    toast('Pieza agregada al carrito.')
    setPieza('')
    setCantidad('1')
    setFotos([])
    setSelArticuloId('')
    setError('')
  }

  const enviar = async () => {
    if (carrito.length === 0) return setError('El carrito está vacío.')
    setEnviando(true)
    try {
      for (const item of carrito) {
        await crearRequisicion(item)
      }
      setDestino(''); setDestinoInput(''); setDonante(''); setPieza(''); setCantidad('1'); setCosto(''); setUrgencia('Medio'); setNumeroParte(''); setOrigen('Compra'); setFotos([]); setError(''); setOrigenRefaccion(''); setAlmacen(''); setNumeroSerie(''); setParaInventario(false); setSelArticuloId(''); setOrdenTrabajoId('')
      clearCompras()
      toast('Requisiciones enviadas â€” Compras las verá en su panel.')
      getRequisiciones().then(setHistorial).catch(() => {})
    } catch (e) {
      setError('No se pudieron enviar todas las requisiciones.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp 0.35s ease' }}>
      <div>
        <Kicker texto="Piso de taller" />
        <h2 style={h2Titulo}>Requisición de refacciones</h2>
        <p style={subTitulo}>Solicitud completa con foto y origen de la pieza, para que Compras no tenga que pedir más datos.</p>
      </div>
      <div data-tour="reqform" style={{ background: 'var(--bg-card)', border: '1px solid #E7E0D2', borderRadius: 14, padding: 26, boxShadow: '0 1px 2px rgba(20,24,29,0.05)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Nullable Destination trigger */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', fontSize: 14, fontWeight: 700, color: '#16191E' }}>
          <input
            type="checkbox"
            checked={paraInventario}
            onChange={(e) => {
              setParaInventario(e.target.checked)
              if (e.target.checked) setDestino('')
              limpiarError()
            }}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#F2620F' }}
          />
          📦 Agregar directamente al inventario general del almacén
        </label>

          {!paraInventario && (
            <label style={etiqueta}>
              Tracto destino
              <input
                list="tractos-list"
                placeholder="Escribe VIN o ID para buscar..."
                value={destinoInput}
                onChange={(e) => {
                  setDestinoInput(e.target.value)
                  const matched = destinoOpts.find(t => t.vin === e.target.value || t.id_unidad === e.target.value || ((t.vin || t.id_unidad) + ' — ' + (t.tipo === 'Servicio' ? 'UTILITARIO' : t.tipo)) === e.target.value)
                  if (matched) setDestino(String(matched.id))
                  else setDestino('')
                  limpiarError()
                }}
                style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%', boxSizing: 'border-box' }}
              />
              <datalist id="tractos-list">
                {destinoOpts.map((t) => (
                  <option key={t.id} value={(t.vin || t.id_unidad) + ' — ' + (t.tipo === 'Servicio' ? 'UTILITARIO' : t.tipo)} />
                ))}
              </datalist>
            </label>
          )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <label style={etiqueta}>
            Tipo de Origen
            <span style={ayudaCampo}>¿Cómo se resolverá esta requisición?</span>
            <select
              value={origen}
              onChange={(e) => {
                setOrigen(e.target.value as Origen)
                setError('')
              }}
              style={{ padding: '10px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14 }}
            >
              <option value="Compra">Compra Nueva</option>
              <option value="Inventario">Tomar de Inventario (Stock)</option>
              <option value="Yonke">Extraer de Yonke</option>
            </select>
          </label>
          <label style={etiqueta}>
            Orden de Trabajo (Folio de Taller) *
              <span style={ayudaCampo}>Toda requisición debe pertenecer a una OT (Gatekeeper)</span>
            <select
              value={ordenTrabajoId}
              onChange={(e) => setOrdenTrabajoId(e.target.value)}
              style={{ padding: '10px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14 }}
            >
              <option value="">-- Selecciona una Orden de Trabajo --</option>
              {ordenesTrabajo.filter(ot => ot.estado === 'Activa').map((ot) => (
                <option key={ot.id} value={ot.id}>
                  {ot.folio} - {(ot.unidad?.id_unidad || `Unidad ${ot.unidad?.id || '?'}`)} ({ot.diagnostico})
                </option>
              ))}
            </select>
          </label>
        </div>

        {esYonke && (
          <div style={{ background: '#FDF3EC', border: '1px dashed #F2620F', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={etiqueta}>
              Tracto donante (obligatorio)
              <select
                value={donante}
                onChange={(e) => { setDonante(e.target.value); limpiarError() }}
                style={{ padding: 12, border: '1px solid #F0C4A4', borderRadius: 9, fontSize: 15, background: 'var(--bg-card)' }}
              >
                <option value="">Selecciona unidad Yonkeâ€¦</option>
                {donanteOpts.map((t) => (
                  <option key={t.id} value={String(t.id)}>{(t.vin || t.id_unidad) + ' · Yonke donante'}</option>
                ))}
              </select>
              <span style={ayudaCampo}>Solo unidades con estado Yonke pueden donar piezas.</span>
            </label>
            <label style={etiqueta}>
              Costo estimado o Valor de mercado (MXN)
              <input
                type="number"
                value={costo}
                onChange={(e) => { setCosto(e.target.value); limpiarError() }}
                placeholder="0.00"
                min={0}
                style={{ padding: 12, border: '1px solid #F0C4A4', borderRadius: 9, fontSize: 15, background: 'var(--bg-card)' }}
              />
              <span style={ayudaCampo}>
                Registra el costo referencial o valor comercial estimado de esta pieza.
              </span>
            </label>
          </div>
        )}

        

        {origen === 'Inventario' ? (
          <label style={etiqueta}>
            VIN (Identificador Único)
            <input
              type="text"
              value={numeroSerie}
              onChange={(e) => { setNumeroSerie(e.target.value); limpiarError() }}
              placeholder="Ej. SN-98234-XYZ"
              style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
            />
          </label>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                VIN (Identificador Único)
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => { setNumeroSerie(e.target.value); limpiarError() }}
                  placeholder="Ej. SN-98234-XYZ"
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                />
              </label>
                <label style={etiqueta}>
                  Número de Parte / SKU (Opcional)
                  <input
                    type="text"
                    value={numeroParte}
                    onChange={(e) => { setNumeroParte(e.target.value); limpiarError() }}
                    placeholder="Opcional"
                    style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                  />
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 14 }}>
              <label style={etiqueta}>
                Categoría (Filtro)
                <select
                  value={categoriaSel}
                  onChange={(e) => setCategoriaSel(e.target.value)}
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                >
                  <option value="">-- Todas --</option>
                  <option value="Frenos">Frenos</option>
                  <option value="Suspensión">Suspensión</option>
                  <option value="Preventivos">Preventivos</option>
                  <option value="Filtros">Filtros</option>
                  <option value="Aceites">Aceites</option>
                  <option value="Otros">Otros</option>
                </select>
              </label>
              <label style={etiqueta}>
                Pieza (Catálogo)
                <input
                  list="piezas-list"
                  type="text"
                  value={pieza}
                  maxLength={350}
                  onChange={(e) => {
                    setPieza(e.target.value)
                    const matched = articulos.find(a => a.nombre_normalizado === e.target.value)
                    if (matched) {
                      setSelArticuloId(String(matched.id))
                      if (matched.numero_parte) setNumeroParte(matched.numero_parte)
                    } else {
                      setSelArticuloId('')
                    }
                    limpiarError()
                  }}
                  placeholder="Busca en el catálogo..."
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                />
                <datalist id="piezas-list">
                  {articulos.filter(a => !categoriaSel || a.categoria === categoriaSel).map(a => (
                    <option key={a.id} value={a.nombre_normalizado} />
                  ))}
                </datalist>
              </label>

              <label style={etiqueta}>
                Cantidad
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', textAlign: 'center' }}
                />
              </label>
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
            Evidencias Fotográficas <span style={{ color: '#F2620F' }}>*</span>
            <Ayuda tip="Obligatoria: hasta un máximo de 3 fotografías de la pieza o su VIN." />
          </span>
          <input
            id="foto-pieza"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (fotos.length + files.length > 3) {
                setError('La carga de evidencias está limitada a un máximo de 3 fotografías.')
                return
              }
              setFotos((prev) => [...prev, ...files])
              limpiarError()
            }}
          />
          <label
            htmlFor="foto-pieza"
            className="hv-borde-naranja-solo"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: '2px dashed ' + (fotos.length > 0 ? '#3FA65C' : (dragOver ? '#F2620F' : '#C9C2B2')),
              background: fotos.length > 0 ? '#F0F7F1' : (dragOver ? '#FDF3EC' : '#FAF7F0'),
              borderRadius: 10, padding: 24, cursor: 'pointer', textAlign: 'center', width: '100%', display: 'block',
              transition: 'all 0.25s ease'
            }}
          >
            {fotos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fotos.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--bg-card)', border: '1px solid #D8D2C4', borderRadius: 8, padding: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={URL.createObjectURL(f)} alt="preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #D8D2C4' }} />
                      <span style={{ fontSize: 13.5, color: '#16191E', fontWeight: 600 }}>{f.name} ({Math.round(f.size/1024)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setFotos((prev) => prev.filter((_, idx) => idx !== i))
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#C53030', fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {fotos.length < 3 && <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>+ Agregar otra fotografía (máx. 3)</span>}
              </div>
            ) : (
              <span style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>📷 Toca para adjuntar fotografía (máx. 3)</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>o arrastra y suelta tu archivo aquí (Drag and Drop)</span>
              </span>
            )}
          </label>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            La foto evita compras a ciegas: Compras ve la pieza o su etiqueta o VIN exacto.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Urgencia</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['Bajo', 'Medio', 'Crítico', 'Inmediato'] as const).map((u) => {
              const act = urgencia === u
              const c = urgColors[u]
              return (
                <button
                  key={u}
                  onClick={() => setUrgencia(u)}
                  className="hv-op85"
                  style={{
                    padding: '10px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: act ? c[0] : '#fff', color: act ? c[1] : '#6F6A60',
                    border: act ? '2px solid ' + c[2] : '1px solid #D8D2C4',
                  }}
                >
                  {u}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => void agregarAlCarrito()}
            disabled={enviando}
            className="hv-naranja"
            style={{ flex: 1, padding: 15, background: 'var(--bg-glass)', border: '2px solid #F2620F', color: '#F2620F', borderRadius: 10, fontFamily: FD, fontWeight: 700, fontSize: 17, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            + Agregar al carrito
          </button>
          <button
            onClick={() => void enviar()}
            disabled={enviando || carrito.length === 0}
            className="hv-naranja"
            style={{ flex: 1, padding: 15, background: '#F2620F', color: '#fff', border: 'none', borderRadius: 10, fontFamily: FD, fontWeight: 700, fontSize: 19, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: (enviando || carrito.length === 0) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(242,98,15,0.3)', opacity: (enviando || carrito.length === 0) ? 0.6 : 1 }}
          >
            {enviando ? 'Enviando...' : `Enviar (${carrito.length})`}
          </button>
        </div>

        {carrito.length > 0 && (
          <div style={{ background: '#FDF3EC', padding: 16, borderRadius: 10, marginTop: 10 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 15 }}>🛒 Carrito de Piezas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {carrito.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: 'var(--bg-card)', padding: 10, borderRadius: 6, border: '1px solid #F0C4A4' }}>
                  <div>
                    <strong>{item.cantidad}x {item.display_pieza}</strong>
                    <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Urgencia: {item.urgencia} | Origen: {item.origen}</div>
                  </div>
                  <button onClick={() => removerItemCompra(idx)} style={{ background: 'transparent', border: 'none', color: '#C53030', cursor: 'pointer' }}>❌</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div role="alert" style={{ background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      {/* Historial de Requisiciones para el Taller */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid #E7E0D2', borderRadius: 14, padding: 26, boxShadow: '0 1px 2px rgba(20,24,29,0.05)', marginTop: 20 }}>
        <h3 style={{ ...h2Titulo, fontSize: 22, margin: '0 0 16px' }}>Historial de Requisiciones</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#FAF7F0', borderBottom: '2px solid #E7E0D2' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Folio</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Pieza</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Unidad</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {historial.slice(0, 10).map(req => (
              <tr key={req.id} style={{ borderBottom: '1px solid #E7E0D2' }}>
                <td style={{ padding: 12, fontWeight: 600 }}>REQ-{req.id}</td>
                <td style={{ padding: 12 }}>{req.descripcion_pieza} ({req.cantidad})</td>
                <td style={{ padding: 12 }}>{req.unidad?.id_unidad || 'N/A'}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 6, background: req.estado === 'Aprobada' ? '#E6F4EA' : '#FDF3EC', color: req.estado === 'Aprobada' ? '#1E8E3E' : '#B4430A', fontWeight: 600, fontSize: 13 }}>
                    {req.estado}
                  </span>
                </td>
              </tr>
            ))}
            {historial.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No hay requisiciones recientes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
