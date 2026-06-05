import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { adminClient } from '../supabase'
import PageShell from '../components/PageShell'

type AdminUser = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  role: 'ecoranger' | 'admin'
}

type CreateUserForm = {
  email: string
  password: string
  role: 'ecoranger' | 'admin'
}

type ChangeRoleForm = {
  role: 'ecoranger' | 'admin'
}

type ChangePasswordForm = {
  password: string
  confirm: string
}

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'role'; user: AdminUser }
  | { type: 'password'; user: AdminUser }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">&#10005;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  return <span className={`role-badge ${role}`}>{role}</span>
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filtered, setFiltered] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(users.filter(u => u.email.toLowerCase().includes(q)))
  }, [search, users])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const [authRes, profilesRes] = await Promise.all([
        adminClient.auth.admin.listUsers({ page: 1, perPage: 500 }),
        adminClient.from('profiles').select('id, role'),
      ])

      if (authRes.error) throw authRes.error
      if (profilesRes.error) throw profilesRes.error

      const profileMap = new Map(
        (profilesRes.data ?? []).map(p => [p.id as string, p.role as string])
      )

      const merged: AdminUser[] = authRes.data.users.map(u => ({
        id: u.id,
        email: u.email ?? '(sin correo)',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        role: (profileMap.get(u.id) ?? 'ecoranger') as 'ecoranger' | 'admin',
      }))

      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setUsers(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }

  function showNotice(msg: string) {
    setNotice(msg)
    setTimeout(() => setNotice(null), 4000)
  }

  function closeModal() {
    setModal({ type: 'none' })
  }

  // --- Crear usuario ---
  const createForm = useForm<CreateUserForm>({ defaultValues: { role: 'ecoranger' } })

  async function handleCreate(values: CreateUserForm) {
    setSubmitting(true)
    try {
      const { data, error: authErr } = await adminClient.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
      })
      if (authErr) throw authErr

      await adminClient.from('profiles').insert({ id: data.user.id, role: values.role })

      closeModal()
      createForm.reset()
      showNotice(`Usuario ${values.email} creado exitosamente.`)
      await fetchUsers()
    } catch (err) {
      createForm.setError('root', { message: err instanceof Error ? err.message : 'Error al crear usuario' })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Cambiar rol ---
  const roleForm = useForm<ChangeRoleForm>()

  async function handleChangeRole(values: ChangeRoleForm) {
    if (modal.type !== 'role') return
    setSubmitting(true)
    try {
      const { error: err } = await adminClient
        .from('profiles')
        .update({ role: values.role })
        .eq('id', modal.user.id)
      if (err) throw err

      closeModal()
      showNotice(`Rol de ${modal.user.email} actualizado a "${values.role}".`)
      await fetchUsers()
    } catch (err) {
      roleForm.setError('root', { message: err instanceof Error ? err.message : 'Error al cambiar rol' })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Cambiar contraseña ---
  const pwForm = useForm<ChangePasswordForm>()

  async function handleChangePassword(values: ChangePasswordForm) {
    if (modal.type !== 'password') return
    if (values.password !== values.confirm) {
      pwForm.setError('confirm', { message: 'Las contraseñas no coinciden' })
      return
    }
    setSubmitting(true)
    try {
      const { error: err } = await adminClient.auth.admin.updateUserById(modal.user.id, {
        password: values.password,
      })
      if (err) throw err

      closeModal()
      pwForm.reset()
      showNotice(`Contraseña de ${modal.user.email} actualizada.`)
    } catch (err) {
      pwForm.setError('root', { message: err instanceof Error ? err.message : 'Error al cambiar contraseña' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Usuarios"
      subtitle="Administra los accesos al sistema de monitoreo"
      actions={
        <button className="button" onClick={() => { createForm.reset(); setModal({ type: 'create' }) }}>
          + Nuevo usuario
        </button>
      }
    >
      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="table-toolbar">
          <input
            type="search"
            placeholder="Buscar por correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <span className="muted table-count">{filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="loading-state">Cargando usuarios...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Fecha de registro</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{formatDate(user.last_sign_in_at)}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="button ghost small"
                          onClick={() => { roleForm.reset({ role: user.role }); setModal({ type: 'role', user }) }}
                        >
                          Cambiar rol
                        </button>
                        <button
                          className="button ghost small"
                          onClick={() => { pwForm.reset(); setModal({ type: 'password', user }) }}
                        >
                          Contraseña
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear usuario */}
      {modal.type === 'create' && (
        <Modal title="Nuevo usuario" onClose={closeModal}>
          <form className="form" onSubmit={createForm.handleSubmit(handleCreate)}>
            <div className="form-field">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="usuario@ejemplo.com"
                {...createForm.register('email', { required: 'El correo es obligatorio' })}
              />
              {createForm.formState.errors.email && (
                <span className="error">{createForm.formState.errors.email.message}</span>
              )}
            </div>

            <div className="form-field">
              <label>Contraseña inicial</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...createForm.register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
              />
              {createForm.formState.errors.password && (
                <span className="error">{createForm.formState.errors.password.message}</span>
              )}
            </div>

            <div className="form-field">
              <label>Rol</label>
              <div className="options">
                <label className="option">
                  <input type="radio" value="ecoranger" {...createForm.register('role')} />
                  Ecoranger
                </label>
                <label className="option">
                  <input type="radio" value="admin" {...createForm.register('role')} />
                  Admin
                </label>
              </div>
            </div>

            {createForm.formState.errors.root && (
              <div className="error-banner">{createForm.formState.errors.root.message}</div>
            )}

            <div className="modal-actions">
              <button type="button" className="button ghost" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="button" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Cambiar rol */}
      {modal.type === 'role' && (
        <Modal title="Cambiar rol" onClose={closeModal}>
          <p className="muted" style={{ marginBottom: '1rem' }}>{modal.user.email}</p>
          <form className="form" onSubmit={roleForm.handleSubmit(handleChangeRole)}>
            <div className="form-field">
              <label>Nuevo rol</label>
              <div className="options">
                <label className="option">
                  <input type="radio" value="ecoranger" {...roleForm.register('role', { required: true })} />
                  Ecoranger — Solo puede enviar reportes
                </label>
                <label className="option">
                  <input type="radio" value="admin" {...roleForm.register('role', { required: true })} />
                  Admin — Acceso al panel de gestión
                </label>
              </div>
            </div>

            {roleForm.formState.errors.root && (
              <div className="error-banner">{roleForm.formState.errors.root.message}</div>
            )}

            <div className="modal-actions">
              <button type="button" className="button ghost" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="button" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar cambio'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Cambiar contraseña */}
      {modal.type === 'password' && (
        <Modal title="Cambiar contraseña" onClose={closeModal}>
          <p className="muted" style={{ marginBottom: '1rem' }}>{modal.user.email}</p>
          <form className="form" onSubmit={pwForm.handleSubmit(handleChangePassword)}>
            <div className="form-field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...pwForm.register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
              />
              {pwForm.formState.errors.password && (
                <span className="error">{pwForm.formState.errors.password.message}</span>
              )}
            </div>

            <div className="form-field">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                {...pwForm.register('confirm', { required: 'Confirma la contraseña' })}
              />
              {pwForm.formState.errors.confirm && (
                <span className="error">{pwForm.formState.errors.confirm.message}</span>
              )}
            </div>

            {pwForm.formState.errors.root && (
              <div className="error-banner">{pwForm.formState.errors.root.message}</div>
            )}

            <div className="modal-actions">
              <button type="button" className="button ghost" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="button" disabled={submitting}>
                {submitting ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageShell>
  )
}
