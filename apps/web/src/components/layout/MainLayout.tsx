import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { AppNavbar } from './AppNavbar'
import { AppSidebar } from './AppSidebar'
import { ToastContainer } from './ToastContainer'
import { useAuthStore } from '../../store/useAuthStore'

export const MainLayout: React.FC = () => {
  const { usuario, token, verificarSesion } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token && !usuario) {
      navigate('/login', { replace: true })
      return
    }
    if (token) {
      verificarSesion()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!token && !usuario) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f10] text-[#f3f4f6]">
      {/* Barra de navegación superior fija */}
      <AppNavbar />

      {/* Cuerpo principal con Sidebar y Contenido */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />

        {/* Área de trabajo con scroll independiente y estilo industrial */}
        <main className="flex-1 overflow-y-auto bg-radial from-[rgba(197,160,89,0.04)] to-transparent p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Contenedor de Alertas Toasts */}
      <ToastContainer />
    </div>
  )
}

export default MainLayout
