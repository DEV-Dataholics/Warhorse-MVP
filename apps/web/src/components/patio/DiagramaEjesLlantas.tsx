import React, { useState } from 'react'
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  Gauge, 
  Disc, 
  Sparkles,
  Info
} from 'lucide-react'
import type { LlantaDiagrama } from '../../lib/inspeccionSchema'

interface Props {
  llantas: LlantaDiagrama[]
  onChangeLlantas: (llantas: LlantaDiagrama[]) => void
  medidaProfundidad: string
  onChangeMedidaProfundidad: (val: string) => void
  medidaLlantas: string
  onChangeMedidaLlantas: (val: string) => void
  tipoVehiculo?: 'tracto' | 'caja'
}

const PROFUNDIDADES_FRECUENTES = ['16/32"', '14/32"', '12/32"', '10/32"', '8/32"', '6/32"', '4/32"', '2/32"'] as const
const MEDIDAS_FRECUENTES = ['295/75R22.5', '11R22.5', '11R24.5', '285/75R24.5'] as const
const ESTADOS_LLANTA = [
  { valor: 'OK', label: 'Conforme (OK)', color: 'bg-[#3FA65C] text-[#16191E]', border: 'border-[#3FA65C]', icon: CheckCircle2 },
  { valor: 'Desgaste', label: 'Desgaste / Warning', color: 'bg-[#C5A059] text-[#16191E]', border: 'border-[#C5A059]', icon: AlertTriangle },
  { valor: 'Baja Presión', label: 'Baja Presión', color: 'bg-sky-500 text-[#16191E]', border: 'border-sky-400', icon: Gauge },
  { valor: 'Dañada', label: 'Dañada / Corte', color: 'bg-[#F2620F] text-[#16191E]', border: 'border-[#F2620F]', icon: ShieldAlert },
  { valor: 'Cambio', label: 'Reemplazo Urgente', color: 'bg-red-600 text-white', border: 'border-red-500', icon: X },
] as const

