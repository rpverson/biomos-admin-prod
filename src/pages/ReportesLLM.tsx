import { useEffect, useState } from 'react'
import PageShell from '../components/PageShell'
import { getReportesLLM, type ReporteLLM } from '../services/ecorangerApi'

export default function ReportesLLM() {
  const [reportes, setReportes] = useState<ReporteLLM[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getReportesLLM()
      .then(setReportes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <PageShell
      title="Reportes LLM"
      subtitle="Reportes generados por inteligencia artificial a partir de los datos de campo."
    >
      {isLoading && <p className="muted">Cargando reportes...</p>}

      {error && (
        <div className="card">
          <p style={{ color: 'var(--color-danger, #c0392b)' }}>
            No se pudieron cargar los reportes: {error}
          </p>
        </div>
      )}

      {!isLoading && !error && reportes.length === 0 && (
        <p className="muted">No hay reportes disponibles.</p>
      )}

      <div className="table-wrap">
        {reportes.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                {Object.keys(reportes[0]).map((key) => (
                  <th key={key}>{key.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportes.map((reporte, index) => (
                <tr key={String(reporte.id ?? index)}>
                  {Object.values(reporte).map((value, i) => (
                    <td key={i}>
                      {value === null || value === undefined
                        ? '—'
                        : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  )
}
