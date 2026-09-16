import { useCallback, useEffect, useState } from 'react'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { actualizarUsuario, ApiError, crearUsuario, getUsuarios, type UsuarioAdminApi, type UsuarioCreado } from '../lib/api'
import { descargarCredencialesPdf } from '../lib/credencialesPdf'
import { useDemo } from '../lib/demo'
import { badge, card, FD, h2Titulo, h3Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import type { Rol } from '../lib/types'

const rolNombres: Record<string, string> = { admin: 'Dirección (Admin)', taller: 'Taller', compras: 'Compras', diesel: 'Control de Diésel', operador: 'Operador (Patio)' }
const avatarColors: Record<string, string> = { admin: '#16191E', taller: '#C5A059', compras: '#3FA65C', diesel: '#8A6D1A', operador: '#F2620F' }
const roles = Object.keys(rolNombres) as Rol[]

const modulos = [
  { id: 'dashboard', label: 'Tablero Directivo', desc: 'KPIs, gráficas y decisión por tracto' },
  { id: 'requisicion', label: 'Requisiciones', desc: 'Solicitar refacciones desde taller' },
  { id: 'taller', label: 'Control de Taller', desc: 'Ingresos y liberaciones' },
  { id: 'compras', label: 'Panel de Compras', desc: 'Ciclo Solicitado → Instalado' },
  { id: 'diesel', label: 'Control de Diésel', desc: 'Cargas de combustible' },
  { id: 'catalogo', label: 'Catálogo de Unidades', desc: 'Tractos, cajas y yonke' },
  { id: 'usuarios', label: 'Usuarios y Permisos', desc: 'Esta sección' },
]

// Espejo de App\Libraries\Permisos del backend (RF-USR-03): la matriz es fija
// por rol; aquí solo se visualiza y el backend la re-verifica en cada acción.
const matriz: Record<Rol, string[]> = {
  admin: ['dashboard', 'requisicion', 'taller', 'compras', 'diesel', 'catalogo', 'usuarios'],
  taller: ['requisicion', 'taller', 'catalogo'],
  compras: ['compras', 'catalogo'],
  diesel: ['diesel', 'catalogo'],
  operador: ['catalogo'],
}

export default function Usuarios() {
  const { toast } = useDemo()
  const [usuarios, setUsuarios] = useState<UsuarioAdminApi[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoRol, setNuevoRol] = useState<Rol[]>(['taller'])
  const [creado, setCreado] = useState<UsuarioCreado | null>(null)

  const cargar = useCallback(async () => {
    setUsuarios(await getUsuarios())
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const mensajeError = (e: unknown, respaldo: string) => {
    if (e instanceof ApiError) {
      const campos = e.fields ? Object.values(e.fields).flat() : []
      return campos[0] ?? e.message
    }
    return respaldo
  }

  const agregarUsuario = async () => {
    const nombre = nuevoNombre.trim()
    const email = nuevoEmail.trim().toLowerCase()
    if (!nombre) return toast('Escribe el nombre del usuario.')
    if (!email) return toast('Escribe el correo del usuario.')
    if (nuevoRol.length === 0) return toast('Selecciona al menos un rol.')
    try {
      const nuevo = await crearUsuario({ nombre, email, rol: nuevoRol.join(',') })
      setNuevoNombre('')
      setNuevoEmail('')
      setCreado(nuevo) // muestra la temporal UNA vez (sin correo)
      await cargar()
    } catch (e) {
      toast(mensajeError(e, 'No se pudo dar de alta al usuario.'))
    }
  }

  const copiarTemporal = async () => {
    if (!creado) return
    try {
      await navigator.clipboard.writeText(creado.password_temporal)
      toast('Contraseña temporal copiada.')
    } catch {
      toast('No se pudo copiar; anótala del recuadro.')
    }
  }

  const cambiarRol = async (u: UsuarioAdminApi, rolStr: string) => {
    if (!rolStr) return;
    try {
      await actualizarUsuario(u.id, { rol: rolStr })
      const nombreRoles = rolStr.split(',').map(r => rolNombres[r as Rol]).join(' + ')
      toast(u.nombre + ' ahora es ' + nombreRoles)
      await cargar()
    } catch (e) {
      toast(mensajeError(e, 'No se pudo cambiar el rol.'))
    }
  }

  const alternarActivo = async (u: UsuarioAdminApi) => {
    try {
      await actualizarUsuario(u.id, { activo: !u.activo })
      toast(u.nombre + (u.activo ? ' suspendido — pierde acceso de inmediato.' : ' reactivado'))
      await cargar()
    } catch (e) {
      toast(mensajeError(e, 'No se pudo cambiar el acceso.'))
    }
  }

  return (
    <>
      <div style={{ animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Administración" />
        <h2 style={h2Titulo}>Usuarios y Permisos</h2>
        <p style={subTitulo}>Administra quién entra al Hub y qué módulos puede usar cada rol.</p>
      </div>

      <div data-tour="usuarios" style={{ ...card, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <h3 style={h3Titulo}>Usuarios</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nombre del nuevo usuario"
              style={{ padding: '9px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: 'var(--bg-input)', minWidth: 190 }}
            />
            <input
              type="email"
              value={nuevoEmail}
              onChange={(e) => setNuevoEmail(e.target.value)}
              placeholder="Correo del nuevo usuario"
              style={{ padding: '9px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: 'var(--bg-input)', minWidth: 190 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-input)', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: 8 }}>
              {roles.map((r) => (
                <label key={r} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={nuevoRol.includes(r)} onChange={(e) => {
                    const next = e.target.checked ? [...nuevoRol, r] : nuevoRol.filter(x => x !== r)
                    setNuevoRol(next)
                  }} />
                  {rolNombres[r]}
                </label>
              ))}
            </div>
            <button
              onClick={() => void agregarUsuario()}
              className="hv-naranja"
              style={{ padding: '9px 18px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              + Agregar
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 680 }}>
            <thead>
              <tr style={theadRow}>
                <th style={{ ...thCell, padding: 10 }}>Usuario</th>
                <th style={{ ...thCell, padding: 10 }}>Correo</th>
                <th style={{ ...thCell, padding: 10 }}>Rol</th>
                <th style={{ ...thCell, padding: 10 }}>Estado</th>
                <th style={{ ...thCell, padding: 10 }}>Acceso</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="hv-fila">
                  <td style={tdCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          width: 34, height: 34, borderRadius: '50%', background: avatarColors[u.roles?.[0] ?? 'taller'],
                          color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12.5, fontWeight: 700, flex: 'none', opacity: u.activo ? 1 : 0.45,
                        }}
                      >
                        {u.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 700 }}>{u.nombre}</span>
                    </div>
                  </td>
                  <td style={{ ...tdCell, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{u.email}</td>
                  <td style={tdCell}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {roles.map((r) => (
                        <label key={r} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" checked={u.roles?.includes(r) ?? false} onChange={(e) => {
                            const next = e.target.checked ? [...(u.roles ?? []), r] : (u.roles ?? []).filter(x => x !== r)
                            void cambiarRol(u, next.join(','))
                          }} />
                          {rolNombres[r]}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td style={tdCell}>
                    <span style={u.activo ? badge('#E5F3E9', '#2C7A44', '#9FD4B0') : badge('#EAE6DC', '#4A4438', '#C9C2B2')}>
                      {u.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td style={tdCell}>
                    <button
                      onClick={() => void alternarActivo(u)}
                      className="hv-op85"
                      style={{
                        padding: '7px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        background: u.activo ? '#fff' : '#E5F3E9',
                        color: u.activo ? '#9B2C2C' : '#2C7A44',
                        border: u.activo ? '1px solid #E8A99D' : '1px solid #9FD4B0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.activo ? 'Suspender' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, animation: 'fadeUp 0.45s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
          <h3 style={h3Titulo}>Permisos por rol</h3>
          <Ayuda tip="Los permisos aplican por rol, no por persona: al cambiar el rol de un usuario, hereda estos accesos de inmediato. La matriz es fija; el backend la re-verifica en cada acción." />
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)' }}>
          Matriz de solo lectura (RF-USR-03): qué módulos ve cada rol. Para cambiar los accesos de una
          persona, cámbiale el rol arriba.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={theadRow}>
                <th style={{ ...thCell, padding: 10 }}>Módulo</th>
                {roles.map((r) => (
                  <th key={r} style={{ ...thCell, padding: 10, textAlign: 'center' }}>{rolNombres[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modulos.map((m) => (
                <tr key={m.id} className="hv-fila">
                  <td style={{ ...tdCell, fontWeight: 600 }}>
                    {m.label}
                    <div style={{ fontWeight: 400, fontSize: 12.5, color: 'var(--text-muted)' }}>{m.desc}</div>
                  </td>
                  {roles.map((r) => {
                    const on = matriz[r].includes(m.id)
                    const bloqueado = r === 'admin' && m.id === 'usuarios'
                    return (
                      <td key={r} style={{ ...tdCell, textAlign: 'center' }}>
                        <button
                          title={bloqueado ? 'El Admin no puede perder acceso a Usuarios' : rolNombres[r] + ' · ' + m.label}
                          onClick={() =>
                            toast(
                              bloqueado
                                ? 'El Admin siempre conserva acceso a Usuarios.'
                                : 'La matriz de permisos es fija por rol (RF-USR-03); el backend la aplica en cada acción.',
                            )
                          }
                          className="hv-op8"
                          style={{
                            width: 38, height: 38, borderRadius: 9, border: 'none',
                            cursor: 'default', fontSize: 16, fontWeight: 700,
                            background: on ? '#E5F3E9' : '#F1EDE3',
                            color: on ? '#2C7A44' : '#A79F8E',
                            outline: on ? '1px solid #9FD4B0' : '1px solid #E7E0D2',
                          }}
                        >
                          {on ? '✓' : '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creado && (
        <div
          onClick={() => setCreado(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={'Credenciales de ' + creado.nombre}
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 460, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 6px' }}>
              Usuario creado ✓
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-muted)' }}>
              {creado.nombre} · {creado.email} · {creado.roles?.map(r => rolNombres[r]).join(' + ')}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--text-muted)' }}>
              Entrégale esta contraseña temporal. <strong>No se volverá a mostrar.</strong> Al entrar por
              primera vez, deberá crear su propia contraseña.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', border: '1px dashed #C5A059', borderRadius: 10, padding: '16px 12px', margin: '0 0 16px' }}>
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: 24, fontWeight: 700, letterSpacing: '0.08em', color: '#B4430A' }}>
                {creado.password_temporal}
              </code>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => void copiarTemporal()}
                className="hv-borde-ink"
                style={{ flex: 1, minWidth: 130, padding: '11px 16px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Copiar
              </button>
              <button
                onClick={() => descargarCredencialesPdf(creado)}
                className="hv-borde-ink"
                style={{ flex: 1, minWidth: 130, padding: '11px 16px', background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
              >
                ⬇ Descargar PDF
              </button>
              <button
                onClick={() => setCreado(null)}
                className="hv-naranja"
                style={{ flex: 1, minWidth: 130, padding: '11px 16px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
