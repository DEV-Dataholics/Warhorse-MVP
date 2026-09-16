import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router'
import * as api from './api'
import type { UnidadApi, Yo } from './api'

// Estado global del demo — espejo del `state` del componente del demo
// validado (view/rol/selTractoId/reqsExtra/estadoOverrides/usuarios/permisos).

export interface PasoTour {
  view: string | null
  sel: string | null
  title: string
  body: string
}

export const pasosTour: PasoTour[] = [
  { view: null, sel: null, title: 'Bienvenido al Hub de Gastos', body: 'Este recorrido de 1 minuto te muestra cómo WarHorse consolida diésel, refacciones y taller por tracto. Puedes saltarlo cuando quieras.' },
  { view: 'dashboard', sel: '[data-tour="nav"]', title: 'Navegación', body: 'Cinco módulos: Tablero para Dirección, Requisición para el piso de taller, Compras para Montzay, Catálogo de unidades y administración de Usuarios.' },
  { view: 'dashboard', sel: '[data-tour="kpis"]', title: 'Costo real consolidado', body: 'Los tres gastos que antes vivían en Excels separados — diésel, refacciones y taller — sumados por periodo. El cuarto KPI es el costo real de operar la flota.' },
  { view: 'dashboard', sel: '[data-tour="barras"]', title: 'Gasto por tracto', body: 'Cada barra es un tracto activo; la rayada es el que más se ha tragado. Haz clic en cualquier barra para analizar esa unidad abajo.' },
  { view: 'dashboard', sel: '[data-tour="decision"]', title: 'La pregunta de los 30 segundos', body: '¿Vale la pena meterle más lana? El Hub compara costo acumulado contra el valor estimado de la unidad y sugiere mantener o vender. El umbral es ajustable.' },
  { view: 'requisicion', sel: '[data-tour="reqform"]', title: 'Requisición desde el taller', body: 'Edgar pide piezas con foto obligatoria y origen: compra o canibalizada del yonke. Si es yonke, se exige donante y costo estimado para no perder trazabilidad.' },
  { view: 'compras', sel: '[data-tour="compras"]', title: 'Panel de Compras', body: 'Montzay ve todo ordenado por urgencia y avanza cada pieza por su ciclo: Solicitado → Cotizado → Comprado → Instalado.' },
  { view: 'catalogo', sel: '[data-tour="catalogo"]', title: 'Catálogo de unidades', body: 'Toda la flota: tractores, cajas y unidades Yonke que donan piezas. Desde aquí abres la ficha completa de cualquier unidad.' },
  { view: 'usuarios', sel: '[data-tour="usuarios"]', title: 'Usuarios y permisos', body: 'Controla quién entra al Hub y qué módulo ve cada rol: Dirección, Taller y Compras.' },
  { view: 'dashboard', sel: null, title: '¡Listo para arrancar!', body: 'Busca los iconos "?" en cada sección para más detalle. Puedes repetir este recorrido con el botón Tutorial del menú.' },
]

export interface Confirmacion {
  pieza: string
  destino: string
  alConfirmar: () => void | Promise<void>
}

export interface Tip {
  text: string
  x: number
  y: number
}

export interface RectTour {
  x: number
  y: number
  w: number
  h: number
}

interface ContextoDemo {
  sesion: Yo | null
  entrar: (email: string, password: string) => Promise<Yo>
  refrescarSesion: () => Promise<Yo>
  salir: () => void
  usuarioActual: string
  unidades: UnidadApi[]
  recargarUnidades: () => Promise<void>
  selTractoId: string
  setSelTractoId: (id: string) => void
  toastMsg: string
  toast: (msg: string) => void
  confirmar: Confirmacion | null
  setConfirmar: (c: Confirmacion | null) => void
  tip: Tip | null
  tipShow: (text: string) => (e: { currentTarget: Element }) => void
  tipHide: () => void
  tourStep: number
  tourRect: RectTour | null
  goTour: (n: number) => void
  endTour: () => void
}

const Ctx = createContext<ContextoDemo | null>(null)

const rutaDeVista: Record<string, string> = {
  dashboard: '/dashboard',
  requisicion: '/requisicion',
  taller: '/taller',
  compras: '/compras',
  diesel: '/diesel',
  catalogo: '/catalogo',
  usuarios: '/usuarios',
}

