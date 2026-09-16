import React from 'react'
import { useNavigate } from 'react-router'
import { 
  X, 
  Printer, 
  Download, 
  Wrench, 
  CheckCircle2, 
  ShoppingCart, 
  ShieldCheck 
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { 
  ARTICULOS_INSPECCION_TALLER, 
  DISPOSICIONES_SALIDA_NO_CONFORME,
  type ReporteMecanicoTallerForm,
  type ReporteRemolqueTallerForm
} from '../../lib/tallerSchema'
import { OrdenRemolqueModal } from './OrdenRemolqueModal'

export interface DetalleOT {
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
  pendientes?: string[]
  reporte_mecanico?: ReporteMecanicoTallerForm
  reporte_remolque?: ReporteRemolqueTallerForm
}

interface Props {
  ot: DetalleOT | null
  abierto: boolean
  alCerrar: () => void
}

export const OrdenTrabajoModal: React.FC<Props> = ({ ot, abierto, alCerrar }) => {
  const navigate = useNavigate()
  if (!abierto || !ot) return null

  // Si la OT corresponde a un Remolque / Caja, renderizar el formato oficial Nº 478
  if (ot.reporte_remolque || ot.tipo_unidad === 'Caja' || ot.tipo_unidad === 'Thermo') {
    return <OrdenRemolqueModal ot={ot as any} abierto={abierto} alCerrar={alCerrar} />
  }

  const rep = ot.reporte_mecanico

  const descargarPdf = () => {
    const doc = new jsPDF()

    // Encabezado Principal
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(22, 25, 30)
    doc.text('WARHORSE MÉXICO - TALLER MECÁNICO Y MANTENIMIENTO', 14, 15)

    doc.setFontSize(12)
    doc.setTextColor(180, 67, 10)
    const numFisico = rep?.numero_reporte_fisico || '0801'
    doc.text(`REPORTE DEL MECANICO SOBRE LA INSPECCION DEL TRACTOR`, 14, 22)
    doc.setTextColor(217, 85, 12)
    doc.text(`№ ${numFisico}`, 175, 22)

    doc.setDrawColor(200, 200, 200)
    doc.line(14, 25, 196, 25)

    // Metadatos Generales
    doc.setFontSize(8)
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'bold')

    const fechaEntrega = rep?.fecha_entrega || ot.fecha_ingreso
    const grua = rep?.fuera_de_servicio?.uso_grua ? 'SÍ' : 'NO'
    const repMec = rep?.fuera_de_servicio?.reparo_mecanico ? 'SÍ' : 'NO'
    const warn = rep?.warning ? 'SÍ' : 'NO'
    const mult = rep?.multa ? 'SÍ' : 'NO'
    const inspTipo = rep?.tipo_inspeccion || 'PreTrip'
    const operador = rep?.nombre_operador || 'No especificado'
    const cliente = rep?.cliente || 'Warhorse Cargo'
    const mecanico = rep?.nombre_mecanico || ot.responsable_nombre

    doc.text(`FECHA DE ENTREGA: ${fechaEntrega}`, 14, 31)
    doc.text(`FUERA DE SERVICIO: Grúa: [${grua}]  Reparó Mecánico: [${repMec}]`, 85, 31)
    doc.text(`WARNING: [${warn}]`, 160, 31)
    doc.text(`MULTA: [${mult}]`, 182, 31)

    doc.text(`UNIDAD: ${ot.unidad_id} (${ot.tipo_unidad || 'Tractor'})`, 14, 37)
    doc.text(`INSPECCIÓN DE VIAJE: ${inspTipo.toUpperCase()}`, 75, 37)
    doc.text(`OPERADOR: ${operador}`, 130, 37)

    doc.text(`CLIENTE: ${cliente}`, 14, 43)
    doc.text(`MECÁNICO RESPONSABLE: ${mecanico}`, 75, 43)
    doc.text(`FOLIO SISTEMA: ${ot.folio}`, 140, 43)

    doc.line(14, 46, 196, 46)

    // Sección de 32 Artículos en 4 Columnas
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 25, 30)
    doc.text('MARQUE CON UNA CASILLA LOS ARTICULOS QUE TIENEN DEFECTO:', 14, 51)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')

    const articulosMarcados = rep?.articulos_defectuosos || []
    const colX = [14, 59, 105, 151]
    const anchoCol = 43

    for (let c = 1; c <= 4; c++) {
      const itemsCol = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === c)
      let startY = 56
      itemsCol.forEach(item => {
        const estaMarcado = articulosMarcados.includes(item.id)
        const checkStr = estaMarcado ? '[ X ]' : '[   ]'
        if (estaMarcado) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(217, 85, 12)
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(60, 60, 60)
        }
        doc.text(`${checkStr} ${item.etiqueta}`, colX[c - 1], startY, { maxWidth: anchoCol })
        startY += 5
      })
    }

    // Síntoma de Falla
    let currentY = 100
    doc.setDrawColor(200, 200, 200)
    doc.line(14, currentY, 196, currentY)
    currentY += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 25, 30)
    doc.text('DESCRIBA CORRECTAMENTE EL SÍNTOMA DE FALLA:', 14, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(40, 40, 40)
    const textoFalla = rep?.detalles_sintoma_falla || ot.diagnostico
    doc.text(textoFalla, 14, currentY, { maxWidth: 182 })
    currentY += 10

    // Control de Salidas No Conformes (Disposición)
    doc.line(14, currentY, 196, currentY)
    currentY += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(22, 25, 30)
    doc.text('CONTROL DE SALIDAS NO CONFORMES (DISPOSICIÓN):', 14, currentY)
    currentY += 5

    doc.setFontSize(7)
    const dispActual = rep?.disposicion_salida || 'Reparación de unidad'

    let dx = 14
    DISPOSICIONES_SALIDA_NO_CONFORME.forEach(dispLabel => {
      const marcada = dispActual === dispLabel
      const mark = marcada ? '( * )' : '(   )'
      if (marcada) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(217, 85, 12)
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
      }
      doc.text(`${mark} ${dispLabel}`, dx, currentY)
      dx += 36
    })

    currentY += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const firmaEnc = rep?.firma_encargado_taller || 'Ing. Roberto Salazar'
    doc.text(`Firma / Autorización Encargado de Taller: ${firmaEnc}`, 14, currentY)
    currentY += 6

    // Fechas de inicio y término
    doc.line(14, currentY, 196, currentY)
    currentY += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(30, 30, 30)
    const fIni = rep?.fecha_inicio_reparacion ? rep.fecha_inicio_reparacion.replace('T', ' ') : ot.fecha_ingreso
    const fFin = rep?.fecha_termino_reparacion ? rep.fecha_termino_reparacion.replace('T', ' ') : 'En Proceso'
    doc.text(`FECHA INICIO REPARACIÓN: ${fIni}`, 14, currentY)
    doc.text(`FECHA TÉRMINO REPARACIÓN: ${fFin}`, 110, currentY)
    currentY += 6

    // Tabla de Reparaciones Realizadas y Refacciones
    doc.line(14, currentY, 196, currentY)
    currentY += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('REPARACIONES REALIZADAS Y REFACCIONES UTILIZADAS:', 14, currentY)
    currentY += 5

    // Encabezados de tabla
    doc.setFillColor(240, 240, 240)
    doc.rect(14, currentY - 3.5, 182, 5, 'F')
    doc.setFontSize(7)
    doc.text('REPARACIONES REALIZADAS', 16, currentY)
    doc.text('REFACCIONES UTILIZADAS', 90, currentY)
    doc.text('CANT', 150, currentY)
    doc.text('ORIGEN', 165, currentY)
    currentY += 5

    doc.setFont('helvetica', 'normal')
    const filasReps = rep?.filas_reparaciones && rep.filas_reparaciones.length > 0 
      ? rep.filas_reparaciones 
      : (ot.materiales || []).map((m, i) => ({
          id: `f-${i}`,
          reparacion_realizada: ot.diagnostico,
          refacciones: m.pieza,
          cantidad: m.cantidad,
          origen: (m.origen?.toLowerCase().includes('almacén') ? 'Almacén' : 'Compras / Proveedor') as 'Almacén' | 'Compras / Proveedor',
          costo_unitario: 0
        }))

    filasReps.slice(0, 8).forEach(r => {
      doc.text(r.reparacion_realizada || 'Servicio de mantenimiento', 16, currentY, { maxWidth: 70 })
      doc.text(r.refacciones || 'N/A', 90, currentY, { maxWidth: 56 })
      doc.text(String(r.cantidad || 1), 152, currentY)
      doc.text(r.origen, 165, currentY)
      currentY += 5
    })

    // Declaraciones de Conformidad
    currentY += 4
    doc.line(14, currentY, 196, currentY)
    currentY += 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(30, 30, 30)

    const decSat = rep?.declaraciones_liberacion?.condicion_satisfactoria !== false ? '[ X ]' : '[   ]'
    const decCor = rep?.declaraciones_liberacion?.defectos_corregidos !== false ? '[ X ]' : '[   ]'
    const decPen = rep?.declaraciones_liberacion?.defectos_pendientes_seguros ? '[ X ]' : '[   ]'

    doc.text(`${decSat} Condición Satisfactoria`, 14, currentY)
    doc.text(`${decCor} Defectos Corregidos`, 75, currentY)
    doc.text(`${decPen} Defectos no afectan la seguridad`, 135, currentY)
    currentY += 12

    // 3 Firmas Oficiales
    doc.setDrawColor(150, 150, 150)
    doc.line(14, currentY, 65, currentY)
    doc.line(78, currentY, 130, currentY)
    doc.line(144, currentY, 196, currentY)

    currentY += 3.5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('FIRMA DEL MECÁNICO', 22, currentY)
    doc.text('FIRMA DEL OPERADOR', 88, currentY)
    doc.text('FIRMA DEL JEFE DE TALLER', 148, currentY)

    currentY += 3.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(90, 90, 90)
    doc.text('(Reparó correctamente)', 23, currentY)
    doc.text('(Acepta la reparación)', 88, currentY)
    doc.text('(Autorizó y revisó)', 155, currentY)

    currentY += 4
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text(rep?.firmas?.mecanico || ot.responsable_nombre, 20, currentY)
    doc.text(rep?.firmas?.operador || operador, 84, currentY)
    doc.text(rep?.firmas?.jefe_taller || 'Ing. Roberto Salazar', 150, currentY)

    doc.save(`Reporte_Mecanico_${numFisico}_${ot.folio}.pdf`)
  }

  // Agrupar los 32 artículos por columna para la vista interactiva
  const columna1 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 1)
  const columna2 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 2)
  const columna3 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 3)
  const columna4 = ARTICULOS_INSPECCION_TALLER.filter(a => a.columna === 4)

  const articulosMarcados = rep?.articulos_defectuosos || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[rgba(243,239,231,0.2)] bg-[#14181D] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Documento Oficial */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E] shrink-0">
              <Wrench className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                  FORMATO OFICIAL DE TALLER
                </span>
                <span className="rounded bg-[#F2620F]/20 px-2 py-0.5 font-mono text-[11px] font-bold text-[#F2620F]">
                  № {rep?.numero_reporte_fisico || '0801'}
                </span>
                <span className="rounded bg-white/10 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold text-white uppercase">
                  {ot.folio}
                </span>
              </div>
              <h3 className="font-['Barlow_Condensed'] text-lg font-extrabold uppercase tracking-wide text-white">
                Reporte del Mecánico sobre la Inspección del Tractor
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPdf}
              className="flex items-center gap-1.5 rounded-lg border border-[#F2620F]/40 bg-[#F2620F]/10 px-3 py-1.5 text-xs font-bold uppercase text-[#F2620F] hover:bg-[#F2620F] hover:text-black transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descargar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3 py-1.5 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B8B2A6] hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido Oficial del Formato */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto font-sans">

          {/* Ficha Superior: Datos Físicos */}
          <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/70 p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Fecha de Entrega</span>
                <span className="font-bold text-white">{rep?.fecha_entrega || ot.fecha_ingreso}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Unidad</span>
                <span className="font-['Barlow_Condensed'] text-base font-bold text-[#F2620F]">{ot.unidad_id}</span>
                <span className="text-[10px] text-[#B8B2A6] ml-1">({ot.tipo_unidad || 'Tractor'})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Inspección de Viaje</span>
                <span className="font-bold text-[#C5A059] uppercase">{rep?.tipo_inspeccion || 'PreTrip'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Cliente</span>
                <span className="font-bold text-white">{rep?.cliente || 'Warhorse Cargo'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Operador</span>
                <span className="text-white font-medium">{rep?.nombre_operador || 'Juan Hernández'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Mecánico</span>
                <span className="text-white font-medium">{rep?.nombre_mecanico || ot.responsable_nombre}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Fuera de Servicio</span>
                <span className="text-white font-semibold">
                  Grúa: <strong className={rep?.fuera_de_servicio?.uso_grua ? 'text-[#F2620F]' : 'text-white/60'}>{rep?.fuera_de_servicio?.uso_grua ? 'SÍ' : 'NO'}</strong> | 
                  Reparó: <strong className="text-[#3FA65C]">{rep?.fuera_de_servicio?.reparo_mecanico ? 'SÍ' : 'NO'}</strong>
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#B8B2A6] block">Warning / Multa</span>
                <span className="text-white font-semibold">
                  Warn: <strong className={rep?.warning ? 'text-[#C5A059]' : 'text-white/60'}>{rep?.warning ? 'SÍ' : 'NO'}</strong> | 
                  Multa: <strong className={rep?.multa ? 'text-[#B4430A]' : 'text-white/60'}>{rep?.multa ? 'SÍ' : 'NO'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Matriz de 32 Artículos en 4 Columnas */}
          <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/40 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
                Marque con una casilla los artículos que tienen defecto (32 Puntos Oficiales)
              </span>
              <span className="text-[11px] font-mono text-[#F2620F] font-bold">
                {articulosMarcados.length} componentes defectuosos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Columna 1 */}
              <div className="space-y-1 bg-[#14181D]/60 p-2.5 rounded-lg border border-white/5">
                {columna1.map(art => {
                  const marcado = articulosMarcados.includes(art.id)
                  return (
                    <div key={art.id} className={`flex items-center justify-between p-1 rounded ${marcado ? 'bg-[#F2620F]/20 text-white font-bold' : 'text-[#B8B2A6]'}`}>
                      <span className="text-[11px]">{art.etiqueta}</span>
                      <div className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[10px] ${marcado ? 'bg-[#F2620F] text-white font-bold' : 'border border-white/20'}`}>
                        {marcado ? 'X' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Columna 2 */}
              <div className="space-y-1 bg-[#14181D]/60 p-2.5 rounded-lg border border-white/5">
                {columna2.map(art => {
                  const marcado = articulosMarcados.includes(art.id)
                  return (
                    <div key={art.id} className={`flex items-center justify-between p-1 rounded ${marcado ? 'bg-[#F2620F]/20 text-white font-bold' : 'text-[#B8B2A6]'}`}>
                      <span className="text-[11px]">{art.etiqueta}</span>
                      <div className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[10px] ${marcado ? 'bg-[#F2620F] text-white font-bold' : 'border border-white/20'}`}>
                        {marcado ? 'X' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Columna 3 */}
              <div className="space-y-1 bg-[#14181D]/60 p-2.5 rounded-lg border border-white/5">
                {columna3.map(art => {
                  const marcado = articulosMarcados.includes(art.id)
                  return (
                    <div key={art.id} className={`flex items-center justify-between p-1 rounded ${marcado ? 'bg-[#F2620F]/20 text-white font-bold' : 'text-[#B8B2A6]'}`}>
                      <span className="text-[11px]">{art.etiqueta}</span>
                      <div className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[10px] ${marcado ? 'bg-[#F2620F] text-white font-bold' : 'border border-white/20'}`}>
                        {marcado ? 'X' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Columna 4 */}
              <div className="space-y-1 bg-[#14181D]/60 p-2.5 rounded-lg border border-white/5">
                {columna4.map(art => {
                  const marcado = articulosMarcados.includes(art.id)
                  return (
                    <div key={art.id} className={`flex items-center justify-between p-1 rounded ${marcado ? 'bg-[#F2620F]/20 text-white font-bold' : 'text-[#B8B2A6]'}`}>
                      <span className="text-[11px]">{art.etiqueta}</span>
                      <div className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[10px] ${marcado ? 'bg-[#F2620F] text-white font-bold' : 'border border-white/20'}`}>
                        {marcado ? 'X' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Síntoma de Falla */}
          <div>
            <h4 className="mb-1.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
              Describa Correctamente el Síntoma de Falla
            </h4>
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/50 p-3.5 text-xs text-white leading-relaxed">
              {rep?.detalles_sintoma_falla || ot.diagnostico}
            </div>
          </div>

          {/* Control de Salidas No Conformes (Disposición) */}
          <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/50 p-4 space-y-2">
            <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#C5A059] block">
              Control de Salidas No Conformes (Disposición)
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {DISPOSICIONES_SALIDA_NO_CONFORME.map(dispLabel => {
                const seleccionado = (rep?.disposicion_salida || 'Reparación de unidad') === dispLabel
                return (
                  <span
                    key={dispLabel}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                      seleccionado 
                        ? 'border-[#F2620F] bg-[#F2620F]/20 text-white font-bold' 
                        : 'border-white/5 bg-[#14181D] text-[#B8B2A6]'
                    }`}
                  >
                    {seleccionado ? '✓ ' : ''}{dispLabel}
                  </span>
                )
              })}
            </div>
            <div className="text-[11px] text-[#B8B2A6] pt-1">
              Encargado de Taller (Autoriza Disposición): <strong className="text-white">{rep?.firma_encargado_taller || 'Ing. Roberto Salazar'}</strong>
            </div>
          </div>

          {/* Tabla de Reparaciones Realizadas y Refacciones */}
          <div>
            <h4 className="mb-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6]">
              Reparaciones Realizadas y Refacciones Utilizadas
            </h4>
            <div className="overflow-x-auto rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#14181D] text-[#B8B2A6] font-['Barlow_Condensed'] text-[11px] uppercase border-b border-white/5">
                  <tr>
                    <th className="py-2.5 px-3">Reparaciones Realizadas</th>
                    <th className="py-2.5 px-3">Refacciones Utilizadas</th>
                    <th className="py-2.5 px-2 text-center">Cant</th>
                    <th className="py-2.5 px-3 text-center">Origen de la Pieza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rep?.filas_reparaciones && rep.filas_reparaciones.length > 0 ? (
                    rep.filas_reparaciones.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 text-white">{r.reparacion_realizada || 'Mantenimiento preventivo'}</td>
                        <td className="py-2 px-3 text-[#C5A059]">{r.refacciones || 'N/A'}</td>
                        <td className="py-2 px-2 text-center font-bold text-white">{r.cantidad || 1}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.origen === 'Almacén'
                              ? 'bg-[#3FA65C]/20 text-[#3FA65C] border border-[#3FA65C]/30'
                              : r.origen === 'Compras / Proveedor'
                              ? 'bg-[#F2620F]/20 text-[#F2620F] border border-[#F2620F]/30'
                              : 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30'
                          }`}>
                            {r.origen}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    ot.materiales && ot.materiales.length > 0 ? (
                      ot.materiales.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 text-white">{ot.diagnostico}</td>
                          <td className="py-2 px-3 text-[#C5A059]">{m.pieza}</td>
                          <td className="py-2 px-2 text-center font-bold text-white">{m.cantidad}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="bg-[#3FA65C]/20 text-[#3FA65C] px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              Almacén
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-center text-[#B8B2A6]">
                          Sin refacciones registradas en este servicio.
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Declaraciones de Conformidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              rep?.declaraciones_liberacion?.condicion_satisfactoria !== false
                ? 'border-[#3FA65C]/40 bg-[#3FA65C]/10 text-white'
                : 'border-white/10 text-[#B8B2A6]'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-[#3FA65C] shrink-0" />
              <span>Condición Satisfactoria</span>
            </div>

            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              rep?.declaraciones_liberacion?.defectos_corregidos !== false
                ? 'border-[#3FA65C]/40 bg-[#3FA65C]/10 text-white'
                : 'border-white/10 text-[#B8B2A6]'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-[#3FA65C] shrink-0" />
              <span>Defectos Corregidos</span>
            </div>

            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              rep?.declaraciones_liberacion?.defectos_pendientes_seguros
                ? 'border-[#C5A059]/40 bg-[#C5A059]/10 text-white'
                : 'border-white/10 text-[#B8B2A6]'
            }`}>
              <ShieldCheck className="h-4 w-4 text-[#C5A059] shrink-0" />
              <span>Defectos no afectan la seguridad</span>
            </div>
          </div>

          {/* Las 3 Firmas de Conformidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Firma Mecánico */}
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C]/60 p-3 text-center space-y-1">
              <span className="text-[10px] font-['Barlow_Condensed'] font-bold uppercase text-[#F2620F] block">
                Firma del Mecánico
              </span>
              <div className="py-2 border-b border-dashed border-white/20 font-serif italic text-white text-sm">
                {rep?.firmas?.mecanico || ot.responsable_nombre}
              </div>
              <span className="text-[10px] text-[#B8B2A6] block">(Reparó correctamente)</span>
            </div>

            {/* Firma Operador */}
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C]/60 p-3 text-center space-y-1">
              <span className="text-[10px] font-['Barlow_Condensed'] font-bold uppercase text-[#C5A059] block">
                Firma del Operador
              </span>
              <div className="py-2 border-b border-dashed border-white/20 font-serif italic text-white text-sm">
                {rep?.firmas?.operador || rep?.nombre_operador || 'Juan Hernández'}
              </div>
              <span className="text-[10px] text-[#B8B2A6] block">(Acepta la reparación)</span>
            </div>

            {/* Firma Jefe de Taller */}
            <div className="rounded-xl border border-white/10 bg-[#1C1C1C]/60 p-3 text-center space-y-1">
              <span className="text-[10px] font-['Barlow_Condensed'] font-bold uppercase text-[#3FA65C] block">
                Firma del Jefe de Taller
              </span>
              <div className="py-2 border-b border-dashed border-white/20 font-serif italic text-white text-sm">
                {rep?.firmas?.jefe_taller || 'Ing. Roberto Salazar'}
              </div>
              <span className="text-[10px] text-[#B8B2A6] block">(Autorizó y revisó reparación)</span>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-5 py-3">
          <div className="flex items-center gap-2">
            {ot.estado !== 'Cerrada' && ot.estado !== 'Liberada' && (
              <button
                type="button"
                onClick={() => {
                  alCerrar()
                  navigate(`/taller/refacciones?ot_id=${ot.id}`, {
                    state: {
                      otId: ot.id,
                      folioOT: ot.folio,
                      unidadId: ot.unidad_id,
                    },
                  })
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#F2620F]/20 border border-[#F2620F]/40 px-3.5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#F2620F] hover:bg-[#F2620F] hover:text-[#16191E] transition-all cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Solicitar Refacciones</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPdf}
              className="flex items-center gap-1.5 rounded-xl bg-[#F2620F] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] hover:bg-[#D9550C] transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Reporte PDF</span>
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="rounded-xl border border-[rgba(243,239,231,0.2)] px-4 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#B8B2A6] hover:text-white transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrdenTrabajoModal
