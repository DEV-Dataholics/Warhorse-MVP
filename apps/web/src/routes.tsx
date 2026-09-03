import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import { DemoProvider, rutaDeLanding, useDemo } from './lib/demo'
import Login from './pages/Login'
import Admin from './pages/Admin'
import DefinirPassword from './pages/DefinirPassword'
import Dashboard from './pages/Dashboard'
import Ficha from './pages/Ficha'
import Requisicion from './pages/Requisicion'
import Taller from './pages/Taller'
import Compras from './pages/Compras'
import Diesel from './pages/Diesel'
import Catalogo from './pages/Catalogo'
import Usuarios from './pages/Usuarios'
import Reportes from './pages/Reportes'
import OrdenesTrabajo from './pages/OrdenesTrabajo'
import OperadorApp from './pages/OperadorApp'

/**
 * Guarda por módulo (RF-USR-03): la visibilidad es UX; la seguridad real la
 * re-verifica el backend con el filtro rbac en cada endpoint.
 */
function RutaModulo({ modulo, children }: { modulo: string; children: ReactNode }) {
  const { sesion } = useDemo()
  if (!sesion) return <Navigate to="/login" replace />
  // Cambio obligatorio de contraseña: nada del Hub hasta definirla
  if (sesion.debe_cambiar_password) return <Navigate to="/definir-password" replace />
  if (!sesion.permisos[modulo]) return <Navigate to={rutaDeLanding(sesion.landing)} replace />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/operador" element={<OperadorApp />} />
      <Route path="/definir-password" element={<DefinirPassword />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<RutaModulo modulo="dashboard"><Dashboard /></RutaModulo>} />
        <Route path="/ficha/:id" element={<Ficha />} />
        <Route path="/requisicion" element={<RutaModulo modulo="requisicion"><Requisicion /></RutaModulo>} />
        <Route path="/taller" element={<RutaModulo modulo="taller"><Taller /></RutaModulo>} />
                <Route path="/compras" element={<RutaModulo modulo="compras"><Compras /></RutaModulo>} />
        <Route path="/admin" element={<RutaModulo modulo="admin"><Admin /></RutaModulo>} />
        <Route path="/diesel" element={<RutaModulo modulo="diesel"><Diesel /></RutaModulo>} />
        <Route path="/catalogo" element={<RutaModulo modulo="catalogo"><Catalogo /></RutaModulo>} />
        <Route path="/usuarios" element={<RutaModulo modulo="usuarios"><Usuarios /></RutaModulo>} />
        <Route path="/reportes" element={<RutaModulo modulo="reportes"><Reportes /></RutaModulo>} />
        <Route path="/reparaciones" element={<RutaModulo modulo="reparaciones"><OrdenesTrabajo /></RutaModulo>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <DemoProvider>
      <AppRoutes />
    </DemoProvider>
  )
}
