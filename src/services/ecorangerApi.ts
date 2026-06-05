const API_KEY = import.meta.env.VITE_ECORANGER_API_KEY as string

export type ReporteLLM = {
  id?: string | number
  fecha?: string
  tipo?: string
  contenido?: string
  estado?: string
  [key: string]: unknown
}

async function ecorangerFetch<T>(path: string): Promise<T> {
  const response = await fetch(`/ecoranger-api${path}`, {
    headers: { 'x-api-key': API_KEY },
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export async function getReportesLLM(): Promise<ReporteLLM[]> {
  const data = await ecorangerFetch<ReporteLLM[] | { data: ReporteLLM[] }>('/api/reportes-llm')
  return Array.isArray(data) ? data : data.data ?? []
}
