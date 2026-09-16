import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as api from '../lib/api'
import type { Rol } from '../lib/types'

export interface UsuarioActivo {
  id: number
  nombre: string
  email: string
  rol: Rol
  roles: Rol[]
  unidadAsignada?: string
  numeroEmpleado?: string
}

interface AuthState {
  usuario: UsuarioActivo | null
  token: string | null
  cargando: boolean
  error: string | null
  debeCambiarPassword: boolean

  // Métodos de acción
  iniciarSesion: (email: string, pass: string) => Promise<void>
  iniciarSesionDev: (email: string, rol: Rol, nombre: string) => void
  iniciarSesionOperador: (identificador: string, nombre?: string, unidad?: string) => void
  cerrarSesion: () => Promise<void>
  verificarSesion: () => Promise<void>
  tienePermiso: (permiso: string) => boolean
  tieneRol: (rolesPermitidos: Rol[]) => boolean
}

// Mapeo estándar de permisos por rol según la matriz RBAC de la arquitectura
const PERMISOS_POR_ROL: Record<Rol, string[]> = {
  admin: ['*'], // Acceso total
  taller: [
    'taller_ots',
    'taller_ingreso',
    'taller_liberaciones',
    'taller_responsables',
    'requisiciones_crear',
    'unidades_ver',
    'inspecciones_alertas',
  ],
  compras: [
    'compras_abasto',
    'compras_requisiciones',
    'inventario_stock',
    'inventario_yonke',
    'proveedores_catalogo',
    'caja_chica',
    'unidades_ver',
  ],
  operador: [
    'patio_inspeccion',
    'patio_historial',
    'unidad_inspeccionada',
  ],
  diesel: [
    'diesel_cargas',
    'diesel_externo',
    'unidades_ver',
  ],
}

function obtenerSesionInicial() {
  try {
    const raw = localStorage.getItem('warhorse_auth_storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state?.usuario && parsed?.state?.token) {
        return {
          usuario: parsed.state.usuario as UsuarioActivo,
          token: parsed.state.token as string,
          debeCambiarPassword: Boolean(parsed.state.debeCambiarPassword),
        }
      }
    }
  } catch {
    // Ignorar error de parsing
  }
  const tokenFallback = typeof window !== 'undefined' ? localStorage.getItem('wh_token') : null
  return {
    usuario: null,
    token: tokenFallback,
    debeCambiarPassword: false,
  }
}

