import React, { useState } from 'react'
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  Trash2, 
  Send 
} from 'lucide-react'
import { liberarUnidad } from '../../lib/api'
import { useUiStore } from '../../store/useUiStore'
import { marcarInspeccionesUnidadResueltas } from '../../lib/inspeccionStorage'

interface Props {
  registroTaller: {
    id: number
    unidad_id: number
    id_unidad: string
    diagnostico: string
    folio_ot?: string
  } | null
  abierto: boolean
  alCerrar: () => void
  alExito: () => void
}

export const TallerLiberacionModal: React.FC<Props> = ({
  registroTaller,
  abierto,
  alCerrar,
  alExito,
}) => {
  const { agregarToast } = useUiStore()

  const [tipoLiberacion, setTipoLiberacion] = useState<'Total' | 'Parcial'>('Total')
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().substring(0, 10))
  const [costoTaller, setCostoTaller] = useState<number>(1500)
  const [pendientes, setPendientes] = useState<string[]>([])
  const [nuevoPendiente, setNuevoPendiente] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!abierto || !registroTaller) return null

  const agregarItemPendiente = () => {
    if (!nuevoPendiente.trim()) return
    setPendientes([...pendientes, nuevoPendiente.trim()])
    setNuevoPendiente('')
  }

  const removerPendiente = (idx: number) => {
    setPendientes(pendientes.filter((_, i) => i !== idx))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (tipoLiberacion === 'Parcial' && pendientes.length === 0) {
      setError('En liberación parcial es obligatorio registrar al menos un trabajo pendiente.')
      return
    }

    setCargando(true)
    try {
      await liberarUnidad(registroTaller.id, {
        tipo_liberacion: tipoLiberacion,
        fecha_salida: fechaSalida,
        costo_taller: Number(costoTaller) || 0,
        pendientes: tipoLiberacion === 'Parcial' ? pendientes : undefined,
      })

      agregarToast({
        tipo: tipoLiberacion === 'Total' ? 'success' : 'warning',
        titulo: tipoLiberacion === 'Total' ? 'Unidad Liberada al 100%' : 'Unidad Liberada con Warning',
        mensaje: tipoLiberacion === 'Total'
          ? `La unidad ${registroTaller.id_unidad} regresó a estatus Activo al 100%.`
          : `La unidad ${registroTaller.id_unidad} salió con Warning. Sus pendientes pueden retomarse bajo la misma OT.`,
      })

      // Resolver y cerrar trazabilidad de inspecciones de patio de esta unidad
      await marcarInspeccionesUnidadResueltas(
        registroTaller.id_unidad,
        registroTaller.folio_ot || `OT-${registroTaller.id}`
      ).catch(() => {})

      alExito()
      alCerrar()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la liberación de la unidad.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
              <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                MÓDULO DE CONCLUSIÓN Y SALIDA
              </div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-extrabold uppercase tracking-wide text-white">
                Liberar Unidad {registroTaller.id_unidad}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="text-[#B8B2A6] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={manejarEnvio} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-[#F2620F]/30 bg-[#F2620F]/10 p-3 text-xs text-[#F2620F]">
              {error}
            </div>
          )}

          {/* Selector de Tipo de Liberación */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#B8B2A6]">
              Tipo de Liberación Operativa
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoLiberacion('Total')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  tipoLiberacion === 'Total'
                    ? 'border-[#3FA65C] bg-[#3FA65C]/10 text-white shadow-md'
                    : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:border-[#3FA65C]/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#3FA65C]">
                  <CheckCircle2 className="h-4 w-4" />
                  Liberación Total
                </div>
                <div className="text-[11px] text-[#B8B2A6] mt-1">
                  Trabajo 100% concluido. Unidad regresa a estado Activo disponible.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipoLiberacion('Parcial')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  tipoLiberacion === 'Parcial'
                    ? 'border-[#E0C36A] bg-[#E0C36A]/10 text-white shadow-md'
                    : 'border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] text-[#B8B2A6] hover:border-[#E0C36A]/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#E0C36A]">
                  <AlertTriangle className="h-4 w-4" />
                  Liberación Parcial
                </div>
                <div className="text-[11px] text-[#B8B2A6] mt-1">
                  Sale con "Warning". Permite retomar trabajos con el mismo folio de OT.
                </div>
              </button>
            </div>
          </div>

          {/* Fecha de Salida y Costo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Fecha de Salida
              </label>
              <input
                type="date"
                value={fechaSalida}
                onChange={e => setFechaSalida(e.target.value)}
                className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 px-3 text-xs text-white focus:border-[#F2620F] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                Costo Mano de Obra ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#B8B2A6]" />
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={costoTaller}
                  onChange={e => setCostoTaller(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] py-2 pl-8 pr-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bloque de Pendientes (Obligatorio si es Parcial) */}
          {tipoLiberacion === 'Parcial' && (
            <div className="rounded-xl border border-[#E0C36A]/30 bg-[#E0C36A]/10 p-3.5 space-y-2.5 animate-in fade-in duration-150">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#E0C36A] font-['Barlow_Condensed']">
                Pendientes que originan el Warning (Obligatorio)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoPendiente}
                  onChange={e => setNuevoPendiente(e.target.value)}
                  placeholder="Ej. Cambio de balatas pendiente para próximo viaje..."
                  className="flex-1 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] py-1.5 px-3 text-xs text-white placeholder-[#B8B2A6]/50 focus:border-[#F2620F] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={agregarItemPendiente}
                  className="flex items-center gap-1 rounded-xl bg-[#E0C36A] px-3 py-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#16191E] hover:bg-[#c2a654] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </button>
              </div>

              {pendientes.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {pendientes.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-[#14181D] p-2 text-xs text-white"
                    >
                      <span>⚠️ {item}</span>
                      <button
                        type="button"
                        onClick={() => removerPendiente(idx)}
                        className="text-[#B8B2A6] hover:text-[#F2620F] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(243,239,231,0.08)]">
            <button
              type="button"
              onClick={alCerrar}
              className="rounded-xl border border-[rgba(243,239,231,0.15)] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex items-center gap-2 rounded-xl bg-[#F2620F] px-6 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              {cargando ? 'Procesando...' : 'Confirmar Liberación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
