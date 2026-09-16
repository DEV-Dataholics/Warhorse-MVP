import React from 'react'
import { useNavigate } from 'react-router'
import { 
  X, 
  Printer, 
  Download, 
  ShoppingCart, 
  Box,
  Truck
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { 
  PUNTOS_INSPECCION_REMOLQUE_TALLER, 
  LLANTAS_REMOLQUE_POSICIONES,
  type ReporteRemolqueTallerForm 
} from '../../lib/tallerSchema'

export interface DetalleOTRemolque {
  id: number
  folio: string
  tipo: 'Correctivo' | 'Preventivo' | 'Mantenimiento'
  estado: 'Activa' | 'En Proceso' | 'Liberada' | 'Liberada Parcial' | 'Cerrada'
  unidad_id: string
  unidad_nombre?: string
  tipo_unidad?: string
  responsable_nombre: string
  responsable_rol?: string
  diagnostico: string
  criticidad?: 'Rápida' | 'Media' | 'Crítico'
  fecha_ingreso: string
  fecha_salida?: string | null
  costo_taller?: number
  materiales?: Array<{ pieza: string; cantidad: number; origen?: string }>
  reporte_remolque?: ReporteRemolqueTallerForm
}

interface Props {
  ot: DetalleOTRemolque | null
  abierto: boolean
  alCerrar: () => void
}

export const OrdenRemolqueModal: React.FC<Props> = ({ ot, abierto, alCerrar }) => {
  const navigate = useNavigate()
  if (!abierto || !ot) return null

  const rep = ot.reporte_remolque
  const numFisico = rep?.numero_reporte_fisico || '478'
  const remolqueId = rep?.remolque || ot.unidad_id || 'A054'
  const tipoEquipo = rep?.tipo_equipo || 'CAJA SECA'
  const fechaEntrada = rep?.fecha_entrada || ot.fecha_ingreso || new Date().toISOString().slice(0, 10)
  const fechaSalida = rep?.fecha_salida || ot.fecha_salida || fechaEntrada
  const mecanico = rep?.mecanico || ot.responsable_nombre || 'Angel Byanda'
  const jefeTaller = rep?.jefe_taller || 'Manuel Tamp...'

  const descargarPdf = () => {
    const doc = new jsPDF()

    // Encabezado
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(22, 25, 30)
    doc.text('WARHORSE MÉXICO - CONTROL DE TALLER DE REMOLQUES', 14, 14)

    doc.setFontSize(11)
    doc.setTextColor(180, 67, 10)
    doc.text('INSPECCION DE ENTRADA Y SALIDA DE REMOLQUES DE TALLER', 14, 21)
    doc.setTextColor(217, 40, 40)
    doc.setFontSize(14)
    doc.text(`№  ${numFisico}`, 175, 21)

    doc.setDrawColor(200, 200, 200)
    doc.line(14, 24, 196, 24)

    // Datos generales
    doc.setFontSize(8)
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'bold')

    doc.text(`REMOLQUE: ${remolqueId}`, 14, 30)
    doc.text(`FECHA ENTRADA: ${fechaEntrada}`, 65, 30)
    doc.text(`FECHA SALIDA: ${fechaSalida}`, 115, 30)
    doc.text(`MECÁNICO: ${mecanico}`, 155, 30)

    doc.text(
      `TIPO DE EQUIPO:  [${tipoEquipo === 'CAJA SECA' ? 'X' : ' '}] CAJA SECA    [${
        tipoEquipo === 'REFRIGERADO' ? 'X' : ' '
      }] REFRIGERADO    [${tipoEquipo === 'PLATAFORMA' ? 'X' : ' '}] PLATAFORMA`,
      14,
      36
    )

    doc.setDrawColor(180, 180, 180)
    doc.line(14, 39, 196, 39)

    // Tabla de 18 puntos
    doc.setFillColor(70, 70, 70)
    doc.rect(14, 42, 182, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.text('MARQUE CON UNA [X] SI CUMPLE CON EL REQUISITO "OK" O "NECESITA REPARACION" [X]', 18, 46.5)

    doc.setFillColor(240, 240, 240)
    doc.rect(14, 48, 134, 5, 'F')
    doc.rect(148, 48, 24, 5, 'F')
    doc.rect(172, 48, 24, 5, 'F')
    doc.setTextColor(50, 50, 50)
    doc.text('PUNTO DE INSPECCIÓN', 18, 51.5)
    doc.text('OK', 158, 51.5)
    doc.text('NEC. REP.', 176, 51.5)

    let y = 57
    PUNTOS_INSPECCION_REMOLQUE_TALLER.forEach((punto) => {
      const estado = rep?.puntos?.[punto.id] || 'OK'
      const esOk = estado === 'OK'
      const esRep = estado === 'NECESITA REPARACION'

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(30, 30, 30)
      doc.text(`${punto.numero}. ${punto.etiqueta}`, 16, y)

      doc.setFont('helvetica', 'bold')
      doc.text(esOk ? '[ X ]' : '[   ]', 157, y)
      doc.text(esRep ? '[ X ]' : '[   ]', 178, y)

      doc.setDrawColor(230, 230, 230)
      doc.line(14, y + 1.5, 196, y + 1.5)
      y += 5.2
    })

    // Tabla de Llantas
    y += 2
    doc.setFillColor(70, 70, 70)
    doc.rect(14, y, 182, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.text('LLANTAS (POSICIONES TANDEM DEL REMOLQUE)', 18, y + 3.5)

    y += 5
    doc.setFontSize(6.5)
    doc.setTextColor(40, 40, 40)
    doc.setFillColor(245, 245, 245)
    doc.rect(14, y, 38, 5, 'F')
    doc.text('Posición de llanta:', 16, y + 3.5)

    LLANTAS_REMOLQUE_POSICIONES.forEach((pos, i) => {
      const xCol = 52 + i * 18
      doc.rect(xCol, y, 18, 5, 'S')
      doc.text(`${pos}`, xCol + 7, y + 3.5)
    })

    y += 5
    doc.rect(14, y, 38, 5, 'F')
    doc.text('Estado:', 16, y + 3.5)

    LLANTAS_REMOLQUE_POSICIONES.forEach((pos, i) => {
      const xCol = 52 + i * 18
      const st = rep?.llantas?.[pos] || 'OK'
      doc.rect(xCol, y, 18, 5, 'S')
      doc.setFont('helvetica', 'bold')
      doc.text(st === 'OK' ? 'OK' : 'REP', xCol + 4, y + 3.5)
      doc.setFont('helvetica', 'normal')
    })

    // Comentarios y Materiales
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('Comentarios:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const comentLineas = doc.splitTextToSize(rep?.comentarios || ot.diagnostico || 'Sin comentarios registrados.', 180)
    doc.text(comentLineas, 14, y + 4)

    y += Math.max(12, comentLineas.length * 4) + 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('Material que se utilizó:', 14, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const mats = rep?.materiales && rep.materiales.length > 0 
      ? rep.materiales.map(m => `${m.cantidad} ${m.descripcion} (${m.origen})`).join(', ')
      : ot.materiales && ot.materiales.length > 0 
        ? ot.materiales.map(m => `${m.cantidad} ${m.pieza}`).join(', ')
        : 'Ninguno registrado.'
    const matLineas = doc.splitTextToSize(mats, 180)
    doc.text(matLineas, 14, y + 4)

    // Firmas
    y = 270
    doc.setDrawColor(100, 100, 100)
    doc.line(25, y, 85, y)
    doc.line(125, y, 185, y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(mecanico, 55, y - 2, { align: 'center' })
    doc.text('Firma Mecánico', 55, y + 4, { align: 'center' })

    doc.text(jefeTaller, 155, y - 2, { align: 'center' })
    doc.text('Firma Jefe de taller', 155, y + 4, { align: 'center' })

    doc.save(`Inspeccion_Remolque_${numFisico}_${remolqueId}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] p-5 sm:p-6 shadow-2xl text-white my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Barra Superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(243,239,231,0.1)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F]/15 border border-[#F2620F]/40 text-[#F2620F]">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-white">
                  Inspección Oficial de Remolque
                </h3>
                <span className="rounded-md bg-red-950/80 px-2 py-0.5 font-mono text-xs font-black text-red-400 border border-red-800/60">
                  № {numFisico}
                </span>
              </div>
              <p className="font-['Barlow'] text-xs text-[#B8B2A6]">
                Folio OT: <span className="font-mono text-white font-bold">{ot.folio}</span> | Remolque: <span className="font-mono text-[#F2620F] font-bold">{remolqueId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPdf}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3 py-2 text-xs font-bold text-white hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-[#F2620F] px-3.5 py-2 text-xs font-bold text-[#16191E] hover:bg-[#d9530d] transition-all cursor-pointer shadow-lg"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="rounded-xl border border-[rgba(243,239,231,0.1)] p-2 text-[#B8B2A6] hover:bg-[#1C1C1C] hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CONTENEDOR DOCUMENTO FÍSICO DIGITAL (RÉPLICA 1:1) */}
        <div className="mt-5 rounded-xl border-2 border-[rgba(243,239,231,0.2)] bg-[#FAFAF8] text-[#16191E] p-5 sm:p-7 shadow-inner relative overflow-hidden font-sans">
          
          {/* Marca de agua WarHorse */}
          <div className="absolute right-4 top-24 pointer-events-none opacity-5 font-black text-7xl uppercase tracking-widest select-none text-black">
            WARHORSE
          </div>

          {/* Encabezado Impreso */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black/80 pb-3 gap-2">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-black">
              INSPECCION DE ENTRADA Y SALIDA DE REMOLQUES DE TALLER
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600">№</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-red-600 tracking-wider">
                {numFisico}
              </span>
            </div>
          </div>

          {/* Metadatos de Cabecera */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-black/40 py-2.5 text-[11px]">
            <div>
              <span className="font-bold uppercase text-black/70">REMOLQUE:</span>
              <div className="font-mono font-black text-sm text-blue-900">{remolqueId}</div>
            </div>
            <div>
              <span className="font-bold uppercase text-black/70">FECHA ENTRADA:</span>
              <div className="font-mono font-bold text-black">{fechaEntrada}</div>
            </div>
            <div>
              <span className="font-bold uppercase text-black/70">FECHA SALIDA:</span>
              <div className="font-mono font-bold text-black">{fechaSalida}</div>
            </div>
            <div>
              <span className="font-bold uppercase text-black/70">MECÁNICO:</span>
              <div className="font-medium text-black">{mecanico}</div>
            </div>
          </div>

          {/* Tipo de Equipo Checkboxes */}
          <div className="flex flex-wrap items-center gap-5 border-b border-black/40 py-2 text-[11px] font-bold">
            <span className="uppercase text-black/70">TIPO DE EQUIPO:</span>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-4 h-4 border border-black font-mono text-[10px] ${tipoEquipo === 'CAJA SECA' ? 'bg-black text-white font-bold' : 'bg-white'}`}>
                {tipoEquipo === 'CAJA SECA' ? '✓' : ''}
              </span>
              <span className="uppercase">CAJA SECA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-4 h-4 border border-black font-mono text-[10px] ${tipoEquipo === 'REFRIGERADO' ? 'bg-black text-white font-bold' : 'bg-white'}`}>
                {tipoEquipo === 'REFRIGERADO' ? '✓' : ''}
              </span>
              <span className="uppercase">REFRIGERADO</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-4 h-4 border border-black font-mono text-[10px] ${tipoEquipo === 'PLATAFORMA' ? 'bg-black text-white font-bold' : 'bg-white'}`}>
                {tipoEquipo === 'PLATAFORMA' ? '✓' : ''}
              </span>
              <span className="uppercase">PLATAFORMA</span>
            </div>
          </div>

          {/* BANNER REQUISITO CHECKLIST */}
          <div className="bg-[#4A4A48] text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 text-center mt-2.5">
            MARQUE CON UNA ☑ SI CUMPLE CON EL REQUISITO "OK" O "NECESITA REPARACION" ☒
          </div>

          {/* TABLA OFICIAL DE 18 PUNTOS */}
          <div className="border border-black/50 mt-1">
            <div className="grid grid-cols-12 bg-black/5 text-[10px] font-black uppercase border-b border-black/40 py-1 px-2">
              <div className="col-span-8">Componente / Sistema</div>
              <div className="col-span-2 text-center border-l border-black/30">OK</div>
              <div className="col-span-2 text-center border-l border-black/30">NECESITA REPARACIÓN</div>
            </div>

            <div className="divide-y divide-black/20 text-[11px]">
              {PUNTOS_INSPECCION_REMOLQUE_TALLER.map((punto) => {
                const estado = rep?.puntos?.[punto.id] || 'OK'
                const esOk = estado === 'OK'
                const esRep = estado === 'NECESITA REPARACION'

                return (
                  <div key={punto.id} className="grid grid-cols-12 py-1 px-2 items-center hover:bg-black/5">
                    <div className="col-span-8 font-medium">
                      <span className="text-black/50 font-mono text-[10px] mr-1.5">{punto.numero}.</span>
                      {punto.etiqueta}
                    </div>
                    <div className="col-span-2 text-center border-l border-black/20 font-bold">
                      {esOk && <span className="inline-block text-blue-700 font-mono text-xs">✓</span>}
                    </div>
                    <div className="col-span-2 text-center border-l border-black/20 font-bold">
                      {esRep && <span className="inline-block text-red-600 font-mono text-xs">✗</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECCIÓN LLANTAS (POSICIONES 11 AL 18) */}
          <div className="mt-3 border border-black/50">
            <div className="bg-[#4A4A48] text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 text-center">
              LLANTAS (POSICIONES TANDEM 11 A 18)
            </div>
            <div className="grid grid-cols-9 text-[10px] divide-x divide-black/30 border-b border-black/30 bg-black/5 font-bold text-center">
              <div className="py-1 px-1 text-left">Posición:</div>
              {LLANTAS_REMOLQUE_POSICIONES.map(pos => (
                <div key={pos} className="py-1 font-mono">{pos}</div>
              ))}
            </div>
            <div className="grid grid-cols-9 text-[10px] divide-x divide-black/30 font-medium text-center">
              <div className="py-1 px-1 text-left font-bold text-black/70">Estado:</div>
              {LLANTAS_REMOLQUE_POSICIONES.map(pos => {
                const st = rep?.llantas?.[pos] || 'OK'
                return (
                  <div key={pos} className={`py-1 font-bold ${st === 'OK' ? 'text-blue-700' : 'text-red-600'}`}>
                    {st === 'OK' ? 'OK' : 'REP'}
                  </div>
                )
              })}
            </div>
          </div>

          {/* COMENTARIOS */}
          <div className="mt-3 border-t border-black/40 pt-2 text-xs">
            <span className="font-bold uppercase text-black/80 block mb-1">Comentarios:</span>
            <div className="min-h-[44px] bg-white border border-black/20 rounded p-2 text-xs font-mono whitespace-pre-wrap">
              {rep?.comentarios || ot.diagnostico || 'Sin comentarios registrados.'}
            </div>
          </div>

          {/* MATERIAL QUE SE UTILIZÓ */}
          <div className="mt-2.5 border-t border-black/40 pt-2 text-xs">
            <span className="font-bold uppercase text-black/80 block mb-1">Material que se utilizó:</span>
            {rep?.materiales && rep.materiales.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white border border-black/20 rounded p-2 text-xs font-mono">
                {rep.materiales.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-black/10 pb-0.5">
                    <span>• {m.cantidad}x {m.descripcion}</span>
                    <span className="text-[10px] text-black/50 uppercase">[{m.origen}]</span>
                  </div>
                ))}
              </div>
            ) : ot.materiales && ot.materiales.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white border border-black/20 rounded p-2 text-xs font-mono">
                {ot.materiales.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-black/10 pb-0.5">
                    <span>• {m.cantidad}x {m.pieza}</span>
                    <span className="text-[10px] text-black/50 uppercase">[{m.origen || 'Almacén'}]</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-black/20 rounded p-2 text-xs text-black/50 italic">
                No se registraron materiales o refacciones.
              </div>
            )}
          </div>

          {/* FIRMAS AL PIE */}
          <div className="mt-6 grid grid-cols-2 gap-8 pt-6 border-t border-black/30 text-center">
            <div>
              <div className="border-b border-black mx-auto w-48 font-script text-base sm:text-lg italic text-black/90 pb-0.5">
                {mecanico}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-black/70 mt-1">
                Firma Mecánico
              </div>
            </div>
            <div>
              <div className="border-b border-black mx-auto w-48 font-script text-base sm:text-lg italic text-black/90 pb-0.5">
                {jefeTaller}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-black/70 mt-1">
                Firma Jefe de taller
              </div>
            </div>
          </div>

        </div>

        {/* ACCIONES INFERIORES */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(243,239,231,0.1)] pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigate(`/fichas/${remolqueId}`)
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3.5 py-2 text-xs font-bold text-white hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            >
              <Truck className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Ver Ficha de la Caja</span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/taller/refacciones', {
                  state: {
                    preOtId: ot.id,
                    preUnidadId: remolqueId,
                    preFolioOt: ot.folio,
                  }
                })
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-3.5 py-2 text-xs font-bold text-white hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5 text-[#F2620F]" />
              <span>Pedir Refacciones para esta Caja</span>
            </button>
          </div>

          <button
            type="button"
            onClick={alCerrar}
            className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#252A30] transition-all cursor-pointer"
          >
            Cerrar Formato
          </button>
        </div>

      </div>
    </div>
  )
}
