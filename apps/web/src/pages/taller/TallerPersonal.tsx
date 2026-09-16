import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Wrench, 
  RotateCw, 
  CheckCircle2, 
  XCircle,
  UserCheck, 
  QrCode, 
  Search,
  Edit2,
  Power
} from 'lucide-react'
import { 
  getResponsablesTaller, 
  crearResponsableTaller, 
  actualizarResponsableTaller,
  type ResponsableTaller 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { GafeteMecanicoModal } from '../../components/taller/GafeteMecanicoModal'

export const TallerPersonal: React.FC = () => {
  const { agregarToast } = useUiStore()

  const [mecanicos, setMecanicos] = useState<ResponsableTaller[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('Todos')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos')

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [mecanicoAEditar, setMecanicoAEditar] = useState<ResponsableTaller | null>(null)
  const [mecanicoSeleccionadoQR, setMecanicoSeleccionadoQR] = useState<ResponsableTaller | null>(null)
  const [modalQR, setModalQR] = useState(false)

  // Formulario nuevo mecánico
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'Tracto' | 'Caja'>('Tracto')
  const [rol, setRol] = useState<'Mecánico A' | 'Mecánico B' | 'Auxiliar' | 'Termoquineros'>('Mecánico A')
  const [guardando, setGuardando] = useState(false)

  // Formulario editar mecánico
  const [editNombre, setEditNombre] = useState('')
  const [editTipo, setEditTipo] = useState<'Tracto' | 'Caja'>('Tracto')
  const [editRol, setEditRol] = useState<'Mecánico A' | 'Mecánico B' | 'Auxiliar' | 'Termoquineros'>('Mecánico A')
  const [editActivo, setEditActivo] = useState(true)

  const fallbackMecanicos: ResponsableTaller[] = [
    { id: 1, nombre: 'Carlos Méndez', tipo: 'Tracto', rol: 'Mecánico A' },
    { id: 2, nombre: 'Luis Morales', tipo: 'Tracto', rol: 'Mecánico B' },
    { id: 3, nombre: 'Héctor Gómez', tipo: 'Caja', rol: 'Auxiliar' },
    { id: 4, nombre: 'Roberto Silva', tipo: 'Tracto', rol: 'Termoquineros' },
  ]

  const cargarMecanicos = async () => {
    setCargando(true)
    try {
      const lista = await getResponsablesTaller().catch(() => fallbackMecanicos)
      setMecanicos(lista && lista.length > 0 ? lista : fallbackMecanicos)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarMecanicos()
  }, [])

  const abrirGafeteQR = (m: ResponsableTaller) => {
    setMecanicoSeleccionadoQR(m)
    setModalQR(true)
  }

  const abrirEdicion = (m: ResponsableTaller) => {
    setMecanicoAEditar(m)
    setEditNombre(m.nombre)
    setEditTipo(m.tipo || 'Tracto')
    setEditRol(m.rol)
    setEditActivo(m.activo !== false)
    setModalEditar(true)
  }

  const alternarActivo = async (m: ResponsableTaller) => {
    const nuevoEstado = !(m.activo !== false)
    try {
      await actualizarResponsableTaller(m.id, { activo: nuevoEstado })
      agregarToast({
        tipo: 'success',
        titulo: nuevoEstado ? 'Mecánico Reactivado' : 'Baja Operativa Registrada',
        mensaje: `${m.nombre} ahora está ${nuevoEstado ? 'Activo' : 'Inactivo'} para asignaciones.`,
      })
      await cargarMecanicos()
    } catch {
      setMecanicos(prev => prev.map(item => item.id === m.id ? { ...item, activo: nuevoEstado } : item))
      agregarToast({
        tipo: 'info',
        titulo: 'Estado Actualizado (Local)',
        mensaje: `${m.nombre} ahora está ${nuevoEstado ? 'Activo' : 'Inactivo'}.`,
      })
    }
  }

  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mecanicoAEditar || !editNombre.trim()) return

    setGuardando(true)
    try {
      await actualizarResponsableTaller(mecanicoAEditar.id, {
        nombre: editNombre.trim(),
        tipo: editTipo,
        rol: editRol,
        activo: editActivo,
      })

      agregarToast({
        tipo: 'success',
        titulo: 'Mecánico Actualizado',
        mensaje: `Se actualizaron los datos de ${editNombre.trim()} correctamente.`,
      })

      setModalEditar(false)
      setMecanicoAEditar(null)
      await cargarMecanicos()
    } catch {
      setMecanicos(prev => prev.map(m => m.id === mecanicoAEditar.id ? {
        ...m,
        nombre: editNombre.trim(),
        tipo: editTipo,
        rol: editRol,
        activo: editActivo,
      } : m))
      setModalEditar(false)
      setMecanicoAEditar(null)
      agregarToast({
        tipo: 'info',
        titulo: 'Mecánico Actualizado (Local)',
        mensaje: `Datos modificados localmente.`,
      })
    } finally {
      setGuardando(false)
    }
  }

  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setGuardando(true)
    try {
      const resp = await crearResponsableTaller({
        nombre: nombre.trim(),
        tipo,
        rol,
      })

      const nuevoMecanico: ResponsableTaller = {
        id: resp?.id || (mecanicos.length > 0 ? Math.max(...mecanicos.map(m => m.id)) + 1 : 1),
        nombre: nombre.trim(),
        tipo,
        rol,
        activo: true,
      }

      agregarToast({
        tipo: 'success',
        titulo: 'Mecánico Registrado',
        mensaje: `Se dio de alta a ${nombre} como ${rol}. Generando Gafete QR...`,
      })

      setModalNuevo(false)
      setNombre('')
      await cargarMecanicos()

      // Abrir inmediatamente el Gafete QR del nuevo colaborador
      setMecanicoSeleccionadoQR(nuevoMecanico)
      setModalQR(true)
    } catch {
      // Fallback local si el backend no persiste
      const nuevo: ResponsableTaller = {
        id: mecanicos.length > 0 ? Math.max(...mecanicos.map(m => m.id)) + 1 : 1,
        nombre: nombre.trim(),
        tipo,
        rol,
        activo: true,
      }
      setMecanicos(prev => [...prev, nuevo])
      setModalNuevo(false)
      setNombre('')
      agregarToast({
        tipo: 'success',
        titulo: 'Mecánico Registrado',
        mensaje: `Se dio de alta a ${nombre} en el equipo local.`,
      })
      // Abrir Gafete QR generado
      setMecanicoSeleccionadoQR(nuevo)
      setModalQR(true)
    } finally {
      setGuardando(false)
    }
  }

  // Filtrado de mecánicos
  const mecanicosFiltrados = mecanicos.filter(m => {
    const coincideTexto = 
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.rol && m.rol.toLowerCase().includes(busqueda.toLowerCase())) ||
      `MEC-${String(m.id).padStart(3, '0')}`.toLowerCase().includes(busqueda.toLowerCase())

    if (!coincideTexto) return false
    if (filtroRol !== 'Todos' && m.rol !== filtroRol) return false
    if (filtroEstado === 'Activos' && m.activo === false) return false
    if (filtroEstado === 'Inactivos' && m.activo !== false) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Taller
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Cuadrilla y Acreditación Técnica
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Equipo de Mecánicos & Gafetes QR
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Personal técnico acreditado para asignación y liberación de órdenes de trabajo. Generación y consulta de credenciales QR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarMecanicos}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#B8B2A6]" />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            onClick={() => setModalNuevo(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-5 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Registrar Mecánico</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros de Especialistas */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-4">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B8B2A6]" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código MEC-00X o rol..."
            className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Filtro por estado operativo */}
          <div className="flex items-center gap-1 bg-[#1C1C1C] p-1 rounded-xl border border-[rgba(243,239,231,0.1)]">
            {(['Todos', 'Activos', 'Inactivos'] as const).map(est => (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`rounded-lg px-2.5 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filtroEstado === est
                    ? 'bg-[#F2620F] text-[#16191E]'
                    : 'text-[#B8B2A6] hover:text-white'
                }`}
              >
                {est}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {(['Todos', 'Mecánico A', 'Mecánico B', 'Auxiliar', 'Termoquineros'] as const).map(rolItem => (
              <button
                key={rolItem}
                type="button"
                onClick={() => setFiltroRol(rolItem)}
                className={`rounded-lg px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filtroRol === rolItem
                    ? 'bg-[#C5A059] text-[#16191E]'
                    : 'bg-[#1C1C1C] text-[#B8B2A6] hover:text-white'
                }`}
              >
                {rolItem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas del Equipo de Mecánicos con Gafete QR */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cargando ? (
          <div className="col-span-full py-12 text-center text-xs text-[#B8B2A6]">
            Cargando cuadrilla de mecánicos...
          </div>
        ) : mecanicosFiltrados.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#B8B2A6]">
            No se encontraron mecánicos que coincidan con la búsqueda.
          </div>
        ) : (
          mecanicosFiltrados.map(m => {
            const folio = `MEC-${String(m.id).padStart(3, '0')}`
            const estaActivo = m.activo !== false

            return (
              <div
                key={m.id}
                className={`group relative rounded-2xl border bg-[#14181D]/80 p-5 space-y-4 transition-all flex flex-col justify-between ${
                  estaActivo 
                    ? 'border-[rgba(243,239,231,0.1)] hover:border-[#F2620F]/50' 
                    : 'border-red-950/40 bg-[#121417]/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Cabecera de la Tarjeta */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] text-[#F2620F] font-bold font-['Barlow_Condensed'] text-lg group-hover:border-[#F2620F]/40 transition-colors">
                      {m.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#C5A059]">
                        {folio}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${
                          m.tipo === 'Tracto'
                            ? 'bg-[#F2620F]/20 text-[#F2620F]'
                            : 'bg-[#C5A059]/20 text-[#C5A059]'
                        }`}
                      >
                        {m.tipo || 'Tracto'}
                      </span>
                    </div>
                  </div>

                  {/* Nombre y Rol */}
                  <div className="mt-3">
                    <h4 className="font-['Barlow_Condensed'] text-xl font-bold text-white leading-tight">
                      {m.nombre}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#B8B2A6] mt-1">
                      <Wrench className="h-3.5 w-3.5 text-[#3FA65C]" />
                      <span className="font-semibold text-white/90">{m.rol}</span>
                    </div>
                  </div>
                </div>

                {/* Estatus Real y Botones de Acción */}
                <div className="border-t border-[rgba(243,239,231,0.06)] pt-3 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#B8B2A6]">
                    <span>Estatus Técnico:</span>
                    {estaActivo ? (
                      <span className="flex items-center gap-1 font-['Barlow_Condensed'] font-bold text-[#3FA65C] uppercase">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-['Barlow_Condensed'] font-bold text-[#E84E38] uppercase">
                        <XCircle className="h-3.5 w-3.5" /> Inactivo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirGafeteQR(m)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-2.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer shadow-sm"
                      title="Ver credencial QR"
                    >
                      <QrCode className="h-3.5 w-3.5 text-[#F2620F]" />
                      <span>Gafete</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEdicion(m)}
                      className="flex items-center justify-center gap-1 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-2.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6] hover:text-white hover:border-white transition-all cursor-pointer"
                      title="Editar datos"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarActivo(m)}
                      className={`flex items-center justify-center rounded-xl border p-2 transition-all cursor-pointer ${
                        estaActivo 
                          ? 'border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-200' 
                          : 'border-green-900/40 bg-green-950/20 text-green-400 hover:bg-green-900/40 hover:text-green-200'
                      }`}
                      title={estaActivo ? 'Dar de baja operativa' : 'Reactivar técnico'}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Registro de Nuevo Mecánico */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
                  <UserCheck className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wide text-white">
                    Alta de Mecánico
                  </h3>
                  <p className="text-xs text-[#B8B2A6]">
                    Genera automáticamente credencial y código QR de acceso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="text-[#B8B2A6] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarGuardar} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Roberto Sánchez"
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Especialidad
                  </label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as 'Tracto' | 'Caja')}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="Tracto">Tracto (Motor/Chasis)</option>
                    <option value="Caja">Caja Seca / Suspensión</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Nivel / Rol
                  </label>
                  <select
                    value={rol}
                    onChange={e => setRol(e.target.value as ResponsableTaller['rol'])}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="Mecánico A">Mecánico A (Senior)</option>
                    <option value="Mecánico B">Mecánico B</option>
                    <option value="Auxiliar">Auxiliar de Taller</option>
                    <option value="Termoquineros">Termoquineros</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(243,239,231,0.08)]">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-[#F2620F] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Registrar y Generar QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición de Mecánico */}
      {modalEditar && mecanicoAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059] text-[#16191E]">
                  <Edit2 className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wide text-white">
                    Editar Mecánico
                  </h3>
                  <p className="text-xs text-[#B8B2A6]">
                    MEC-{String(mecanicoAEditar.id).padStart(3, '0')} · {mecanicoAEditar.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditar(false)}
                className="text-[#B8B2A6] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarGuardarEdicion} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  placeholder="Nombre y apellido"
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Especialidad
                  </label>
                  <select
                    value={editTipo}
                    onChange={e => setEditTipo(e.target.value as 'Tracto' | 'Caja')}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="Tracto">Tracto (Motor/Chasis)</option>
                    <option value="Caja">Caja Seca / Suspensión</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                    Nivel / Rol
                  </label>
                  <select
                    value={editRol}
                    onChange={e => setEditRol(e.target.value as ResponsableTaller['rol'])}
                    className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 font-['Barlow_Condensed'] text-sm font-semibold text-white focus:border-[#F2620F] focus:outline-none"
                  >
                    <option value="Mecánico A">Mecánico A (Senior)</option>
                    <option value="Mecánico B">Mecánico B</option>
                    <option value="Auxiliar">Auxiliar de Taller</option>
                    <option value="Termoquineros">Termoquineros</option>
                  </select>
                </div>
              </div>

              {/* Toggle de Estado Activo */}
              <div className="flex items-center justify-between rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] p-3.5">
                <div>
                  <div className="text-xs font-bold text-white">Estado Operativo</div>
                  <div className="text-[11px] text-[#B8B2A6]">
                    {editActivo ? 'Disponible para asignación de órdenes' : 'Inactivo / Baja en cuadrilla'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActivo(prev => !prev)}
                  className={`rounded-lg px-3 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    editActivo 
                      ? 'bg-[#3FA65C]/20 text-[#3FA65C] border border-[#3FA65C]/40' 
                      : 'bg-red-950/30 text-red-400 border border-red-900/50'
                  }`}
                >
                  {editActivo ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(243,239,231,0.08)]">
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  className="rounded-xl border border-[rgba(243,239,231,0.15)] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-[#C5A059] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#B38F46] cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Oficial de Gafete y Credencial QR */}
      <GafeteMecanicoModal
        mecanico={mecanicoSeleccionadoQR}
        abierto={modalQR}
        alCerrar={() => setModalQR(false)}
      />
    </div>
  )
}

export default TallerPersonal
