import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

type PageShellProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">MAWI</span>
          <strong className="brand-name">Biomos Admin</strong>
        </div>

        <ul className="sidebar-nav">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">&#9632;</span>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">&#9632;</span>
              Usuarios
            </NavLink>
          </li>
          <li>
            <NavLink to="/reportes-llm" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">&#9632;</span>
              Reportes LLM
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-footer">
          <span className="muted sidebar-email">{user?.email}</span>
          <button className="button ghost small" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="admin-main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="lead">{subtitle}</p>}
          </div>
          {actions && <div className="page-header-actions">{actions}</div>}
        </header>
        <div className="content">
          {children}
        </div>
      </main>
    </div>
  )
}
