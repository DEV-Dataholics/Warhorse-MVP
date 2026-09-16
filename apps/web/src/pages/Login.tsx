import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { 
  
  
  QrCode, 
  UserCheck, 
  ArrowRight, 
  
    Lock,
  Mail,
  AlertCircle,
  Camera,
  Sparkles,
  Delete
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useUiStore } from '../store/useUiStore'
import { ApiError } from '../lib/api'
import logoWarhorse from '../assets/Logo.png'
import truckHero from '../assets/warhorse-truck.jpg'
import { QrScannerModal } from '../components/patio/QrScannerModal'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { iniciarSesion, iniciarSesionOperador } = useAuthStore()
  const { agregarToast } = useUiStore()

  const [modo, setModo] = useState<'corporativo' | 'patio'>('corporativo')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [idEmpleado, setIdEmpleado] = useState('')
  const [nombreOperador, setNombreOperador] = useState('')
  const [unidadOperador, setUnidadOperador] = useState('WH-101')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalQrAbierto, setModalQrAbierto] = useState(false)

  const manejarLoginCorporativo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Por favor escribe tu correo y contraseña.')
      return
    }

    setCargando(true)
    try {
      await iniciarSesion(email.trim(), password)
      agregarToast({
        tipo: 'success',
        titulo: 'Sesión Iniciada',
        mensaje: 'Bienvenido a la plataforma central de Warhorse México.',
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Credenciales inválidas. Verifica tu correo y contraseña.')
        } else if (err.status === 429) {
          setError('Demasiados intentos. Espera un minuto.')
        } else {
          setError(err.message || 'Error al conectar con la API.')
        }
      } else {
        setError('No se pudo conectar con el servidor local en Laragon.')
      }
    } finally {
      setCargando(false)
    }
  }

  const teclearDigito = (digito: string) => {
    setIdEmpleado(prev => {
      if (!prev || !prev.startsWith('EMP-')) {
        return `EMP-${digito}`
      }
      return `${prev}${digito}`
    })
  }

  const borrarDigito = () => {
    setIdEmpleado(prev => {
      if (prev.length <= 4) return ''
      return prev.slice(0, -1)
    })
  }

  const limpiarId = () => {
    setIdEmpleado('')
  }

  const manejarScanGafeteExitoso = (datos: {
    idEmpleado: string
    nombre?: string
    unidad?: string
  }) => {
    setIdEmpleado(datos.idEmpleado)
    if (datos.nombre) setNombreOperador(datos.nombre)
    if (datos.unidad) setUnidadOperador(datos.unidad)

    iniciarSesionOperador(
      datos.idEmpleado,
      datos.nombre,
      datos.unidad || unidadOperador
    )

    // Intentar solicitar pantalla completa nativa para la tableta
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }

    agregarToast({
      tipo: 'success',
      titulo: 'Gafete Escaneado con Éxito',
      mensaje: `Bienvenido, ${datos.nombre || datos.idEmpleado}. Terminal Kiosk activada.`,
    })
    navigate('/patio')
  }

  const manejarLoginPatio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!idEmpleado.trim()) {
      setError('Escribe tu número de empleado o escanea tu gafete.')
      return
    }

    iniciarSesionOperador(
      idEmpleado.trim().toUpperCase(),
      nombreOperador.trim() || undefined,
      unidadOperador
    )

    // Intentar solicitar pantalla completa nativa para la tableta
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }

    agregarToast({
      tipo: 'success',
      titulo: 'Operador Identificado',
      mensaje: `Bienvenido. Unidad asignada: ${unidadOperador}. Terminal Kiosk activada.`,
    })
    navigate('/patio')
  }


  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f10] text-[#f3f4f6] lg:flex-row">
      {/* Panel Izquierdo: Fotografía Hero del Tractocamión Warhorse e Identidad de Marca */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden border-b border-[rgba(243,239,231,0.1)] p-8 lg:border-b-0 lg:border-r lg:p-16">
        {/* Imagen de Fondo del Tractocamión Oficial Warhorse */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${truckHero})` }}
        />
        {/* Overlays industriales para garantizar legibilidad y contraste WCAG AAA */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f10] via-[#0f0f10]/85 to-[#0f0f10]/70" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#C5A059]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#F2620F]/20 blur-3xl" />

        {/* Encabezado con Logo Grande Prominente */}
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Logo Oficial Warhorse en Gran Formato con Máscara de Color Invertida */}
            <div className="flex items-center">
              <img 
                src={logoWarhorse} 
                alt="Warhorse Brokerage" 
                className="h-20 sm:h-24 w-auto object-contain brightness-0 invert filter drop-shadow-[0_4px_16px_rgba(242,98,15,0.35)]" 
              />
            </div>
            <div className="border-l-0 sm:border-l-2 border-[rgba(243,239,231,0.2)] sm:pl-4">
              <div className="flex items-center gap-2">
                <span className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-black tracking-widest text-white">
                  WARHORSE
                </span>
                <span className="rounded bg-[#F2620F] px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-black uppercase tracking-wider text-[#16191E]">
                  MÉXICO
                </span>
              </div>
              <p className="font-['Barlow_Condensed'] text-xs font-semibold tracking-wider text-[#C5A059]">
                SISTEMA OPERATIVO INTEGRAL DE FLOTAS Y TALLER
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 bg-[#F2620F]" />
              <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#F2620F]">
                Backbone de Operación y Logística
              </span>
            </div>
            <h1 className="mt-3 font-['Barlow_Condensed'] text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl text-white drop-shadow-md">
              CONTROL TOTAL DE FLOTA Y COSTOS
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#B8B2A6]">
              Trazabilidad integral desde la inspección física en patio hasta la adquisición de refacciones, 
              órdenes de trabajo correctivas y preventivas, e inventario Yonke a costo cero.
            </p>
          </div>
        </div>

        {/* Pilares del flujo */}
        <div className="relative z-10 mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-xl">
          <div className="rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#14181D]/80 p-3.5 backdrop-blur-md">
            <div className="font-['Barlow_Condensed'] text-lg font-bold text-[#F2620F]">01. PATIO</div>
            <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white mt-0.5">Inspección Offline</div>
            <div className="text-[10px] text-[#B8B2A6]">Captura sin conexión IndexDB</div>
          </div>
          <div className="rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#14181D]/80 p-3.5 backdrop-blur-md">
            <div className="font-['Barlow_Condensed'] text-lg font-bold text-[#C5A059]">02. TALLER</div>
            <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white mt-0.5">Gestión de OTs</div>
            <div className="text-[10px] text-[#B8B2A6]">Liberación total o warning</div>
          </div>
          <div className="rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#14181D]/80 p-3.5 backdrop-blur-md">
            <div className="font-['Barlow_Condensed'] text-lg font-bold text-[#3FA65C]">03. COMPRAS</div>
            <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white mt-0.5">Abasto & Yonke</div>
            <div className="text-[10px] text-[#B8B2A6]">Reutilización a costo $0</div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-6 flex items-center justify-between text-xs text-[#B8B2A6]">
          <div>
            Entorno: <span className="text-[#3FA65C] font-semibold">{import.meta.env.PROD ? 'Producción (Cloud)' : 'Laragon Local (127.0.0.1)'}</span> {import.meta.env.PROD ? '· warhorse_prod' : '· warhorse_db'}
          </div>
        </div>
      </div>

      {/* Panel Derecho: Formulario Dual de Acceso */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo para pantallas móviles */}
          <div className="mb-6 flex flex-col items-center justify-center text-center lg:hidden">
            <img 
              src={logoWarhorse} 
              alt="Warhorse Brokerage" 
              className="h-16 w-auto object-contain brightness-0 invert filter drop-shadow-[0_2px_10px_rgba(242,98,15,0.4)]" 
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="font-['Barlow_Condensed'] text-xl font-black tracking-widest text-white">
                WARHORSE
              </span>
              <span className="rounded bg-[#F2620F] px-1.5 py-0.5 font-['Barlow_Condensed'] text-[10px] font-black uppercase text-[#16191E]">
                MÉXICO
              </span>
            </div>
          </div>

          {/* Selector de Modo: Corporativo vs Patio */}
          <div className="mb-6 flex rounded-xl border border-[rgba(243,239,231,0.12)] bg-[#14181D] p-1">
            <button
              type="button"
              onClick={() => { setModo('corporativo'); setError(null) }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold font-['Barlow_Condensed'] uppercase tracking-wider transition-all ${
                modo === 'corporativo'
                  ? 'bg-[#F2620F] text-[#16191E] shadow-md'
                  : 'text-[#B8B2A6] hover:text-white'
              }`}
            >
              
              Acceso Corporativo
            </button>
            <button
              type="button"
              onClick={() => { setModo('patio'); setError(null) }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold font-['Barlow_Condensed'] uppercase tracking-wider transition-all ${
                modo === 'patio'
                  ? 'bg-[#F2620F] text-[#16191E] shadow-md'
                  : 'text-[#B8B2A6] hover:text-white'
              }`}
            >
              <QrCode className="h-4 w-4" />
              Acceso Patio (Operador)
            </button>
          </div>

          {/* Formulario Corporativo */}
          {modo === 'corporativo' && (
            <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <div className="mb-6">
                <h2 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-wide text-white">
                  Ingreso a la Plataforma
                </h2>
                <p className="text-xs text-[#B8B2A6] mt-1">
                  Acceso para Dirección, Taller, Compras y Diésel.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/10 p-3 text-xs text-[#F2620F]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={manejarLoginCorporativo} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#B8B2A6]" />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Usuario o correo electrónico"
                      className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none focus:ring-1 focus:ring-[#F2620F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#B8B2A6]" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Contraseña"
                      className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none focus:ring-1 focus:ring-[#F2620F]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2620F] py-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 transition-all hover:bg-[#D9550C] hover:shadow-xl disabled:opacity-50 cursor-pointer"
                >
                  {cargando ? 'Verificando...' : 'Iniciar Sesión'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Accesos Rápidos de Prueba (1 Clic) */}
              <div className="mt-5 pt-4 border-t border-[rgba(243,239,231,0.1)] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#B8B2A6] uppercase tracking-wider font-['Barlow_Condensed']">
                  <span>Accesos Rápidos de Prueba (1 Clic)</span>
                  <span className="text-[#C5A059]">Pass: warhorse-demo</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('direccion@warhorse.mx')
                      setPassword('warhorse-demo')
                    }}
                    className="flex flex-col items-start p-2 rounded-xl bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] hover:border-[#C5A059] transition-all text-left cursor-pointer"
                  >
                    <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#C5A059]">
                      Dirección (Admin)
                    </span>
                    <span className="text-[10px] text-[#B8B2A6] truncate w-full">
                      direccion@warhorse.mx
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('montzay@warhorse.mx')
                      setPassword('warhorse-demo')
                    }}
                    className="flex flex-col items-start p-2 rounded-xl bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] hover:border-[#F2620F] transition-all text-left cursor-pointer"
                  >
                    <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#F2620F]">
                      Compras (Montzay)
                    </span>
                    <span className="text-[10px] text-[#B8B2A6] truncate w-full">
                      montzay@warhorse.mx
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('edgar@warhorse.mx')
                      setPassword('warhorse-demo')
                    }}
                    className="flex flex-col items-start p-2 rounded-xl bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] hover:border-[#3FA65C] transition-all text-left cursor-pointer"
                  >
                    <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#3FA65C]">
                      Taller (Edgar)
                    </span>
                    <span className="text-[10px] text-[#B8B2A6] truncate w-full">
                      edgar@warhorse.mx
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('greisy@warhorse.mx')
                      setPassword('warhorse-demo')
                    }}
                    className="flex flex-col items-start p-2 rounded-xl bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] hover:border-blue-400 transition-all text-left cursor-pointer"
                  >
                    <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase text-blue-400">
                      Diésel (Greisy)
                    </span>
                    <span className="text-[10px] text-[#B8B2A6] truncate w-full">
                      greisy@warhorse.mx
                    </span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Formulario de Acceso Patio (Operador) */}
          {modo === 'patio' && (
            <div className="rounded-2xl border border-[rgba(243,239,231,0.12)] bg-[#14181D]/90 p-5 sm:p-7 backdrop-blur-xl shadow-2xl">
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#3FA65C]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#3FA65C] mb-2 font-['Barlow_Condensed'] uppercase tracking-wider">
                  Terminal Tablet · Kiosk Mode
                </div>
                <h2 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-wide text-white">
                  Identificación de Operador
                </h2>
                <p className="text-xs text-[#B8B2A6] mt-0.5">
                  Escanea tu gafete con la cámara o teclea tu ID para iniciar tu turno.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/10 p-3 text-xs text-[#F2620F]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón Destacado de Escaneo QR de Gafete */}
              <button
                type="button"
                onClick={() => setModalQrAbierto(true)}
                className="mb-4 group flex w-full items-center justify-between rounded-2xl border-2 border-[#F2620F]/60 bg-gradient-to-r from-[#F2620F]/15 via-[#1C1C1C] to-[#C5A059]/15 p-3.5 transition-all hover:border-[#F2620F] hover:bg-[#F2620F]/20 active:scale-[0.98] cursor-pointer shadow-lg shadow-[#F2620F]/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E] shadow-md group-hover:scale-105 transition-transform">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-['Barlow_Condensed'] text-base font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <span>Escanear Gafete QR</span>
                      <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                    </div>
                    <div className="text-[11px] text-[#B8B2A6]">
                      Cámara o simulador de gafetes
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-[#F2620F]/20 px-2.5 py-1 text-xs font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-[#F2620F]">
                  <QrCode className="h-4 w-4" />
                  <span>Abrir</span>
                </div>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="w-full border-t border-[rgba(243,239,231,0.1)]" />
                <span className="absolute bg-[#14181D] px-2 text-[10px] font-bold uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed']">
                  O CAPTURA CON TECLADO TÁCTIL
                </span>
              </div>

              <form onSubmit={manejarLoginPatio} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#B8B2A6]">
                      Número de Empleado
                    </label>
                    {idEmpleado && (
                      <button
                        type="button"
                        onClick={limpiarId}
                        className="text-[10px] text-[#F2620F] hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <UserCheck className="absolute left-3.5 top-3 h-4 w-4 text-[#F2620F]" />
                    <input
                      type="text"
                      value={idEmpleado}
                      onChange={e => setIdEmpleado(e.target.value.toUpperCase())}
                      placeholder="EMP-409"
                      className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 pl-10 pr-3 font-['Barlow_Condensed'] text-lg font-bold tracking-wider text-white uppercase placeholder-[#B8B2A6]/40 focus:border-[#F2620F] focus:outline-none focus:ring-1 focus:ring-[#F2620F]"
                    />
                  </div>
                </div>

                {/* Numpad Táctil Industrial en Pantalla para Tablet */}
                <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#101317] p-2">
                  <div className="mb-1 text-center text-[10px] uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed']">
                    Numpad Rápido de Patio
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => teclearDigito(d)}
                        className="flex h-10 items-center justify-center rounded-lg border border-[rgba(243,239,231,0.1)] bg-[#181D23] font-['Barlow_Condensed'] text-base font-bold text-white transition-all hover:bg-[#20262E] hover:border-[#F2620F] active:scale-95 cursor-pointer"
                      >
                        {d}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={limpiarId}
                      className="flex h-10 items-center justify-center rounded-lg border border-[rgba(243,239,231,0.1)] bg-[#181D23] font-['Barlow_Condensed'] text-xs font-bold text-[#c53030] hover:bg-[#20262E] cursor-pointer"
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => teclearDigito('0')}
                      className="flex h-10 items-center justify-center rounded-lg border border-[rgba(243,239,231,0.1)] bg-[#181D23] font-['Barlow_Condensed'] text-base font-bold text-white hover:bg-[#20262E] cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={borrarDigito}
                      className="flex h-10 items-center justify-center rounded-lg border border-[rgba(243,239,231,0.1)] bg-[#181D23] text-[#B8B2A6] hover:bg-[#20262E] hover:text-white cursor-pointer"
                    >
                      <Delete className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Tracto / Unidad a Inspeccionar
                  </label>
                  <select
                    value={unidadOperador}
                    onChange={e => setUnidadOperador(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2.5 px-3 font-['Barlow_Condensed'] text-sm tracking-wide text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="WH-101">WH-101 (Tractor Cruce)</option>
                    <option value="WH-104">WH-104 (Tractor Foráneo)</option>
                    <option value="WH-125">WH-125 (Tractor Local)</option>
                    <option value="CJ-502">CJ-502 (Caja Seca 53ft)</option>
                    <option value="TH-201">TH-201 (Thermo King)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2620F] py-3.5 font-['Barlow_Condensed'] text-base font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 transition-all hover:bg-[#D9550C] hover:shadow-xl cursor-pointer"
                >
                  <span>Entrar en Modo Tableta</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Escaneo QR de Gafete y Unidad */}
      <QrScannerModal
        abierto={modalQrAbierto}
        onCerrar={() => setModalQrAbierto(false)}
        onScanSuccess={manejarScanGafeteExitoso}
      />
    </div>
  )
}

export default Login
