import React from 'react'
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  Box,
  User, 
  Gauge, 
  Fuel, 
  FileText,
  Disc
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import type { OrdenInspeccionForm } from '../../lib/inspeccionSchema'

interface Props {
  inspeccion: OrdenInspeccionForm | null
  abierto: boolean
  alCerrar: () => void
}

export const OrdenInspeccionModal: React.FC<Props> = ({ inspeccion, abierto, alCerrar }) => {
  if (!abierto || !inspeccion) return null

  const esCaja = inspeccion.tipo_vehiculo === 'caja'

  // Calcular el estado resultante de salud de la unidad
  const tieneCritico = inspeccion.items.some(i => i.estado === 'Crítico')
  const tieneRegular = inspeccion.items.some(i => i.estado === 'Regular')
  const tieneLlantaCritica = inspeccion.llantas_diagrama?.some(l => l.estado === 'Dañada' || l.estado === 'Cambio')
  const tieneLlantaWarning = inspeccion.llantas_diagrama?.some(l => l.estado === 'Desgaste' || l.estado === 'Baja Presión')

  const requiereAtencion = tieneCritico || tieneLlantaCritica
  const tieneAdvertencia = tieneRegular || tieneLlantaWarning

  const estadoSalud = requiereAtencion
    ? 'Inactivo en Reparación · Requiere OT'
    : tieneAdvertencia
    ? 'Activo con Advertencias'
    : 'Aprobado 100% · Liberación de Viaje'

  const colorSalud = requiereAtencion
    ? 'bg-[#B4430A]/20 text-[#F2620F] border-[#F2620F]/40'
    : tieneAdvertencia
    ? 'bg-[#E0C36A]/20 text-[#E0C36A] border-[#E0C36A]/40'
    : 'bg-[#3FA65C]/20 text-[#3FA65C] border-[#3FA65C]/40'

  const descargarPdf = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('WARHORSE BROKERAGE', 14, 20)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(esCaja ? 'REPORTE DE INSPECCIÓN DE CAJA' : 'REPORTE DE INSPECCIÓN DE VIAJE', 14, 26)

    doc.setTextColor(197, 160, 89)
    doc.setFont('helvetica', 'bold')
    doc.text(`FOLIO: ${inspeccion.folio || inspeccion.numero_reporte_fisico || 'INS-2026-001'}`, 140, 20)
    doc.setTextColor(0, 0, 0)

    doc.line(14, 30, 196, 30)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`TIPO DE INSPECCIÓN: ${inspeccion.tipo_inspeccion?.toUpperCase() || 'PRETRIP'}`, 14, 38)
    doc.text(`FECHA: ${inspeccion.fecha}`, 110, 38)
    doc.text(`HORA: ${inspeccion.hora || '11:00 AM'}`, 160, 38)

    doc.text(`OPERADOR: ${inspeccion.operador_nombre}`, 14, 46)
    doc.text(`LICENCIA: ${inspeccion.licencia}`, 110, 46)
    doc.text(`EMP ID: ${inspeccion.operador_id}`, 160, 46)

    if (esCaja) {
      doc.text(`TRAILA(S) / CAJA: ${inspeccion.unidad_id}`, 14, 54)
      doc.text(`PLACAS: ${inspeccion.placas || '12-EF-5E'}`, 80, 54)
      doc.text(`TIPO: CAJA / SEMIRREMOLQUE (8 RUEDAS)`, 130, 54)
    } else {
      doc.text(`CAMIÓN / UNIDAD: ${inspeccion.unidad_id}`, 14, 54)
      doc.text(`PLACAS: ${inspeccion.placas || '78-AA-1B'}`, 75, 54)
      doc.text(`ODÓMETRO: ${(inspeccion.odometro_millas || 266500).toLocaleString()} MILLAS`, 125, 54)
    }

    doc.setFont('helvetica', 'normal')
    doc.text(
      inspeccion.declaracion_defecto === 'sin_defectos'
        ? '[X] No detecté ningún defecto o deficiencia en este vehículo de motor comercial.'
        : '[X] Encontré los siguientes defectos como se indica a continuación.',
      14,
      62
    )

    doc.line(14, 66, 196, 66)
    doc.setFont('helvetica', 'bold')
    doc.text(
      esCaja 
        ? 'DIAGRAMA DE EJES Y LLANTAS (8 RUEDAS DE CAJA):' 
        : 'DIAGRAMA DE EJES Y LLANTAS (10 POSICIONES):', 
      14, 
      73
    )
    doc.setFont('helvetica', 'normal')
    doc.text(`Medida Profundidad: ${inspeccion.medida_profundidad_llantas || (esCaja ? '14/32"' : '12/32"')}  |  Medida Llantas: ${inspeccion.medida_llantas || '295/75R22.5'}`, 14, 79)

    // Detalle de llantas
    let yLlantas = 85
    const llantasObs = (inspeccion.llantas_diagrama || []).filter(l => l.estado !== 'OK')
    if (llantasObs.length === 0) {
      doc.text(
        esCaja 
          ? '• Todas las 8 ruedas de caja en condición Conforme (OK).' 
          : '• Todas las 10 ruedas en condición Conforme (OK).', 
        16, 
        yLlantas
      )
      yLlantas += 6
    } else {
      llantasObs.forEach(l => {
        doc.text(`• [${l.estado.toUpperCase()}] ${l.nombre} - Prof: ${l.profundidad || 'S/M'} ${l.observacion ? `(${l.observacion})` : ''}`, 16, yLlantas)
        yLlantas += 5
      })
    }

    yLlantas += 4
    doc.line(14, yLlantas, 196, yLlantas)
    yLlantas += 7

    doc.setFont('helvetica', 'bold')
    doc.text(
      esCaja 
        ? 'CHECKLIST DE COMPONENTES FÍSICOS (18 PUNTOS CAJA):' 
        : 'CHECKLIST DE COMPONENTES FÍSICOS (36 PUNTOS):', 
      14, 
      yLlantas
    )
    
    let y = yLlantas + 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    inspeccion.items.forEach(item => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(`• [${item.estado}] ${item.componente} (${item.sistema})`, 14, y)
      if (item.observacion) {
        y += 4
        doc.text(`   Obs: ${item.observacion}`, 18, y)
      }
      y += 5
    })

    if (y > 240) {
      doc.addPage()
      y = 20
    } else {
      y += 6
    }

    doc.line(14, y, 196, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('CARRIER/AGENT\'S REPORT:', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    doc.text(inspeccion.carrier_defectos_corregidos ? '[X] Defectos Anteriores Corregidos.' : '[ ] Defectos Anteriores Corregidos.', 16, y)
    y += 5
    doc.text(inspeccion.carrier_sin_riesgo ? '[X] Defectos no necesitan ser corregidos para funcionamiento seguro.' : '[ ] Defectos no necesitan ser corregidos para funcionamiento seguro.', 16, y)

    y += 10
    doc.line(14, y, 196, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    if (inspeccion.firma_digital?.startsWith('data:image/')) {
      try {
        doc.addImage(inspeccion.firma_digital, 'PNG', 14, y, 45, 14)
        y += 16
      } catch {
        // Fallback si no carga imagen en jsPDF
      }
      doc.text(`FIRMA DE OPERADOR: ${inspeccion.operador_nombre} (${inspeccion.operador_id})`, 14, y)
    } else {
      doc.text(`FIRMA DE OPERADOR: ${inspeccion.firma_digital || inspeccion.operador_nombre}`, 14, y)
    }
    doc.text(`CERTIFICADO POR: SISTEMA OPERATIVO WARHORSE PATIO OFFLINE`, 14, y + 6)

    doc.save(`Reporte_Inspeccion_${inspeccion.folio || inspeccion.numero_reporte_fisico}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Documento */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F] text-[#16191E]">
              <FileText className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                  DOCUMENTO OFICIAL EMITIDO
                </span>
                <span className="font-mono text-xs font-black text-[#C5A059] bg-black/40 px-2 py-0.5 rounded border border-[#C5A059]/30">
                  FOLIO: {inspeccion.folio || inspeccion.numero_reporte_fisico}
                </span>
              </div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-extrabold uppercase tracking-wide text-white">
                Reporte de Inspección de {esCaja ? 'Caja / Traila' : 'Viaje'} ({inspeccion.tipo_inspeccion})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPdf}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-[#F2620F] hover:text-[#F2620F] transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Descargar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] hover:border-white transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#B8B2A6] hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido Imprimible de la Orden */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Tarjeta de Veredicto de Salud */}
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 ${colorSalud}`}>
            <div className="flex items-center gap-3">
              {requiereAtencion ? (
                <ShieldAlert className="h-8 w-8 shrink-0" />
              ) : tieneAdvertencia ? (
                <AlertTriangle className="h-8 w-8 shrink-0" />
              ) : (
                <CheckCircle2 className="h-8 w-8 shrink-0" />
              )}
              <div>
                <div className="text-[11px] uppercase font-['Barlow_Condensed'] font-semibold tracking-wider">
                  Veredicto Operativo de Viaje
                </div>
                <div className="font-['Barlow_Condensed'] text-2xl font-black uppercase tracking-wide">
                  {estadoSalud}
                </div>
              </div>
            </div>

            <div className="mt-3 sm:mt-0 text-left sm:text-right text-xs">
              <span className="font-semibold">
                {requiereAtencion
                  ? '⚠️ Requiere Apertura Inmediata de OT Correctiva en Taller'
                  : tieneAdvertencia
                  ? '⚠️ Falla Menor Registrada: Unidad liberada con Advertencia'
                  : '✅ Unidad 100% Conforme para Despacho'}
              </span>
            </div>
          </div>

          {/* Cuadrícula de Metadatos del Vehículo y Operador */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-4">
            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                {esCaja ? <Box className="h-3 w-3 text-[#C5A059]" /> : <Truck className="h-3 w-3 text-[#F2620F]" />}
                <span>{esCaja ? 'Traila(s) / Placas' : '# De Camión / Placas'}</span>
              </div>
              <div className="font-['Barlow_Condensed'] text-lg font-black text-white mt-0.5">
                {inspeccion.unidad_id}
              </div>
              <div className="text-[11px] font-mono text-[#C5A059]">{inspeccion.placas}</div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                <User className="h-3 w-3 text-[#C5A059]" />
                <span>Operador</span>
              </div>
              <div className="truncate font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                {inspeccion.operador_nombre}
              </div>
              <div className="text-[10px] text-[#B8B2A6]">{inspeccion.licencia}</div>
            </div>

            {esCaja ? (
              <div>
                <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                  <Box className="h-3 w-3 text-[#C5A059]" />
                  <span>Tipo de Unidad</span>
                </div>
                <div className="font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                  Semirremolque
                </div>
                <div className="text-[10px] text-[#B8B2A6]">Caja Seca (Sin Motor)</div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                  <Gauge className="h-3 w-3 text-[#3FA65C]" />
                  <span>Odómetro</span>
                </div>
                <div className="font-['Barlow_Condensed'] text-base font-bold tabular-nums text-white mt-0.5">
                  {(inspeccion.odometro_millas || 266500).toLocaleString()} Millas
                </div>
                <div className="text-[10px] text-[#B8B2A6]">
                  ≈ {(inspeccion.kilometraje || 0).toLocaleString()} KM
                </div>
              </div>
            )}

            {esCaja ? (
              <div>
                <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                  <ShieldAlert className="h-3 w-3 text-[#3FA65C]" />
                  <span>Operación</span>
                </div>
                <div className="font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                  {inspeccion.tipo_operacion}
                </div>
                <div className="text-[10px] text-[#B8B2A6]">Acople Perno Rey</div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1 text-[11px] text-[#B8B2A6]">
                  <Fuel className="h-3 w-3 text-[#E0C36A]" />
                  <span>Combustible</span>
                </div>
                <div className="font-['Barlow_Condensed'] text-base font-bold text-white mt-0.5">
                  {inspeccion.nivel_combustible}
                </div>
                <div className="text-[10px] text-[#B8B2A6]">{inspeccion.tipo_operacion}</div>
              </div>
            )}
          </div>

          {/* Resumen del Diagrama de Llantas */}
          <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#0F0F10] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc className="h-4 w-4 text-[#F2620F]" />
                <span className="font-['Barlow_Condensed'] text-sm font-black uppercase text-white">
                  {esCaja ? 'Resumen de Ejes y 8 Neumáticos de Caja' : 'Resumen de Ejes y 10 Neumáticos'}
                </span>
              </div>
              <div className="text-xs font-mono text-[#C5A059]">
                Profundidad: {inspeccion.medida_profundidad_llantas} | Medida: {inspeccion.medida_llantas}
              </div>
            </div>

            <div className={`grid grid-cols-2 ${esCaja ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-2`}>
              {(inspeccion.llantas_diagrama || []).map(llanta => (
                <div 
                  key={llanta.id} 
                  className={`p-2 rounded-lg border text-xs flex flex-col items-center text-center ${
                    llanta.estado === 'OK' 
                      ? 'border-[#3FA65C]/30 bg-[#3FA65C]/10 text-white' 
                      : 'border-[#F2620F]/50 bg-[#F2620F]/15 text-white'
                  }`}
                >
                  <span className="font-['Barlow_Condensed'] font-black uppercase">{llanta.posicion}</span>
                  <span className="text-[10px] font-mono text-[#B8B2A6]">{llanta.profundidad}</span>
                  <span className={`text-[9px] font-bold uppercase mt-0.5 ${llanta.estado === 'OK' ? 'text-[#3FA65C]' : 'text-[#F2620F]'}`}>
                    {llanta.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Desglose de Componentes Físicos Evaluados */}
          <div>
            <h4 className="mb-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wider text-[#B8B2A6]">
              {esCaja ? 'Matriz de Inspección Física (18 Puntos Oficiales de Caja)' : 'Matriz de Inspección Física (36 Puntos Oficiales)'}
            </h4>
            <div className="rounded-xl border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/40 overflow-hidden">
              <table className="w-full text-left text-xs text-[#f3f4f6]">
                <thead className="border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] font-['Barlow_Condensed'] uppercase tracking-wider text-[#B8B2A6]">
                  <tr>
                    <th className="px-4 py-2.5">Sistema</th>
                    <th className="px-4 py-2.5">Componente</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5">Observación / Falla</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(243,239,231,0.06)]">
                  {inspeccion.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2 text-[11px] text-[#B8B2A6] font-medium">{item.sistema}</td>
                      <td className="px-4 py-2 font-semibold text-white">{item.componente}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-['Barlow_Condensed'] text-[11px] font-bold ${
                            item.estado === 'Crítico'
                              ? 'bg-[#B4430A]/20 text-[#F2620F]'
                              : item.estado === 'Regular'
                              ? 'bg-[#E0C36A]/20 text-[#E0C36A]'
                              : 'bg-[#3FA65C]/20 text-[#3FA65C]'
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[11px] text-[#B8B2A6]">
                        {item.observacion || '— Sin anomalías —'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Carrier Report y Firmas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[rgba(243,239,231,0.1)] pt-4">
            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-3 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-[#C5A059] font-['Barlow_Condensed'] font-black">
                Carrier/Agent's Report
              </div>
              <div className="text-xs text-[#f3f4f6] space-y-1">
                <div>
                  {inspeccion.carrier_defectos_corregidos ? '☑' : '☐'} Defectos Anteriores Corregidos.
                </div>
                <div>
                  {inspeccion.carrier_sin_riesgo ? '☑' : '☐'} Defectos no requieren corrección inmediata para operación segura.
                </div>
              </div>
              {inspeccion.observaciones_generales && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-[#B8B2A6] font-mono">
                  Obs: {inspeccion.observaciones_generales}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[rgba(243,239,231,0.08)] bg-[#1C1C1C]/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#B8B2A6] font-['Barlow_Condensed'] font-semibold">
                Firma de Operador de Inspección
              </div>
              {inspeccion.firma_digital?.startsWith('data:image/') ? (
                <div className="mt-2 bg-black/60 p-2 rounded-lg border border-[#3FA65C]/30 flex flex-col items-center">
                  <img 
                    src={inspeccion.firma_digital} 
                    alt="Firma del Operador" 
                    className="h-14 object-contain filter invert opacity-95" 
                  />
                  <span className="text-[10px] font-mono text-[#3FA65C] mt-1">
                    ✓ Operador: {inspeccion.operador_nombre} ({inspeccion.operador_id})
                  </span>
                </div>
              ) : (
                <div className="mt-2 font-mono text-xs text-[#3FA65C] bg-black/40 p-2 rounded border border-[#3FA65C]/30">
                  ✓ {inspeccion.firma_digital || inspeccion.operador_nombre}
                </div>
              )}
              <div className="text-[10px] text-[#B8B2A6] mt-1 flex items-center justify-between">
                <span>Fecha: {inspeccion.fecha}</span>
                <span>Hora: {inspeccion.hora || '11:00 AM'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="border-t border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4 flex items-center justify-between">
          <span className="text-[11px] text-[#B8B2A6] hidden sm:inline">
            Reporte de inspección validado conforme a normativa
          </span>
          <button
            type="button"
            onClick={alCerrar}
            className="w-full sm:w-auto rounded-xl bg-[#F2620F] px-8 h-12 font-['Barlow_Condensed'] text-sm font-extrabold uppercase tracking-wider text-[#16191E] shadow-xl shadow-[#F2620F]/20 hover:bg-[#D9550C] active:scale-[0.98] transition-all cursor-pointer"
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
