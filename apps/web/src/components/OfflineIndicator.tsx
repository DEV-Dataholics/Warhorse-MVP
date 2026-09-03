import { useState, useEffect } from 'react'

export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOffline
}

export default function OfflineIndicator() {
  const isOffline = useIsOffline()

  if (!isOffline) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: '#C53030',
      color: 'white',
      padding: '10px 16px',
      borderRadius: 8,
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontWeight: 600,
      fontSize: 14
    }}>
      <span>⚠️ Sin conexión a internet</span>
      <span style={{ fontSize: 12, opacity: 0.9, borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 12 }}>
        Progreso guardado localmente
      </span>
    </div>
  )
}
