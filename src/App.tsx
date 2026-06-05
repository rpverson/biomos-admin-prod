import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './state/AuthContext'
import RequireAdmin from './state/RequireAdmin'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import ReportesLLM from './pages/ReportesLLM'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
          <Route path="/usuarios" element={<RequireAdmin><Users /></RequireAdmin>} />
          <Route path="/reportes-llm" element={<RequireAdmin><ReportesLLM /></RequireAdmin>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
