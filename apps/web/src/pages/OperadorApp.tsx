import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDemo } from '../lib/demo'
import { useWizardStore } from '../store/wizardStore'
import OfflineIndicator, { useIsOffline } from '../components/OfflineIndicator'

const API_URL = '/api/v1'

const colors = {
  bg: '#FFFFFF',
  text: '#000000',
  textMuted: '#4B5563',
  primary: '#0056D2',
  primaryHover: '#003E99',
  success: '#0F7031',
  danger: '#B91C1C',
  border: '#9CA3AF',
  card: '#F9FAFB'
}

const inspeccionSchema = z.object({
  unidad_str: z.string().min(1, 'La unidad es obligatoria'),
  kilometraje: z.string().optional(),
  combustible: z.string().optional(),
  falla_luces: z.boolean(),
  falla_frenos: z.boolean(),
  falla_llantas: z.boolean(),
  falla_motor: z.boolean(),
  falla_otros: z.boolean(),
  otros_observacion: z.string().optional()
}).refine(data => {
  if (data.falla_otros && (!data.otros_observacion || data.otros_observacion.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'La descripción es obligatoria si marcó "Otro"',
  path: ['otros_observacion']
})

type InspeccionForm = z.infer<typeof inspeccionSchema>

export default function OperadorApp() {
  const { toast } = useDemo()
  const isOffline = useIsOffline()
  
  const { inspeccion, setInspeccionDatos, setPasoInspeccion, clearInspeccion } = useWizardStore()
  
  const [vista, setVista] = useState<'login'|'menu'|'wizard'>('login')
  const [session, setSession] = useState<any>(null)
  
  const [numEmpleado, setNumEmpleado] = useState('')
  const [cargando, setCargando] = useState(false)

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<InspeccionForm>({
    resolver: zodResolver(inspeccionSchema),
    defaultValues: {
      unidad_str: '',
      falla_luces: false,
      falla_frenos: false,
      falla_llantas: false,
      falla_motor: false,
      falla_otros: false,
      otros_observacion: ''
    }
  })

  useEffect(() => {
    if (Object.keys(inspeccion.datos).length > 0) {
      Object.entries(inspeccion.datos).forEach(([key, val]) => {
        setValue(key as keyof InspeccionForm, val as any)
      })
    }
  }, [inspeccion.datos, setValue])

  useEffect(() => {
    const subscription = watch((value) => {
      setInspeccionDatos(value as Partial<InspeccionForm>)
    })
    return () => subscription.unsubscribe()
  }, [watch, setInspeccionDatos])

  const watchFallaOtros = watch('falla_otros')

  const handleLogin = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/operadores/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_empleado: numEmpleado })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.messages?.error || 'Error de acceso')
      setSession(data.data)
      setVista('menu')
    } catch(e: any) {
      toast(e.message)
    } finally {
      setCargando(false)
    }
  }

  const iniciarWizard = () => {
    if (!inspeccion.datos.unidad_str) {
      setValue('unidad_str', session?.unidad_asignada?.numero_economico || '')
    }
    setVista('wizard')
  }

  const handleNextPaso = async () => {
    const isStepValid = await trigger()
    if (isStepValid) {
      setPasoInspeccion(inspeccion.pasoActual + 1)
    }
  }
  
  const handlePrevPaso = () => {
    setPasoInspeccion(Math.max(0, inspeccion.pasoActual - 1))
  }

  const onSubmit = async (data: InspeccionForm) => {
    if (isOffline) {
      toast('Sin conexión. Se sincronizará automáticamente al recuperar la red.')
      setVista('menu')
      return
    }
    
    setCargando(true)
    try {
      const tieneAnomalias = data.falla_luces || data.falla_frenos || data.falla_llantas || data.falla_motor || data.falla_otros
      const payload = {
        operador_id: session.operador.id,
        unidad_id: session?.unidad_asignada?.id || 1,
        tiene_anomalias: tieneAnomalias,
        datos_json: data
      }

      const res = await fetch(`${API_URL}/operadores/inspecciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Error al guardar la inspección en el servidor')
      
      toast(tieneAnomalias ? 'Reporte enviado. Taller notificado.' : 'Inspección Guardada. Buen viaje.')
      clearInspeccion()
      setVista('menu')
    } catch(e: any) {
      toast(e.message)
    } finally {
      setCargando(false)
    }
  }

  const renderPaso = () => {
    switch (inspeccion.pasoActual) {
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>Paso 1: Datos de Unidad</h2>
            <div style={{ background: '#E0F2FE', padding: 16, borderRadius: 8, border: '1px solid #BAE6FD' }}>
              <p style={{ margin: 0, color: '#0369A1', fontSize: 14 }}>Estos datos fueron precargados según tu asignación actual. Modifícalos solo si hubo un cambio de última hora.</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4, color: colors.textMuted }}>UNIDAD ASIGNADA *</label>
              <input {...register('unidad_str')} style={{ width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 18, border: '1px solid #ccc', borderRadius: 4 }} />
              {errors.unidad_str && <span style={{ color: colors.danger, fontSize: 14 }}>{errors.unidad_str.message}</span>}
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4, color: colors.textMuted }}>KILOMETRAJE</label>
              <input type="number" {...register('kilometraje')} style={{ width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 18, border: '1px solid #ccc', borderRadius: 4 }} placeholder="Opcional" />
            </div>
          </div>
        )
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>Paso 2: Cuestionario de Fallas</h2>
            <p style={{ margin: 0, color: colors.textMuted }}>Selecciona cualquier anomalía detectada en tu inspección visual.</p>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'white', border: '1px solid #ddd', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}>
              <input type="checkbox" {...register('falla_luces')} style={{ width: 24, height: 24, accentColor: colors.primary }} />
              💡 Luces (Fundidas, rotas, etc.)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'white', border: '1px solid #ddd', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}>
              <input type="checkbox" {...register('falla_frenos')} style={{ width: 24, height: 24, accentColor: colors.primary }} />
              🛑 Sistema de Frenos o Aire
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'white', border: '1px solid #ddd', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}>
              <input type="checkbox" {...register('falla_llantas')} style={{ width: 24, height: 24, accentColor: colors.primary }} />
              🛞 Llantas (Presión, desgaste, ponchadura)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'white', border: '1px solid #ddd', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}>
              <input type="checkbox" {...register('falla_motor')} style={{ width: 24, height: 24, accentColor: colors.primary }} />
              ⚙️ Testigos en Tablero o Falla de Motor
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'white', border: '1px solid #ddd', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}>
              <input type="checkbox" {...register('falla_otros')} style={{ width: 24, height: 24, accentColor: colors.primary }} />
              📝 Otra observación
            </label>

            {watchFallaOtros && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4, color: colors.danger }}>Descripción de la falla *</label>
                <textarea {...register('otros_observacion')} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 16, border: errors.otros_observacion ? '2px solid #B91C1C' : '1px solid #ccc', borderRadius: 4 }} placeholder="Por favor detalla el problema..." />
                {errors.otros_observacion && <span style={{ color: colors.danger, fontSize: 14 }}>{errors.otros_observacion.message}</span>}
              </div>
            )}
          </div>
        )
      case 2:
        const hasFallas = watch('falla_luces') || watch('falla_frenos') || watch('falla_llantas') || watch('falla_motor') || watch('falla_otros');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>Paso 3: Confirmación</h2>
            <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #ddd' }}>
              <p><strong>Unidad Asignada:</strong> {watch('unidad_str')}</p>
              
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Diagnóstico Visual:</p>
                {hasFallas ? (
                  <ul style={{ color: colors.danger, fontWeight: 500, margin: 0, paddingLeft: 20 }}>
                    {watch('falla_luces') && <li>Falla en Luces</li>}
                    {watch('falla_frenos') && <li>Falla en Frenos</li>}
                    {watch('falla_llantas') && <li>Falla en Llantas</li>}
                    {watch('falla_motor') && <li>Testigos / Motor</li>}
                    {watch('falla_otros') && <li>Otro: {watch('otros_observacion')}</li>}
                  </ul>
                ) : (
                  <div style={{ color: colors.success, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ✅ Unidad en óptimas condiciones. Sin fallas reportadas.
                  </div>
                )}
              </div>
            </div>
            {hasFallas && (
              <p style={{ fontSize: 14, color: colors.textMuted }}>
                Al enviar este reporte, el taller será notificado inmediatamente para generar una Orden de Trabajo Correctiva.
              </p>
            )}
          </div>
        )
      default: return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: 'system-ui', padding: 16 }}>
      <OfflineIndicator />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: colors.primary, fontSize: 24, fontWeight: 900 }}>WARHORSE <span style={{ color: colors.textMuted, fontWeight: 'normal' }}>Yard</span></h1>
        {session && vista !== 'login' && (
          <button onClick={() => { setSession(null); setVista('login') }} style={{ background: colors.danger, color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Salir</button>
        )}
      </div>

      {vista === 'login' && (
        <div style={{ background: colors.card, padding: 24, borderRadius: 8, border: '1px solid #ddd' }}>
          <h2 style={{ marginTop: 0, textAlign: 'center' }}>Acceso Operadores</h2>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>NÚMERO DE EMPLEADO</label>
          <input type="number" value={numEmpleado} onChange={e => setNumEmpleado(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 18, border: '1px solid #ccc', borderRadius: 4, marginBottom: 16 }} placeholder="Ej. 10045" />
          <button onClick={handleLogin} disabled={cargando} style={{ width: '100%', padding: 16, background: colors.primary, color: 'white', fontSize: 18, border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
            {cargando ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </div>
      )}

      {vista === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: colors.card, padding: 16, borderRadius: 8, border: '1px solid #ddd' }}>
            <h2 style={{ margin: 0 }}>Hola, {session.operador.nombre}</h2>
            <p style={{ margin: '4px 0 0 0', color: colors.textMuted }}>Licencia: <strong>{session.operador.licencia}</strong></p>
            
            {inspeccion.pasoActual > 0 && (
              <div style={{ marginTop: 16, padding: 12, background: '#FEF3C7', color: '#92400E', borderRadius: 6, fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠️ Tienes una inspección pausada (Paso {inspeccion.pasoActual + 1}).
              </div>
            )}
          </div>
          <button onClick={iniciarWizard} style={{ width: '100%', padding: 24, background: colors.primary, color: 'white', fontSize: 20, border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            {inspeccion.pasoActual > 0 ? '📝 CONTINUAR BORRADOR' : '➕ NUEVA INSPECCIÓN'}
          </button>
          <button onClick={() => toast('Historial en construcción')} style={{ width: '100%', padding: 16, background: 'white', color: colors.text, border: '2px solid #ddd', borderRadius: 8, fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>
            🔍 CONSULTAR HISTORIAL
          </button>
        </div>
      )}

      {vista === 'wizard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stepper Progress */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {[0, 1, 2].map(step => (
              <div key={step} style={{ height: 8, flex: 1, background: inspeccion.pasoActual >= step ? colors.primary : '#E5E7EB', borderRadius: 4, transition: 'background 0.3s' }} />
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderPaso()}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {inspeccion.pasoActual > 0 && (
                <button type="button" onClick={handlePrevPaso} style={{ flex: 1, padding: 16, background: '#E5E7EB', color: 'black', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
                  ATRÁS
                </button>
              )}
              {inspeccion.pasoActual === 0 && (
                <button type="button" onClick={() => setVista('menu')} style={{ flex: 1, padding: 16, background: '#E5E7EB', color: 'black', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
                  CANCELAR
                </button>
              )}
              
              {inspeccion.pasoActual < 2 ? (
                <button type="button" onClick={handleNextPaso} style={{ flex: 2, padding: 16, background: colors.primary, color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
                  SIGUIENTE
                </button>
              ) : (
                <button type="submit" disabled={cargando} style={{ flex: 2, padding: 16, background: colors.success, color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
                  {cargando ? 'ENVIANDO...' : 'ENVIAR REPORTE'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
