import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Power, 
  ShieldCheck,
  Building
} from 'lucide-react'
import { 
  getProveedores, 
  crearProveedor, 
  actualizarProveedor, 
  type ProveedorApi 
} from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'

export const ComprasProveedores: React.FC = () => {
  const { agregarToast } = useUiStore()

  const [proveedores, setProveedores] = useState<ProveedorApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos')

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [provAEditar, setProvAEditar] = useState<ProveedorApi | null>(null)

  // Formulario nuevo
  const [nombre, setNombre] = useState('')
  const [rfc, setRfc] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Formulario editar
  const [editNombre, setEditNombre] = useState('')
  const [editRfc, setEditRfc] = useState('')
  const [editActivo, setEditActivo] = useState(true)

  const cargarProveedores = async () => {
    setCargando(true)
    try {
      const lista = await getProveedores(true)
      setProveedores(lista)
    } catch {
      agregarToast({
        tipo: 'error',
        titulo: 'Error de Conexión',
        mensaje: 'No fue posible cargar el directorio de proveedores.',
      })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProveedores()
  }, [])

  const abrirEdicion = (p: ProveedorApi) => {
    setProvAEditar(p)
    setEditNombre(p.nombre)
    setEditRfc(p.rfc || '')
    setEditActivo(p.activo)
    setModalEditar(true)
  }

  const alternarActivo = async (p: ProveedorApi) => {
    const nuevoEstado = !p.activo
    try {
      await actualizarProveedor(p.id, { activo: nuevoEstado })
      agregarToast({
        tipo: 'success',
        titulo: nuevoEstado ? 'Proveedor Reactivado' : 'Baja Comercial Registrada',
        mensaje: `${p.nombre} ahora está ${nuevoEstado ? 'Activo' : 'Inactivo'} para compras.`,
      })
      await cargarProveedores()
    } catch {
      setProveedores(prev => prev.map(item => item.id === p.id ? { ...item, activo: nuevoEstado } : item))
      agregarToast({
        tipo: 'info',
        titulo: 'Estado Actualizado (Local)',
        mensaje: `${p.nombre} actualizado en memoria.`,
      })
    }
  }

  const manejarGuardarNuevo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setGuardando(true)
    try {
      const resp = await crearProveedor({
        nombre: nombre.trim(),
        rfc: rfc.trim() ? rfc.trim().toUpperCase() : undefined,
      })

      agregarToast({
        tipo: 'success',
        titulo: 'Proveedor Homologado',
        mensaje: `Se dio de alta a ${resp.nombre} en el catálogo de compras.`,
      })

      setModalNuevo(false)
      setNombre('')
      setRfc('')
      await cargarProveedores()
    } catch {
      const nuevo: ProveedorApi = {
        id: proveedores.length > 0 ? Math.max(...proveedores.map(p => p.id)) + 1 : 1,
        nombre: nombre.trim(),
        rfc: rfc.trim() ? rfc.trim().toUpperCase() : null,
        activo: true,
      }
      setProveedores(prev => [...prev, nuevo])
      setModalNuevo(false)
      setNombre('')
      setRfc('')
      agregarToast({
        tipo: 'success',
        titulo: 'Proveedor Creado (Local)',
        mensaje: `Se registró localmente a ${nombre.trim()}.`,
      })
    } finally {
      setGuardando(false)
    }
  }

  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provAEditar || !editNombre.trim()) return

    setGuardando(true)
    try {
      await actualizarProveedor(provAEditar.id, {
        nombre: editNombre.trim(),
        rfc: editRfc.trim() ? editRfc.trim().toUpperCase() : undefined,
        activo: editActivo,
      })

      agregarToast({
        tipo: 'success',
        titulo: 'Proveedor Actualizado',
        mensaje: `Se modificaron los datos de ${editNombre.trim()} exitosamente.`,
      })

      setModalEditar(false)
      setProvAEditar(null)
      await cargarProveedores()
    } catch {
      setProveedores(prev => prev.map(p => p.id === provAEditar.id ? {
        ...p,
        nombre: editNombre.trim(),
        rfc: editRfc.trim() ? editRfc.trim().toUpperCase() : null,
        activo: editActivo,
      } : p))
      setModalEditar(false)
      setProvAEditar(null)
      agregarToast({
        tipo: 'info',
        titulo: 'Proveedor Actualizado (Local)',
        mensaje: `Datos modificados localmente.`,
      })
    } finally {
      setGuardando(false)
    }
  }

  // Filtrado
  const proveedoresFiltrados = proveedores.filter(p => {
    const coincideTexto = 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.rfc && p.rfc.toLowerCase().includes(busqueda.toLowerCase())) ||
      `PROV-${String(p.id).padStart(3, '0')}`.toLowerCase().includes(busqueda.toLowerCase())

    if (!coincideTexto) return false
    if (filtroEstado === 'Activos' && !p.activo) return false
    if (filtroEstado === 'Inactivos' && p.activo) return false
    return true
  })

  // Métricas
  const total = proveedores.length
  const totalActivos = proveedores.filter(p => p.activo).length
  const totalInactivos = proveedores.filter(p => !p.activo).length
  const totalConRfc = proveedores.filter(p => !!p.rfc && p.rfc.trim() !== '').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(243,239,231,0.1)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F]">
              Módulo Compras
            </span>
            <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Directorio Comercial & Fiscal
            </span>
          </div>
          <h1 className="mt-1 font-['Barlow_Condensed'] text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
            Catálogo y Directorio de Proveedores
          </h1>
          <p className="text-xs text-[#B8B2A6]">
            Administración de razones sociales homologadas, claves RFC y estatus operativo para órdenes de compra y almacén.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarProveedores}
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
            <span>Registrar Proveedor</span>
          </button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Proveedores Totales</span>
            <Building2 className="h-4 w-4 text-[#F2620F]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-white tabular-nums">
            {total}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Empresas en padrón</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Proveedores Activos</span>
            <CheckCircle2 className="h-4 w-4 text-[#3FA65C]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#3FA65C] tabular-nums">
            {totalActivos}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Disponibles para compras</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Con RFC Validado</span>
            <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-[#C5A059] tabular-nums">
            {totalConRfc}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Facturación formal</div>
        </div>

        <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#14181D]/80 p-4">
          <div className="flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>Baja / Inactivos</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-1 font-['Barlow_Condensed'] text-3xl font-black text-red-400 tabular-nums">
            {totalInactivos}
          </div>
          <div className="text-[10px] text-[#B8B2A6] mt-0.5">Bloqueados temporalmente</div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B8B2A6]" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por razón social, RFC o folio PROV-00X..."
            className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-10 pr-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#1C1C1C] p-1 rounded-xl border border-[rgba(243,239,231,0.1)]">
          {(['Todos', 'Activos', 'Inactivos'] as const).map(est => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`rounded-lg px-3 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filtroEstado === est
                  ? 'bg-[#F2620F] text-[#16191E]'
                  : 'text-[#B8B2A6] hover:text-white'
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Densa de Proveedores */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
        <table className="w-full text-left text-xs text-[#f3f4f6]">
          <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Razón Social / Proveedor</th>
              <th className="px-4 py-3">Registro Federal (RFC)</th>
              <th className="px-4 py-3">Estatus Comercial</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(243,239,231,0.06)] font-['Barlow']">
            {cargando ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#B8B2A6]">
                  Cargando catálogo de proveedores...
                </td>
              </tr>
            ) : proveedoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#B8B2A6]">
                  No se encontraron proveedores que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              proveedoresFiltrados.map(p => {
                const folio = `PROV-${String(p.id).padStart(3, '0')}`

                return (
                  <tr key={p.id} className="hover:bg-[#14181D]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#C5A059]">
                      {folio}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C1C1C] border border-[rgba(243,239,231,0.1)] text-[#F2620F]">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {p.nombre}
                          </div>
                          <div className="text-[10px] text-[#B8B2A6]">Proveedor Autorizado</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.rfc ? (
                        <span className="rounded bg-[#1C1C1C] px-2 py-0.5 border border-[rgba(243,239,231,0.1)] text-[#f3f4f6]">
                          {p.rfc}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#B8B2A6]/50 italic">Sin RFC registrado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.activo ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[#3FA65C]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold text-[#3FA65C] uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-red-950/30 px-2 py-0.5 font-['Barlow_Condensed'] text-xs font-bold text-red-400 uppercase border border-red-900/40">
                          <XCircle className="h-3 w-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirEdicion(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-2.5 py-1.5 text-xs font-semibold text-[#B8B2A6] hover:text-white hover:border-white transition-all cursor-pointer"
                          title="Editar datos del proveedor"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => alternarActivo(p)}
                          className={`inline-flex items-center gap-1 rounded-lg border p-1.5 transition-all cursor-pointer ${
                            p.activo 
                              ? 'border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-200' 
                              : 'border-green-900/40 bg-green-950/20 text-green-400 hover:bg-green-900/40 hover:text-green-200'
                          }`}
                          title={p.activo ? 'Desactivar proveedor' : 'Reactivar proveedor'}
                        >
                          <Power className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Proveedor */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
                  <Building2 className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wide text-white">
                    Alta de Proveedor
                  </h3>
                  <p className="text-xs text-[#B8B2A6]">
                    Registra una nueva empresa en el padrón de compras
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

            <form onSubmit={manejarGuardarNuevo} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Razón Social / Nombre Comercial <span className="text-[#F2620F]">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Distribuidora Diésel del Norte S.A. de C.V."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Registro Federal de Contribuyentes (RFC)
                </label>
                <input
                  type="text"
                  value={rfc}
                  onChange={e => setRfc(e.target.value)}
                  placeholder="Ej. DDN980512AB3"
                  maxLength={13}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs uppercase font-mono text-white focus:border-[#F2620F] focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-[#B8B2A6]">
                  12 caracteres para personas morales, 13 para personas físicas.
                </p>
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
                  disabled={guardando || !nombre.trim()}
                  className="rounded-xl bg-[#F2620F] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Proveedor */}
      {modalEditar && provAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059] text-[#16191E]">
                  <Edit2 className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wide text-white">
                    Editar Proveedor
                  </h3>
                  <p className="text-xs text-[#B8B2A6]">
                    PROV-{String(provAEditar.id).padStart(3, '0')} · {provAEditar.nombre}
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
                  Razón Social / Nombre Comercial
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  RFC
                </label>
                <input
                  type="text"
                  value={editRfc}
                  onChange={e => setEditRfc(e.target.value)}
                  maxLength={13}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs uppercase font-mono text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              {/* Estado Operativo */}
              <div className="flex items-center justify-between rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] p-3.5">
                <div>
                  <div className="text-xs font-bold text-white">Estatus Comercial</div>
                  <div className="text-[11px] text-[#B8B2A6]">
                    {editActivo ? 'Habilitado para emitir compras' : 'Bloqueado / Inactivo'}
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
                  disabled={guardando || !editNombre.trim()}
                  className="rounded-xl bg-[#C5A059] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#B38F46] cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComprasProveedores
