import React from 'react'
import { NavLink } from 'react-router'
import { 
  ClipboardCheck, 
  History, 
  Wrench, 
  PlusCircle, 
  Users, 
  ShoppingCart, 
  Boxes, 
  LayoutDashboard, 
  FileSpreadsheet, 
  ShieldCheck, 
  Fuel, 
  ChevronRight,
  Recycle,
  Tablet,
  Package,
  Truck,
  Building2
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'

interface ItemNavegacion {
  titulo: string
  ruta: string
  icono: React.ElementType
  badge?: string | number
  colorBadge?: string
}

interface SeccionNavegacion {
  titulo: string
  items: ItemNavegacion[]
  rolesPermitidos: string[]
}

export const AppSidebar: React.FC = () => {
  const { usuario } = useAuthStore()
  const { sidebarAbierto } = useUiStore()

  // Definición de las secciones de navegación saneadas sin rutas fantasma ni ruido cognitivo
  const secciones: SeccionNavegacion[] = [
    {
      titulo: 'Módulo de Patio (Operador)',
      rolesPermitidos: ['operador', 'admin'],
      items: [
        {
          titulo: 'Terminal Tablet (Kiosk)',
          ruta: '/patio',
          icono: Tablet,
        },
        {
          titulo: 'Nueva Inspección',
          ruta: '/patio/inspeccion',
          icono: ClipboardCheck,
        },
        {
          titulo: 'Historial de Revisiones',
          ruta: '/patio/historial',
          icono: History,
        },
      ],
    },
    {
      titulo: 'Gestión de Flota',
      rolesPermitidos: ['admin', 'taller', 'compras'],
      items: [
        {
          titulo: 'Catálogo de Flota',
          ruta: '/catalogo',
          icono: Truck,
        },
      ],
    },
    {
      titulo: 'Módulo Taller (Mantenimiento)',
      rolesPermitidos: ['taller', 'admin'],
      items: [
        {
          titulo: 'Órdenes de Trabajo (OT)',
          ruta: '/taller/ordenes',
          icono: Wrench,
        },
        {
          titulo: 'Nueva Orden de Trabajo',
          ruta: '/taller/ingreso',
          icono: PlusCircle,
        },
        {
          titulo: 'Pedido de Refacciones',
          ruta: '/taller/refacciones',
          icono: ShoppingCart,
        },
        {
          titulo: 'Equipo de Mecánicos',
          ruta: '/taller/personal',
          icono: Users,
        },
      ],
    },
    {
      titulo: 'Módulo Compras (Abasto)',
      rolesPermitidos: ['compras', 'admin'],
      items: [
        {
          titulo: 'Cola de Requisiciones',
          ruta: '/compras/cola',
          icono: Boxes,
        },
        {
          titulo: 'Inventario de Almacén',
          ruta: '/compras/inventario',
          icono: Package,
        },
        {
          titulo: 'Almacén Yonke ($0)',
          ruta: '/compras/yonke',
          icono: Recycle,
        },
        {
          titulo: 'Directorio de Proveedores',
          ruta: '/compras/proveedores',
          icono: Building2,
        },
      ],
    },
    {
      titulo: 'Administración & Reportes',
      rolesPermitidos: ['admin'],
      items: [
        {
          titulo: 'Dashboard Ejecutivo',
          ruta: '/dashboard',
          icono: LayoutDashboard,
        },
        {
          titulo: 'Reportes Maestros',
          ruta: '/admin/reportes',
          icono: FileSpreadsheet,
        },
        {
          titulo: 'Usuarios y Auditoría',
          ruta: '/admin/usuarios',
          icono: ShieldCheck,
        },
      ],
    },
    {
      titulo: 'Control Diésel',
      rolesPermitidos: ['diesel', 'admin'],
      items: [
        {
          titulo: 'Control de Combustible',
          ruta: '/diesel/cargas',
          icono: Fuel,
        },
      ],
    },
  ]

  if (!sidebarAbierto) {
    return null
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 mt-16 flex w-64 flex-col border-r border-[rgba(243,239,231,0.12)] bg-[#14181D]/95 pb-6 backdrop-blur-lg transition-all md:static md:mt-0">
      {/* Información del Operador o Usuario Activo */}
      <div className="border-b border-[rgba(243,239,231,0.08)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1C1C1C] border border-[rgba(243,239,231,0.15)] text-[#F2620F] font-['Barlow_Condensed'] text-base font-bold">
            {usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : 'WH'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-xs font-semibold text-[#f3f4f6]">
              {usuario?.nombre || 'Usuario Conectado'}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-[#B8B2A6]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3FA65C]" />
              <span className="font-['Barlow_Condensed'] font-semibold uppercase tracking-wider text-[#C5A059]">
                {usuario?.rol || 'Sin rol'}
              </span>
            </div>
          </div>
        </div>

        {usuario?.unidadAsignada && (
          <div className="mt-3 rounded-lg border border-[rgba(243,239,231,0.1)] bg-[#1C1C1C]/60 p-2 text-xs">
            <span className="text-[#B8B2A6]">Tracto Asignado: </span>
            <span className="font-['Barlow_Condensed'] font-bold text-white tracking-wider">
              {usuario.unidadAsignada}
            </span>
          </div>
        )}
      </div>

      {/* Lista de Secciones y Enlaces */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {secciones
          .filter(sec => usuario && sec.rolesPermitidos.some(r => r === usuario.rol || usuario.rol === 'admin'))
          .map((seccion, idx) => (
            <div key={idx} className="mb-6">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#B8B2A6]/80 font-['Barlow_Condensed']">
                {seccion.titulo}
              </div>
              <nav className="space-y-1">
                {seccion.items.map((item, itemIdx) => {
                  const Icono = item.icono
                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.ruta}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-[#F2620F] text-white font-bold shadow-lg shadow-[#F2620F]/25 ring-1 ring-white/20'
                            : 'text-[#f3f4f6] hover:bg-[#1C1C1C] hover:text-[#F2620F]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icono
                              className={`h-4 w-4 transition-colors shrink-0 ${
                                isActive ? 'text-white' : 'text-[#B8B2A6] group-hover:text-[#F2620F]'
                              }`}
                            />
                            <span className={isActive ? 'text-white font-bold' : ''}>
                              {item.titulo}
                            </span>
                          </div>

                          {item.badge ? (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-['Barlow_Condensed'] tracking-wider ${
                                isActive ? 'bg-black/30 text-white border border-white/25' : item.colorBadge || 'bg-white/10 text-white'
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-all ${
                                isActive ? 'opacity-100 text-white stroke-[2.5]' : 'opacity-0 group-hover:opacity-100 text-[#B8B2A6]'
                              }`}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
      </div>

      {/* Footer del Sidebar con versión y ayuda */}
      <div className="border-t border-[rgba(243,239,231,0.08)] px-4 pt-3 text-[11px] text-[#B8B2A6]">
        <div className="flex justify-between items-center">
          <span>Warhorse v2.4</span>
          <span className="rounded bg-[#3FA65C]/15 px-1.5 py-0.5 text-[10px] font-['Barlow_Condensed'] font-semibold text-[#3FA65C]">
            LARAGON OK
          </span>
        </div>
      </div>
    </aside>
  )
}
