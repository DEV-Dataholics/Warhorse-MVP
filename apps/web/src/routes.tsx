import React from 'react'
import { Navigate, Route, Routes } from 'react-router'
import MainLayout from './components/layout/MainLayout'
import PatioKioskLayout from './components/patio/PatioKioskLayout'
import { useAuthStore } from './store/useAuthStore'
import type { Rol } from './lib/types'

// Vistas
import Login from './pages/Login'
import DefinirPassword from './pages/DefinirPassword'
import Ficha from './pages/Ficha'
import Diesel from './pages/Diesel'
import Catalogo from './pages/Catalogo'
import Usuarios from './pages/Usuarios'
import PatioHome from './pages/patio/PatioHome'
import PatioInspeccion from './pages/patio/PatioInspeccion'
import PatioHistorial from './pages/patio/PatioHistorial'
import TallerOrdenes from './pages/taller/TallerOrdenes'
import TallerNuevaOT from './pages/taller/TallerNuevaOT'
import TallerPersonal from './pages/taller/TallerPersonal'
import TallerRefacciones from './pages/taller/TallerRefacciones'
import ComprasCarrito from './pages/compras/ComprasCarrito'
import ComprasCola from './pages/compras/ComprasCola'
import ComprasYonke from './pages/compras/ComprasYonke'
import { ComprasInventario } from './pages/compras/ComprasInventario'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReportes from './pages/admin/AdminReportes'

/**
 * Guarda de Ruta por Rol (RBAC de Frontend)
 * Oculta y protege la navegación; la seguridad real es validada en el backend por CI4 Shield.
 */
