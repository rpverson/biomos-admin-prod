import { useEffect, useState } from 'react'
import { adminClient } from '../supabase'
import PageShell from '../components/PageShell'
import StatCard from '../components/StatCard'

type TipoCount = { tipo: string; total: number }
type LocalidadCount = { localidad: string; total: number }
type MesCount = { mes: string; total: number }

type DashboardData = {
  totalRegistros: number
  registrosHoy: number
  totalUsuarios: number
  totalEcorangers: number
  totalEvidencias: number
  porTipo: TipoCount[]
  topLocalidades: LocalidadCount[]
  porMes: MesCount[]
}

type RegistroRow = {
  tipo_registro: string
  localidad: string | null
  fecha: string | null
}

type ProfileRow = {
  role: string
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatMes(mesStr: string) {
  const [year, month] = mesStr.split('-')
  return `${MESES[parseInt(month) - 1]} ${year}`
}

function BarChart({ items, labelKey, valueKey }: {
  items: Record<string, string | number>[]
  labelKey: string
  valueKey: string
}) {
  const max = Math.max(...items.map(i => i[valueKey] as number), 1)
  return (
    <div className="bar-chart">
      {items.length === 0 && <p className="muted">Sin datos disponibles</p>}
      {items.map((item, idx) => (
        <div key={idx} className="bar-row">
          <span className="bar-label" title={String(item[labelKey])}>{String(item[labelKey])}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${((item[valueKey] as number) / max) * 100}%` }}
            />
          </div>
          <span className="bar-count">{item[valueKey] as number}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [registrosRes, perfilesRes, evidenciasRes] = await Promise.all([
        adminClient.from('registros').select('tipo_registro, localidad, fecha'),
        adminClient.from('profiles').select('role'),
        adminClient.from('evidencias').select('id', { count: 'exact', head: true }),
      ])

      if (registrosRes.error) throw registrosRes.error
      if (perfilesRes.error) throw perfilesRes.error
      if (evidenciasRes.error) throw evidenciasRes.error

      const registros = (registrosRes.data ?? []) as RegistroRow[]
      const perfiles = (perfilesRes.data ?? []) as ProfileRow[]
      const totalEvidencias = evidenciasRes.count ?? 0

      const totalRegistros = registros.length
      const totalUsuarios = perfiles.length
      const totalEcorangers = perfiles.filter(p => p.role === 'ecoranger').length
      const registrosHoy = registros.filter(r => r.fecha === today).length

      // Por tipo
      const tipoMap = new Map<string, number>()
      registros.forEach(r => {
        tipoMap.set(r.tipo_registro, (tipoMap.get(r.tipo_registro) ?? 0) + 1)
      })
      const porTipo = Array.from(tipoMap.entries())
        .map(([tipo, total]) => ({ tipo, total }))
        .sort((a, b) => b.total - a.total)

      // Top localidades
      const localidadMap = new Map<string, number>()
      registros.forEach(r => {
        const loc = r.localidad?.trim()
        if (loc) localidadMap.set(loc, (localidadMap.get(loc) ?? 0) + 1)
      })
      const topLocalidades = Array.from(localidadMap.entries())
        .map(([localidad, total]) => ({ localidad, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      // Por mes — últimos 6 meses
      const mesMap = new Map<string, number>()
      registros.forEach(r => {
        if (r.fecha) {
          const mes = r.fecha.substring(0, 7)
          mesMap.set(mes, (mesMap.get(mes) ?? 0) + 1)
        }
      })
      const porMes = Array.from(mesMap.entries())
        .map(([mes, total]) => ({ mes, total }))
        .sort((a, b) => a.mes.localeCompare(b.mes))
        .slice(-6)

      setData({ totalRegistros, registrosHoy, totalUsuarios, totalEcorangers, totalEvidencias, porTipo, topLocalidades, porMes })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageShell title="Dashboard">
        <div className="loading-state">Cargando indicadores...</div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell title="Dashboard">
        <div className="error-banner">{error}</div>
      </PageShell>
    )
  }

  if (!data) return null

  const tipoItems = data.porTipo.map(d => ({ label: d.tipo, total: d.total }))
  const localidadItems = data.topLocalidades.map(d => ({ label: d.localidad, total: d.total }))
  const mesItems = data.porMes.map(d => ({ label: formatMes(d.mes), total: d.total }))

  return (
    <PageShell
      title="Dashboard"
      subtitle="Resumen de actividad del sistema de monitoreo"
    >
      <div className="stats-grid">
        <StatCard label="Total de registros" value={data.totalRegistros} accent />
        <StatCard label="Registros hoy" value={data.registrosHoy} />
        <StatCard label="Usuarios totales" value={data.totalUsuarios} />
        <StatCard label="Ecorangers" value={data.totalEcorangers} />
        <StatCard label="Evidencias subidas" value={data.totalEvidencias} />
      </div>

      <div className="charts-row">
        <div className="card chart-card">
          <h2>Top localidades</h2>
          <p className="lead">Zonas con mayor número de reportes</p>
          <BarChart
            items={localidadItems as Record<string, string | number>[]}
            labelKey="label"
            valueKey="total"
          />
        </div>

        <div className="card chart-card">
          <h2>Registros por tipo</h2>
          <p className="lead">Distribución de formularios enviados</p>
          <BarChart
            items={tipoItems as Record<string, string | number>[]}
            labelKey="label"
            valueKey="total"
          />
        </div>
      </div>

      <div className="card">
        <h2>Actividad por mes</h2>
        <p className="lead">Registros de los últimos 6 meses</p>
        <BarChart
          items={mesItems as Record<string, string | number>[]}
          labelKey="label"
          valueKey="total"
        />
      </div>
    </PageShell>
  )
}
