import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (profile?.role !== 'admin') {
    return (
      <div className="loading-screen">
        <div className="card form-card">
          <h2>Acceso denegado</h2>
          <p className="muted">Tu cuenta no tiene permisos de administrador.</p>
          <button className="button ghost" onClick={() => window.location.href = '/login'}>
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
