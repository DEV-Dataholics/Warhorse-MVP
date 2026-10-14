import React, { useEffect, useState, useRef } from 'react'
import { 
  X, 
  Download, 
  Printer, 
  QrCode, 
  Copy,
  Check
} from 'lucide-react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import type { ResponsableTaller } from '../../lib/api'

interface Props {
  mecanico: ResponsableTaller | null
  abierto: boolean
  alCerrar: () => void
}

export const GafeteMecanicoModal: React.FC<Props> = ({ mecanico, abierto, alCerrar }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copiado, setCopiado] = useState(false)
  const gafeteRef = useRef<HTMLDivElement>(null)

  const folioMecanico = mecanico ? `MEC-${String(mecanico.id).padStart(3, '0')}` : 'MEC-000'

  useEffect(() => {
    if (mecanico && abierto) {
      const payloadQR = JSON.stringify({
        tipo: 'mecanico',
        id: folioMecanico,
        nombre: mecanico.nombre,
        rol: mecanico.rol,
        especialidad: mecanico.tipo || 'Tracto',
        emision: new Date().toISOString().substring(0, 10),
      })

      QRCode.toDataURL(payloadQR, {
        width: 320,
        margin: 2,
        color: {
          dark: '#14181D',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url: string) => setQrDataUrl(url))
        .catch((err: unknown) => console.error('Error al generar QR de mecánico:', err))
    }
  }, [mecanico, abierto, folioMecanico])

  if (!abierto || !mecanico) return null

  const copiarPayload = () => {
    const payload = `ID: ${folioMecanico} | ${mecanico.nombre} | ${mecanico.rol}`
    navigator.clipboard.writeText(payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const descargarQrPng = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `QR_${folioMecanico}_${mecanico.nombre.replace(/\s+/g, '_')}.png`
    link.click()
  }

  const descargarGafetePdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [85.6, 120], // Tamaño credencial estándar industrial
    })

    // Fondo oscuro industrial
    doc.setFillColor(20, 24, 29)
    doc.rect(0, 0, 85.6, 120, 'F')

    // Franja superior dorada y naranja
    doc.setFillColor(242, 98, 15) // #F2620F
    doc.rect(0, 0, 85.6, 4, 'F')
    doc.setFillColor(197, 160, 89) // #C5A059
    doc.rect(0, 4, 85.6, 2, 'F')

    // Títulos de Cabecera
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('WARHORSE MÉXICO', 42.8, 12, { align: 'center' })

    doc.setFontSize(7)
    doc.setTextColor(197, 160, 89)
    doc.text('ACREDITACIÓN TÉCNICA DE TALLER', 42.8, 16, { align: 'center' })

    // Recuadro de foto / avatar
    doc.setFillColor(28, 28, 28)
    doc.roundedRect(27.8, 20, 30, 26, 3, 3, 'F')
    doc.setTextColor(242, 98, 15)
    doc.setFontSize(16)
    doc.text(mecanico.nombre.substring(0, 2).toUpperCase(), 42.8, 36, { align: 'center' })

    // Nombre del Mecánico
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(mecanico.nombre.toUpperCase(), 42.8, 52, { align: 'center' })

    // Rol y Especialidad
    doc.setTextColor(197, 160, 89)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`${mecanico.rol} • ${mecanico.tipo || 'Tracto'}`, 42.8, 57, { align: 'center' })

    // Folio
    doc.setTextColor(242, 98, 15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(folioMecanico, 42.8, 63, { align: 'center' })

    // Código QR centrado
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 24.8, 67, 36, 36)
    }

    // Pie de página de seguridad
    doc.setTextColor(184, 178, 166)
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.text('VALIDACIÓN DE IDENTIDAD Y ASIGNACIÓN DE ORDEN DE TRABAJO', 42.8, 108, { align: 'center' })
    doc.text('WARHORSE HEAVY FLEET SYSTEMS • VIGENTE', 42.8, 112, { align: 'center' })

    doc.save(`Gafete_${folioMecanico}_${mecanico.nombre.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra superior de acento */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#F2620F] via-[#C5A059] to-[#F2620F]" />

        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] bg-[#1C1C1C] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2620F]/20 text-[#F2620F] border border-[#F2620F]/30">
              <QrCode className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wide text-white">
                Gafete y Credencial QR de Taller
              </h3>
              <p className="text-xs text-[#B8B2A6]">
                Identificación técnica unívoca para asignación y liberación de OTs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-lg p-1.5 text-[#B8B2A6] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido Principal: Tarjeta de Gafete Físico */}
        <div className="p-6 space-y-6">
          <div 
            ref={gafeteRef}
            className="mx-auto max-w-[340px] rounded-2xl border-2 border-[#C5A059]/40 bg-gradient-to-b from-[#1C1C1C] to-[#14181D] p-6 shadow-2xl relative overflow-hidden text-center"
          >
            {/* Holograma / Sello de fondo */}
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#F2620F]/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[#C5A059]/10 blur-2xl pointer-events-none" />

            {/* Cabecera del Gafete */}
            <div className="flex items-center justify-between border-b border-[rgba(243,239,231,0.1)] pb-3 mb-4">
              <div className="text-left">
                <span className="font-['Barlow_Condensed'] text-sm font-black tracking-widest text-white uppercase block">
                  WARHORSE MÉXICO
                </span>
                <span className="font-['Barlow_Condensed'] text-[9px] font-bold tracking-wider text-[#C5A059] uppercase block">
                  Acreditación de Taller
                </span>
              </div>
              <span className="rounded bg-[#3FA65C]/20 border border-[#3FA65C]/40 px-2 py-0.5 font-['Barlow_Condensed'] text-[10px] font-bold text-[#3FA65C] uppercase">
                Activo
              </span>
            </div>

            {/* Avatar / Iniciales del Colaborador */}
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#14181D] border-2 border-[#F2620F]/50 text-[#F2620F] shadow-lg shadow-[#F2620F]/10">
              <span className="font-['Barlow_Condensed'] text-3xl font-black">
                {mecanico.nombre.substring(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Datos Personales */}
            <h4 className="font-['Barlow_Condensed'] text-2xl font-black uppercase text-white tracking-wide leading-tight">
              {mecanico.nombre}
            </h4>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="rounded bg-[#F2620F]/15 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold text-[#F2620F] uppercase">
                {mecanico.rol}
              </span>
              <span className="rounded bg-[#C5A059]/15 px-2.5 py-0.5 font-['Barlow_Condensed'] text-xs font-bold text-[#C5A059] uppercase">
                {mecanico.tipo || 'Tracto'}
              </span>
            </div>

            {/* Folio Acreditación */}
            <div className="mt-2 font-mono text-sm font-black text-[#B8B2A6]">
              {folioMecanico}
            </div>

            {/* Código QR */}
            <div className="my-4 mx-auto w-fit rounded-xl bg-white p-2.5 shadow-inner border border-black/20">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR ${mecanico.nombre}`} 
                  className="h-44 w-44 object-contain"
                />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center text-xs text-black">
                  Generando QR...
                </div>
              )}
            </div>

            {/* Pie del Gafete */}
            <p className="text-[10px] text-[#B8B2A6] leading-tight">
              Escanea con la cámara de la tablet en patio o taller para registro automático de intervenciones.
            </p>
          </div>

          {/* Botones de Exportación y Descarga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={descargarGafetePdf}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#F2620F] px-4 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-[#16191E] shadow-lg shadow-[#F2620F]/20 hover:bg-[#D9550C] transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 stroke-[2.5]" />
              <span>Descargar Gafete PDF</span>
            </button>

            <button
              type="button"
              onClick={descargarQrPng}
              className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#1C1C1C] px-4 py-2.5 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-all cursor-pointer"
            >
              <Download className="h-4 w-4 text-[#C5A059]" />
              <span>Descargar QR (PNG)</span>
            </button>
          </div>

          {/* Botón secundario para copiar payload de prueba */}
          <div className="flex items-center justify-between rounded-xl border border-[rgba(243,239,231,0.06)] bg-[#1C1C1C]/50 px-4 py-2 text-xs text-[#B8B2A6]">
            <span className="font-mono text-[11px] truncate mr-2">
              Payload: {folioMecanico} • {mecanico.nombre}
            </span>
            <button
              type="button"
              onClick={copiarPayload}
              className="flex items-center gap-1 text-[11px] font-bold text-[#C5A059] hover:text-white cursor-pointer shrink-0"
            >
              {copiado ? (
                <>
                  <Check className="h-3 w-3 text-[#3FA65C]" />
                  <span className="text-[#3FA65C]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pie de Modal */}
        <div className="flex justify-end border-t border-[rgba(243,239,231,0.08)] bg-[#1C1C1C] px-6 py-3">
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-xl border border-[rgba(243,239,231,0.15)] bg-[#14181D] px-5 py-2 font-['Barlow_Condensed'] text-xs font-bold uppercase text-white hover:border-white transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default GafeteMecanicoModal