function RutaProtegida({ 
  rolesPermitidos, 
  children 
}: { 
  rolesPermitidos?: Rol[]
  children: React.ReactNode 
}) {
  const { usuario, token, tieneRol } = useAuthStore()

  if (!token && !usuario) {
    return <Navigate to="/login" replace />
  }

  // Si hay token pero el usuario aún se está resolviendo, esperar sin redirigir prematuramente
  if (token && !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f10]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A059] border-t-transparent" />
      </div>
    )
  }

  // Si tiene un rol restringido y no está en la lista permitida
  if (rolesPermitidos && rolesPermitidos.length > 0 && !tieneRol(rolesPermitidos)) {
    // Redirigir a la vista predeterminada según su rol
    if (usuario?.rol === 'operador') return <Navigate to="/patio" replace />
    if (usuario?.rol === 'taller') return <Navigate to="/taller/ordenes" replace />
    if (usuario?.rol === 'compras') return <Navigate to="/compras/carrito" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  const { usuario } = useAuthStore()

  // Determinar la ruta por defecto según rol
  const rutaDefault = usuario?.rol === 'operador' ? '/patio' :
                      usuario?.rol === 'taller' ? '/taller/ordenes' :
                      usuario?.rol === 'compras' ? '/compras/carrito' :
                      '/dashboard'

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/definir-password" element={<DefinirPassword />} />

      {/* Módulo de Patio en Modo Kiosk Tablet (Desacoplado de la barra lateral de escritorio) */}
      <Route element={<PatioKioskLayout />}>
        <Route
          path="/patio"
          element={
            <RutaProtegida rolesPermitidos={['operador', 'admin']}>
              <PatioHome />
            </RutaProtegida>
          }
        />
        <Route
          path="/patio/inspeccion"
          element={
            <RutaProtegida rolesPermitidos={['operador', 'admin']}>
              <PatioInspeccion />
            </RutaProtegida>
          }
        />
        <Route
          path="/patio/historial"
          element={
            <RutaProtegida rolesPermitidos={['operador', 'admin']}>
              <PatioHistorial />
            </RutaProtegida>
          }
        />
      </Route>

      {/* Rutas dentro del Layout Principal Industrial de Escritorio */}
      <Route element={<MainLayout />}>

        {/* Módulo Taller (Mantenimiento y OTs) */}
        <Route
          path="/taller/ordenes"
          element={
            <RutaProtegida rolesPermitidos={['taller', 'admin']}>
              <TallerOrdenes />
            </RutaProtegida>
          }
        />
        <Route
          path="/taller/refacciones"
          element={
            <RutaProtegida rolesPermitidos={['taller', 'admin']}>
              <TallerRefacciones />
            </RutaProtegida>
          }
        />
        <Route
          path="/taller/ingreso"
          element={
            <RutaProtegida rolesPermitidos={['taller', 'admin']}>
              <TallerNuevaOT />
            </RutaProtegida>
          }
        />
        <Route
          path="/taller/liberaciones"
          element={
            <RutaProtegida rolesPermitidos={['taller', 'admin']}>
              <TallerOrdenes />
            </RutaProtegida>
          }
        />
        <Route
          path="/taller/personal"
          element={
            <RutaProtegida rolesPermitidos={['taller', 'admin']}>
              <TallerPersonal />
            </RutaProtegida>
          }
        />
        <Route
          path="/taller"
          element={
            <RutaProtegida rolesPermitidos={['taller', 'admin']}>
              <TallerOrdenes />
            </RutaProtegida>
          }
        />

        {/* Módulo Compras (Abasto e Inventario) */}
        <Route
          path="/compras/carrito"
          element={
            <RutaProtegida rolesPermitidos={['compras', 'admin']}>
              <ComprasCarrito />
            </RutaProtegida>
          }
        />
        <Route
          path="/compras/cola"
          element={
            <RutaProtegida rolesPermitidos={['compras', 'admin']}>
              <ComprasCola />
            </RutaProtegida>
          }
        />
        <Route
          path="/compras/yonke"
          element={
            <RutaProtegida rolesPermitidos={['compras', 'admin']}>
              <ComprasYonke />
            </RutaProtegida>
          }
        />
        <Route
          path="/compras/inventario"
          element={
            <RutaProtegida rolesPermitidos={['compras', 'admin']}>
              <ComprasInventario />
            </RutaProtegida>
          }
        />
        <Route
          path="/compras/caja-chica"
          element={
            <RutaProtegida rolesPermitidos={['compras', 'admin']}>
              <ComprasCarrito />
            </RutaProtegida>
          }
        />
        <Route
          path="/compras"
          element={
            <RutaProtegida rolesPermitidos={['compras', 'admin']}>
              <ComprasCarrito />
            </RutaProtegida>
          }
        />
        <Route
          path="/requisicion"
          element={
            <RutaProtegida rolesPermitidos={['compras', 'taller', 'admin']}>
              <ComprasCarrito />
            </RutaProtegida>
          }
        />

        {/* Módulo Administración & Reportes */}
        <Route
          path="/dashboard"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <AdminDashboard />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/salud-flota"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/admin/reportes"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <AdminReportes />
            </RutaProtegida>
          }
        />
        <Route
          path="/reportes"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <AdminReportes />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <Usuarios />
            </RutaProtegida>
          }
        />
        <Route
          path="/ficha/:id"
          element={
            <RutaProtegida rolesPermitidos={['admin', 'taller', 'compras']}>
              <Ficha />
            </RutaProtegida>
          }
        />
        <Route
          path="/catalogo"
          element={
            <RutaProtegida rolesPermitidos={['admin', 'compras', 'taller']}>
              <Catalogo />
            </RutaProtegida>
          }
        />
        <Route
          path="/reportes"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <AdminReportes />
            </RutaProtegida>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RutaProtegida rolesPermitidos={['admin']}>
              <Usuarios />
            </RutaProtegida>
          }
        />

        {/* Módulo Diésel */}
        <Route
          path="/diesel/cargas"
          element={
            <RutaProtegida rolesPermitidos={['diesel', 'admin']}>
              <Diesel />
            </RutaProtegida>
          }
        />
        <Route
          path="/diesel/externas"
          element={
            <RutaProtegida rolesPermitidos={['diesel', 'admin']}>
              <Diesel />
            </RutaProtegida>
          }
        />
        <Route
          path="/diesel"
          element={
            <RutaProtegida rolesPermitidos={['diesel', 'admin']}>
              <Diesel />
            </RutaProtegida>
          }
        />
      </Route>

      {/* Redirección raíz o 404 */}
      <Route path="/" element={<Navigate to={rutaDefault} replace />} />
      <Route path="*" element={<Navigate to={rutaDefault} replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
