export interface Signal {
  id: string
  type: string
  timestamp: number
  payload: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

export interface ClientOptions {
  apiKey?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

type Query = Record<string, string | number | boolean | undefined>

function buildQuery(params?: Query): string {
  if (!params) return ""
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&")
  return q ? `?${q}` : ""
}

/**
 * Lightweight HTTP client for fetching signals over REST
 */
export class SignalsClient {
  private baseUrl: string
  private apiKey?: string
  private timeoutMs: number
  private fetchImpl: typeof fetch

  constructor(baseUrl: string, options: ClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "")
    this.apiKey = options.apiKey
    this.timeoutMs = options.timeoutMs ?? 15_000
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (this.apiKey) h["Authorization"] = `Bearer ${this.apiKey}`
    return h
  }

  private async request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers(), ...(init?.headers as any) },
        signal: controller.signal,
      })

      const status = res.status
      const isJson = res.headers.get("content-type")?.includes("application/json")
      const body = isJson ? await res.json() : await res.text()

      if (!res.ok) {
        const msg = isJson && body?.error ? body.error : `HTTP ${status}`
        return { success: false, error: msg, status }
      }
      return { success: true, data: body as T, status }
    } catch (err: any) {
      const aborted = err?.name === "AbortError"
      return { success: false, error: aborted ? "Request timed out" : err?.message }
    } finally {
      clearTimeout(to)
    }
  }

  /**
   * Fetch a paginated list of signals
   */
  async fetchAllSignals(params?: { page?: number; limit?: number; type?: string }): Promise<ApiResponse<Signal[]>> {
    const q = buildQuery({ page: params?.page, limit: params?.limit, type: params?.type })
    return this.request<Signal[]>(`/signals${q}`, { method: "GET" })
  }

  /**
   * Fetch a single signal by id
   */
  async fetchSignalById(id: string): Promise<ApiResponse<Signal>> {
    return this.request<Signal>(`/signals/${encodeURIComponent(id)}`, { method: "GET" })
  }
}