// Ruta del SPA para un landing de la API; un landing desconocido aterriza
// en el catálogo (visible para todos los roles).
export function rutaDeLanding(landing: string): string {
  return rutaDeVista[landing] ?? '/catalogo'
}

const etiquetaRol: Record<string, string> = {
  admin: 'Admin',
  taller: 'Taller',
  compras: 'Compras',
  diesel: 'Diésel',
  operador: 'Operador (Patio)',
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [sesion, setSesion] = useState<Yo | null>(null)
  const [unidades, setUnidades] = useState<UnidadApi[]>([])
  const [selTractoId, setSelTractoId] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [confirmar, setConfirmar] = useState<Confirmacion | null>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [tourStep, setTourStep] = useState(-1)
  const [tourRect, setTourRect] = useState<RectTour | null>(null)
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const tourT = useRef<ReturnType<typeof setTimeout>>(undefined)

  const toast = useCallback((msg: string) => {
    clearTimeout(toastT.current)
    setToastMsg(msg)
    toastT.current = setTimeout(() => setToastMsg(''), 3200)
  }, [])

  const medirTour = useCallback((paso: number) => {
    const st = pasosTour[paso]
    if (!st || !st.sel) return setTourRect(null)
    const el = document.querySelector(st.sel)
    if (!el) return setTourRect(null)
    let r = el.getBoundingClientRect()
    if (r.top < 70 || r.bottom > window.innerHeight - 120) {
      window.scrollTo({ top: Math.max(0, r.top + window.scrollY - 120) })
      r = el.getBoundingClientRect()
    }
    setTourRect({ x: r.left, y: r.top, w: r.width, h: r.height })
  }, [])

  const endTour = useCallback(() => {
    clearTimeout(tourT.current)
    setTourStep(-1)
    setTourRect(null)
    try {
      localStorage.setItem('wh_tour_v1', 'done')
    } catch {
      /* sin localStorage */
    }
  }, [])

  const goTour = useCallback(
    (n: number) => {
      if (n < 0) n = 0
      if (n >= pasosTour.length) return endTour()
      const st = pasosTour[n]
      setTourStep(n)
      setTourRect(null)
      if (st.view) navigate(rutaDeVista[st.view])
      clearTimeout(tourT.current)
      tourT.current = setTimeout(() => medirTour(n), import.meta.env.MODE === 'test' ? 10 : 460)
    },
    [endTour, medirTour, navigate],
  )

  const tipShow = useCallback(
    (text: string) => (e: { currentTarget: Element }) => {
      const r = e.currentTarget.getBoundingClientRect()
      setTip({ text, x: r.left + r.width / 2, y: r.bottom + 10 })
    },
    [],
  )

  const tipHide = useCallback(() => setTip(null), [])

  const recargarUnidades = useCallback(async () => {
    try {
      setUnidades(await api.getUnidades())
    } catch {
      // Si no hay sesión o token aún, se ignora hasta autenticar
    }
  }, [])

  useEffect(() => {
    void recargarUnidades()
  }, [recargarUnidades])

  const entrar = useCallback(async (email: string, password: string): Promise<Yo> => {
    await api.login(email, password)
    const yo = await api.me()
    setSesion(yo)
    void recargarUnidades()
    return yo
  }, [recargarUnidades])

  // Tras definir la contraseña propia: relee la sesión para levantar la
  // obligación pendiente (debe_cambiar_password) y dejar navegar.
  const refrescarSesion = useCallback(async (): Promise<Yo> => {
    const yo = await api.me()
    setSesion(yo)
    return yo
  }, [])

  const salir = useCallback(() => {
    void api.logout()
    setSesion(null)
    navigate('/login')
  }, [navigate])

  const usuarioActual = sesion ? `${sesion.nombre} · ${sesion.roles.map(r => etiquetaRol[r]).join(' + ')}` : ''

  return (
    <Ctx.Provider
      value={{
        sesion,
        entrar,
        refrescarSesion,
        salir,
        usuarioActual,
        unidades,
        recargarUnidades,
        selTractoId,
        setSelTractoId,
        toastMsg,
        toast,
        confirmar,
        setConfirmar,
        tip,
        tipShow,
        tipHide,
        tourStep,
        tourRect,
        goTour,
        endTour,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useDemo(): ContextoDemo {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDemo requiere DemoProvider')
  return ctx
}
