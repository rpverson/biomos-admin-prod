import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../supabase'

type LoginForm = {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  async function onSubmit(values: LoginForm) {
    setError(null)
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (authError) throw authError

      // Verificar que el usuario tiene rol admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Tu cuenta no tiene permisos de administrador.')
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="card form-card">
        <div className="login-header">
          <p className="eyebrow">MAWI</p>
          <h1 className="login-title">Biomos Admin</h1>
          <p className="muted">Panel de administración</p>
        </div>

        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="admin@ejemplo.com"
              {...register('email', { required: 'El correo es obligatorio' })}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'La contraseña es obligatoria' })}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