const sesionInicial = obtenerSesionInicial()

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: sesionInicial.usuario,
      token: sesionInicial.token,
      cargando: false,
      error: null,
      debeCambiarPassword: sesionInicial.debeCambiarPassword,

      iniciarSesion: async (email: string, pass: string) => {
        set({ cargando: true, error: null })
        try {
          const res = await api.login(email, pass)
          const rolUsuario = (res.usuario.rol.toLowerCase() as Rol) || 'taller'
          const usuarioActivo: UsuarioActivo = {
            id: res.usuario.id,
            nombre: res.usuario.nombre,
            email,
            rol: rolUsuario,
            roles: (res.usuario.roles?.map(r => r.toLowerCase() as Rol) || [rolUsuario]),
            numeroEmpleado: (res.usuario as { numero_empleado?: string }).numero_empleado || (rolUsuario === 'operador' ? 'EMP-409' : `EMP-${res.usuario.id}`),
            unidadAsignada: (res.usuario as { unidad_asignada?: string }).unidad_asignada || (rolUsuario === 'operador' ? 'WH-101' : undefined),
          }

          set({
            usuario: usuarioActivo,
            token: res.token,
            debeCambiarPassword: res.debe_cambiar_password,
            cargando: false,
            error: null,
          })
        } catch (err: unknown) {
          const mensaje = err instanceof Error ? err.message : 'Credenciales incorrectas o error en el servidor.'
          set({ error: mensaje, cargando: false })
          throw err
        }
      },

      iniciarSesionDev: (email: string, rol: Rol, nombre: string) => {
        const usuarioDev: UsuarioActivo = {
          id: Math.floor(Math.random() * 100) + 1,
          nombre,
          email,
          rol,
          roles: [rol],
          numeroEmpleado: rol === 'operador' ? 'EMP-409' : `EMP-${rol.toUpperCase()}`,
          unidadAsignada: rol === 'operador' ? 'WH-101' : undefined,
        }

        const devToken = `wh-dev-token-${rol}-${Date.now()}`
        api.setToken(devToken)

        set({
          usuario: usuarioDev,
          token: devToken,
          debeCambiarPassword: false,
          cargando: false,
          error: null,
        })
      },

      iniciarSesionOperador: (identificador: string, nombre?: string, unidad?: string) => {
        // Acceso ágil para operadores en patio mediante No. Empleado o escaneo QR
        const operador: UsuarioActivo = {
          id: Math.floor(Date.now() / 1000),
          nombre: nombre || `Operador (${identificador})`,
          email: `${identificador.toLowerCase()}@warhorse.yard`,
          rol: 'operador',
          roles: ['operador'],
          numeroEmpleado: identificador,
          unidadAsignada: unidad || 'WH-101',
        }

        const yardToken = `yard-token-${identificador}`
        api.setToken(yardToken)

        set({
          usuario: operador,
          token: yardToken,
          debeCambiarPassword: false,
          cargando: false,
          error: null,
        })
      },

      cerrarSesion: async () => {
        set({ cargando: true })
        try {
          if (get().usuario?.rol !== 'operador') {
            await api.logout()
          }
        } catch {
          // Si el servidor falla, cerramos de todas formas localmente
        } finally {
          api.setToken(null)
          set({
            usuario: null,
            token: null,
            cargando: false,
            error: null,
            debeCambiarPassword: false,
          })
        }
      },

      verificarSesion: async () => {
        const { token, usuario } = get()
        if (!token) return

        // Si es una sesión de operador de patio, conservarla
        if (usuario?.rol === 'operador') return

        try {
          const datos = await api.me()
          set({
            usuario: {
              id: datos.id,
              nombre: datos.nombre,
              email: usuario?.email || '',
              rol: (datos.rol.toLowerCase() as Rol) || 'taller',
              roles: (datos.roles?.map(r => r.toLowerCase() as Rol) || ['taller']),
            },
            debeCambiarPassword: datos.debe_cambiar_password,
          })
        } catch (err: unknown) {
          // Token vencido o revocado ÚNICAMENTE si el servidor respondió 401 explícito
          if (err instanceof api.ApiError && err.status === 401) {
            set({ usuario: null, token: null })
            api.setToken(null)
          }
          // Si es un error de red o timeout transitorio, conservamos la sesión local
        }
      },

      tienePermiso: (permiso: string) => {
        const { usuario } = get()
        if (!usuario) return false
        const rolLower = (usuario.rol || '').toLowerCase()
        const listaRoles = (usuario.roles || []).map(r => String(r).toLowerCase())
        if (rolLower === 'admin' || rolLower.includes('admin') || rolLower === 'direccion' || listaRoles.includes('admin') || listaRoles.includes('direccion')) {
          return true
        }

        const permisos = PERMISOS_POR_ROL[usuario.rol] || []
        return permisos.includes('*') || permisos.includes(permiso)
      },

      tieneRol: (rolesPermitidos: Rol[]) => {
        const { usuario } = get()
        if (!usuario) return false
        const rolLower = (usuario.rol || '').toLowerCase()
        const listaRoles = (usuario.roles || []).map(r => String(r).toLowerCase())
        // El rol admin / direccion tiene acceso total a cualquier ruta
        if (rolLower === 'admin' || rolLower.includes('admin') || rolLower === 'direccion' || listaRoles.includes('admin') || listaRoles.includes('direccion')) {
          return true
        }
        return rolesPermitidos.some(rp => {
          const rpLower = rp.toLowerCase()
          return rolLower === rpLower || rolLower.includes(rpLower) || listaRoles.includes(rpLower)
        })
      },
    }),
    {
      name: 'warhorse_auth_storage',
      partialize: state => ({
        usuario: state.usuario,
        token: state.token,
        debeCambiarPassword: state.debeCambiarPassword,
      }),
    }
  )
)