export const DiagramaEjesLlantas: React.FC<Props> = ({
  llantas,
  onChangeLlantas,
  medidaProfundidad,
  onChangeMedidaProfundidad,
  medidaLlantas,
  onChangeMedidaLlantas,
  tipoVehiculo = 'tracto',
}) => {
  const esCaja = tipoVehiculo === 'caja' || llantas.length === 8 || (llantas[0]?.id?.startsWith('caja_') ?? false)
  const [llantaSeleccionadaId, setLlantaSeleccionadaId] = useState<string | null>(null)

  const llantaActiva = llantas.find(l => l.id === llantaSeleccionadaId)

  const actualizarLlantaActiva = (cambios: Partial<LlantaDiagrama>) => {
    if (!llantaSeleccionadaId) return
    const nuevas = llantas.map(l => (l.id === llantaSeleccionadaId ? { ...l, ...cambios } : l))
    onChangeLlantas(nuevas)
  }

  const aprobarTodasLasLlantas = () => {
    const nuevas = llantas.map(l => ({
      ...l,
      estado: 'OK' as const,
      profundidad: medidaProfundidad || '14/32"',
      observacion: '',
    }))
    onChangeLlantas(nuevas)
  }

  const obtenerColorLlanta = (estado: LlantaDiagrama['estado']) => {
    switch (estado) {
      case 'OK':
        return 'bg-[#3FA65C]/20 border-[#3FA65C] text-[#3FA65C] shadow-[0_0_12px_rgba(63,166,92,0.25)]'
      case 'Desgaste':
        return 'bg-[#C5A059]/25 border-[#C5A059] text-[#C5A059] shadow-[0_0_12px_rgba(197,160,89,0.25)]'
      case 'Baja Presión':
        return 'bg-sky-500/25 border-sky-400 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
      case 'Dañada':
        return 'bg-[#F2620F]/30 border-[#F2620F] text-[#F2620F] shadow-[0_0_12px_rgba(242,98,15,0.35)]'
      case 'Cambio':
        return 'bg-red-600/30 border-red-500 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.35)]'
      default:
        return 'bg-[#1C1C1C] border-[rgba(243,239,231,0.2)] text-white'
    }
  }

  // Componente interactivo para cada llanta
  const RenderLlantaBoton = ({ id, posicion, esDual }: { id: string; posicion: string; esDual?: boolean }) => {
    const item = llantas.find(l => l.id === id)
    if (!item) return null
    const colorClasses = obtenerColorLlanta(item.estado)
    const estaSeleccionada = llantaSeleccionadaId === id

    return (
      <button
        type="button"
        onClick={() => setLlantaSeleccionadaId(id)}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 transition-all active:scale-95 cursor-pointer select-none ${
          esDual ? 'w-14 sm:w-16 h-20 sm:h-22' : 'w-16 sm:w-20 h-22 sm:h-24'
        } ${colorClasses} ${
          estaSeleccionada ? 'ring-4 ring-[#F2620F] ring-offset-2 ring-offset-[#0F0F10] scale-105 z-10' : 'hover:scale-102'
        }`}
        title={`${item.nombre} - ${item.estado} (${item.profundidad || 'S/M'})`}
      >
        {/* Ranuras de dibujo de llanta tipo industrial */}
        <div className="absolute inset-x-1.5 top-1.5 bottom-1.5 border border-white/10 rounded-lg flex flex-col justify-between py-1 pointer-events-none opacity-40">
          <div className="h-0.5 bg-white/40 w-full" />
          <div className="h-0.5 bg-white/40 w-full" />
          <div className="h-0.5 bg-white/40 w-full" />
        </div>

        <span className="font-['Barlow_Condensed'] text-xs sm:text-sm font-black tracking-wider uppercase drop-shadow">
          {posicion}
        </span>
        <span className="font-['Barlow_Condensed'] text-[10px] sm:text-xs font-extrabold uppercase mt-0.5">
          {item.profundidad || '—'}
        </span>
        <span className="text-[9px] font-mono font-bold uppercase tracking-tight opacity-90 truncate max-w-[90%]">
          {item.estado === 'OK' ? '✓ OK' : item.estado}
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-3xl border border-[rgba(243,239,231,0.12)] bg-[#101418] p-4 sm:p-6 space-y-6 shadow-2xl">
      {/* Encabezado del Diagrama */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[rgba(243,239,231,0.08)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#F2620F] px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-black uppercase tracking-wider text-[#16191E]">
              Formato Físico Oficial
            </span>
            <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              Esquema de Ejes y 10 Neumáticos
            </span>
          </div>
          <h3 className="font-['Barlow_Condensed'] text-xl sm:text-2xl font-black uppercase tracking-wide text-white mt-1 flex items-center gap-2">
            <Disc className="h-5 w-5 text-[#F2620F]" />
            <span>Diagrama de Inspección de Llantas (Tractocamión)</span>
          </h3>
          <p className="text-xs text-[#B8B2A6]">
            Toca directamente sobre cada llanta en la tableta para señalar desgaste, anomalías o calibrar su profundidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={aprobarTodasLasLlantas}
            className="flex items-center gap-1.5 rounded-xl border border-[#3FA65C]/50 bg-[#3FA65C]/15 px-3.5 py-2 font-['Barlow_Condensed'] text-xs font-black uppercase tracking-wider text-[#3FA65C] hover:bg-[#3FA65C] hover:text-[#16191E] transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            <span>{esCaja ? '8 Ruedas de Caja OK (14/32")' : 'Todas las Llantas OK (14/32")'}</span>
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: Diagrama Cenital del Tracto + Panel de Ajuste Táctil */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Diagrama Cenital del Chasis (Lado Izquierdo o Central) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border border-[rgba(243,239,231,0.08)] bg-[#0A0D10] relative overflow-hidden">
          {/* Guía frontal del vehículo */}
          <div className="w-full max-w-xs flex items-center justify-between text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-[#B8B2A6]/60 mb-3 border-b border-white/5 pb-1">
            <span>{esCaja ? 'Perno Rey (Frontal)' : 'Frente (Defensa)'}</span>
            <span className={esCaja ? 'text-[#C5A059]' : 'text-[#F2620F]'}>▲ Sentido de Marcha ▲</span>
            <span>{esCaja ? 'Área Patines' : 'Cabina'}</span>
          </div>

          {/* Chasis Central y Ejes */}
          <div className="relative w-full max-w-md py-4 flex flex-col items-center gap-6 sm:gap-8">
            {/* Viga central del chasis simulada */}
            <div className={`absolute inset-y-0 ${esCaja ? 'w-24 sm:w-28 border-[#C5A059]/20' : 'w-16 sm:w-20 border-white/10'} bg-gradient-to-b from-[#1C2026] via-[#15191F] to-[#12151A] rounded-xl border shadow-inner flex flex-col items-center justify-between py-6 pointer-events-none`}>
              <span className="text-[10px] font-['Barlow_Condensed'] font-black text-white/30 uppercase tracking-widest rotate-90 my-auto">
                {esCaja ? 'ESTRUCTURA TRAILA' : 'CHASIS CENTRAL'}
              </span>
            </div>

            {/* SI ES TRACTO: EJE 1 DIRECCIONAL (2 Llantas Sencillas) */}
            {!esCaja && (
              <>
                <div className="relative z-10 w-full flex items-center justify-between px-2 sm:px-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6] uppercase">
                      P1 · Izq
                    </span>
                    <RenderLlantaBoton id="llanta_1" posicion="D-IZQ" />
                  </div>

                  <div className="flex-1 h-3.5 bg-[#252B33] border-y border-white/20 mx-2 rounded-sm flex items-center justify-center shadow-md">
                    <span className="text-[9px] font-['Barlow_Condensed'] font-extrabold text-white/70 uppercase tracking-wider">
                      EJE 1 DIRECCIONAL
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6] uppercase">
                      P2 · Der
                    </span>
                    <RenderLlantaBoton id="llanta_2" posicion="D-DER" />
                  </div>
                </div>

                <div className="relative z-10 w-44 h-8 rounded-lg border border-dashed border-[#C5A059]/30 bg-[#C5A059]/10 flex items-center justify-center text-[10px] font-['Barlow_Condensed'] font-bold text-[#C5A059] uppercase tracking-wider">
                  Plato Quinta Rueda
                </div>
              </>
            )}

            {/* SI ES CAJA: FRENTE Y PATINES (Sin eje delantero) */}
            {esCaja && (
              <div className="relative z-10 w-full flex flex-col items-center gap-2 pt-2">
                <div className="w-52 h-9 rounded-xl border-2 border-[#C5A059]/40 bg-[#C5A059]/10 flex items-center justify-center text-[11px] font-['Barlow_Condensed'] font-black text-[#C5A059] uppercase tracking-wider shadow-md">
                  Perno Rey · King Pin
                </div>
                <div className="w-64 h-7 border border-dashed border-white/20 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6] uppercase">
                  Zona de Patines / Apoyo
                </div>
                <div className="h-10 flex items-center text-[9px] font-mono text-[#B8B2A6]/40 uppercase tracking-widest">
                  — Cuerpo de Caja / Traila —
                </div>
              </div>
            )}

            {/* EJE TANDEM 1 (Tracto Eje 2 o Caja Eje 1) - 4 Llantas Duales */}
            <div className="relative z-10 w-full flex items-center justify-between px-1 sm:px-2">
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T1-Ext' : 'P3'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[0]?.id || 'caja_e1_ext_izq') : 'llanta_3'} posicion={esCaja ? 'T1-EXT' : 'T1-EXT'} esDual />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T1-Int' : 'P4'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[1]?.id || 'caja_e1_int_izq') : 'llanta_4'} posicion={esCaja ? 'T1-INT' : 'T1-INT'} esDual />
                </div>
              </div>

              <div className="flex-1 h-3.5 bg-[#252B33] border-y border-white/20 mx-2 rounded-sm flex items-center justify-center shadow-md">
                <span className={`text-[9px] font-['Barlow_Condensed'] font-extrabold uppercase tracking-wider truncate px-1 ${esCaja ? 'text-[#C5A059]' : 'text-white/70'}`}>
                  {esCaja ? 'EJE 1 TANDEM CAJA' : 'EJE 2 TANDEM INTERMEDIO'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T1-Int' : 'P5'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[2]?.id || 'caja_e1_int_der') : 'llanta_5'} posicion={esCaja ? 'T1-INT' : 'T1-INT'} esDual />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T1-Ext' : 'P6'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[3]?.id || 'caja_e1_ext_der') : 'llanta_6'} posicion={esCaja ? 'T1-EXT' : 'T1-EXT'} esDual />
                </div>
              </div>
            </div>

            {/* EJE TANDEM 2 (Tracto Eje 3 o Caja Eje 2) - 4 Llantas Duales */}
            <div className="relative z-10 w-full flex items-center justify-between px-1 sm:px-2">
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T2-Ext' : 'P7'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[4]?.id || 'caja_e2_ext_izq') : 'llanta_7'} posicion={esCaja ? 'T2-EXT' : 'T2-EXT'} esDual />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T2-Int' : 'P8'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[5]?.id || 'caja_e2_int_izq') : 'llanta_8'} posicion={esCaja ? 'T2-INT' : 'T2-INT'} esDual />
                </div>
              </div>

              <div className="flex-1 h-3.5 bg-[#252B33] border-y border-white/20 mx-2 rounded-sm flex items-center justify-center shadow-md">
                <span className={`text-[9px] font-['Barlow_Condensed'] font-extrabold uppercase tracking-wider truncate px-1 ${esCaja ? 'text-[#C5A059]' : 'text-white/70'}`}>
                  {esCaja ? 'EJE 2 TANDEM CAJA' : 'EJE 3 TANDEM TRASERO'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T2-Int' : 'P9'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[6]?.id || 'caja_e2_int_der') : 'llanta_9'} posicion={esCaja ? 'T2-INT' : 'T2-INT'} esDual />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-[#B8B2A6]">
                    {esCaja ? 'T2-Ext' : 'P10'}
                  </span>
                  <RenderLlantaBoton id={esCaja ? (llantas[7]?.id || 'caja_e2_ext_der') : 'llanta_10'} posicion={esCaja ? 'T2-EXT' : 'T2-EXT'} esDual />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs flex items-center justify-center text-[11px] font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-[#B8B2A6]/60 mt-4 border-t border-white/5 pt-1.5">
            <span>{esCaja ? 'Puertas Traseras / Placas y Defensas de Caja' : 'Parte Trasera (Lodera / Luces de Stop)'}</span>
          </div>
        </div>

        {/* Panel Lateral: Ajuste Rápido Táctil de Llanta Seleccionada (Tablet Friendly) */}
        <div className="lg:col-span-5 space-y-4">
          {llantaActiva ? (
            <div className="rounded-2xl border-2 border-[#F2620F] bg-[#14181D] p-4 sm:p-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-right-4 duration-150">
              <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] pb-3">
                <div>
                  <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-black uppercase text-[#F2620F]">
                    {llantaActiva.posicion} · Eje {llantaActiva.eje}
                  </span>
                  <h4 className="font-['Barlow_Condensed'] text-lg font-black uppercase text-white mt-1">
                    {llantaActiva.nombre}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setLlantaSeleccionadaId(null)}
                  className="rounded-full p-1.5 text-[#B8B2A6] hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Selector de Estado de Neumático */}
              <div>
                <label className="mb-1.5 block text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#B8B2A6]">
                  Estado del Neumático:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ESTADOS_LLANTA.map(st => {
                    const Icono = st.icon
                    const activo = llantaActiva.estado === st.valor
                    return (
                      <button
                        key={st.valor}
                        type="button"
                        onClick={() => actualizarLlantaActiva({ estado: st.valor as LlantaDiagrama['estado'] })}
                        className={`flex items-center gap-2 h-11 px-3 rounded-xl border text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activo
                            ? `${st.color} ${st.border} font-black shadow-md scale-[1.02]`
                            : 'border-[rgba(243,239,231,0.1)] bg-[#0F0F10] text-[#B8B2A6] hover:text-white hover:border-white/30'
                        }`}
                      >
                        <Icono className="h-4 w-4 shrink-0" />
                        <span className="truncate">{st.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selector Rápido de Profundidad de Dibujo */}
              <div>
                <label className="mb-1.5 block text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#B8B2A6]">
                  Profundidad de Dibujo (Medida de Banda):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PROFUNDIDADES_FRECUENTES.map(prof => (
                    <button
                      key={prof}
                      type="button"
                      onClick={() => actualizarLlantaActiva({ profundidad: prof })}
                      className={`h-9 rounded-xl border font-['Barlow_Condensed'] text-xs font-bold transition-all cursor-pointer ${
                        llantaActiva.profundidad === prof
                          ? 'bg-[#C5A059] border-[#C5A059] text-[#16191E] font-black shadow-md'
                          : 'border-[rgba(243,239,231,0.1)] bg-[#0F0F10] text-[#B8B2A6] hover:text-white'
                      }`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observación o Falla en Neumático */}
              <div>
                <label className="mb-1.5 block text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-[#B8B2A6]">
                  Anomalía / Observación en esta Rueda:
                </label>
                <input
                  type="text"
                  value={llantaActiva.observacion || ''}
                  onChange={e => actualizarLlantaActiva({ observacion: e.target.value })}
                  placeholder="Ej: Desgaste en cara externa, clavo visible..."
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#0F0F10] py-2 px-3 text-xs text-white placeholder-[#B8B2A6]/40 focus:border-[#F2620F] focus:outline-none font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => setLlantaSeleccionadaId(null)}
                className="w-full py-2.5 rounded-xl bg-[#F2620F] font-['Barlow_Condensed'] text-xs font-black uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer shadow-md"
              >
                Confirmar Llanta {llantaActiva.posicion}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D]/60 p-6 text-center flex flex-col items-center justify-center min-h-[280px] space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-[#0F0F10] border border-white/10 flex items-center justify-center text-[#C5A059]">
                <Disc className="h-8 w-8 animate-pulse" />
              </div>
              <div className="font-['Barlow_Condensed'] text-base font-black uppercase text-white">
                Ninguna Rueda Seleccionada
              </div>
              <p className="text-xs text-[#B8B2A6] max-w-xs leading-relaxed">
                Toca cualquiera de las 10 posiciones de llanta en el diagrama para ver su estado actual o ingresar su medida individual.
              </p>
            </div>
          )}

          {/* Campos Generales del Formato Físico al Pie del Diagrama */}
          <div className="rounded-2xl border border-[rgba(243,239,231,0.1)] bg-[#14181D] p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-['Barlow_Condensed'] font-bold text-[#C5A059] uppercase">
              <Info className="h-4 w-4" />
              <span>Campos Generales de Neumáticos (Formato Papel)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Medida de profundidad de Llantas
                </label>
                <input
                  type="text"
                  value={medidaProfundidad}
                  onChange={e => onChangeMedidaProfundidad(e.target.value)}
                  placeholder='Ej: 12/32" ó 14/32"'
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#0F0F10] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#B8B2A6]">
                  Medida Llantas (Dimensión)
                </label>
                <input
                  type="text"
                  value={medidaLlantas}
                  onChange={e => onChangeMedidaLlantas(e.target.value)}
                  placeholder="Ej: 295/75R22.5"
                  className="w-full rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#0F0F10] py-2 px-3 font-['Barlow_Condensed'] text-sm font-bold text-white focus:border-[#F2620F] focus:outline-none"
                />
              </div>
            </div>

            {/* Chips de selección rápida para Medida de Llantas */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-['Barlow_Condensed'] text-[#B8B2A6]">Medidas usuales:</span>
              {MEDIDAS_FRECUENTES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeMedidaLlantas(m)}
                  className={`h-6 px-2 rounded-md font-['Barlow_Condensed'] text-[11px] font-bold transition-all cursor-pointer ${
                    medidaLlantas === m
                      ? 'bg-[#F2620F] text-[#16191E]'
                      : 'bg-[#0F0F10] border border-white/10 text-[#B8B2A6] hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
