type StatCardProps = {
  label: string
  value: number | string
  accent?: boolean
}

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className={`stat-card${accent ? ' stat-card--accent' : ''}`}>
      <div className="stat-value">{value.toLocaleString('es-CO')}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
