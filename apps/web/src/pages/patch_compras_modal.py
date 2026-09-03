import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Compras.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_state = """    const [motivoReversion, setMotivoReversion] = useState('')
    const [costoReal, setCostoReal] = useState('')
    const [factura, setFactura]   = useState('')"""
s_state_new = """    const [motivoReversion, setMotivoReversion] = useState('')
    const [costoReal, setCostoReal] = useState('')
    const [factura, setFactura]   = useState('')
    const [proveedor, setProveedor] = useState('')
    const [esCajaChica, setEsCajaChica] = useState(false)"""

if "setProveedor" not in content:
    content = content.replace(s_state, s_state_new)

s_registrar = """      try {
        await avanzarEstatus(comprar.id, {
          estado: 'Comprado',
          costo_real: Number(costoReal),
          numero_factura: factura || undefined,
          origen_refaccion: origenRefaccion,
          archivo_factura: archivoFactura,
        })"""
s_registrar_new = """      try {
        await avanzarEstatus(comprar.id, {
          estado: 'Comprado',
          costo_real: Number(costoReal),
          numero_factura: factura || undefined,
          proveedor: proveedor || undefined,
          es_caja_chica: esCajaChica ? 1 : 0,
          origen_refaccion: origenRefaccion,
          archivo_factura: archivoFactura,
        })"""

if "proveedor: proveedor || undefined" not in content:
    content = content.replace(s_registrar, s_registrar_new)
    
s_modal_clear = """              setCostoReal('')
              setFactura('')
              setArchivoFactura(null)
              setComprar(q)"""
s_modal_clear_new = """              setCostoReal('')
              setFactura('')
              setArchivoFactura(null)
              setProveedor('')
              setEsCajaChica(false)
              setComprar(q)"""

if "setProveedor('')" not in content:
    content = content.replace(s_modal_clear, s_modal_clear_new)

s_form = """                <label style={etiqueta}>
                  Costo Real (MXN)
                  <input type="number" min={0} style={campo} value={costoReal} onChange={(e) => setCostoReal(e.target.value)} />
                </label>"""
s_form_new = """                <label style={etiqueta}>
                  Proveedor
                  <input type="text" placeholder="Ej. AutoZone, Refaccionaria X" style={campo} value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: -5, marginBottom: 5 }}>
                  <input type="checkbox" checked={esCajaChica} onChange={(e) => setEsCajaChica(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#C5A059' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#16191E' }}>Gasto de Caja Chica</span>
                </div>
                <label style={etiqueta}>
                  Costo Real (MXN)
                  <input type="number" min={0} style={campo} value={costoReal} onChange={(e) => setCostoReal(e.target.value)} />
                </label>"""

if "Proveedor" not in content:
    content = content.replace(s_form, s_form_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Compras.tsx modal")
