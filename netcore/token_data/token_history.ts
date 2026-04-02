export interface TokenDataPoint {
  timestamp: number
  priceUsd: number
  volumeUsd: number
  marketCapUsd: number
}

export class TokenDataFetcher {
  constructor(private apiBase: string, private timeoutMs: number = 15_000) {}

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Fetches an array of TokenDataPoint for the given token symbol.
   * Expected endpoint: `${apiBase}/tokens/${symbol}/history`
   */
  async fetchHistory(symbol: string): Promise<TokenDataPoint[]> {
    const url = `${this.apiBase.replace(/\/+$/, "")}/tokens/${encodeURIComponent(symbol)}/history`
    const raw = await this.fetchJson<any[]>(url)

    return raw.map((r) => ({
      timestamp: Number(r.time) * 1000 || 0,
      priceUsd: Number.isFinite(Number(r.priceUsd)) ? Number(r.priceUsd) : 0,
      volumeUsd: Number.isFinite(Number(r.volumeUsd)) ? Number(r.volumeUsd) : 0,
      marketCapUsd: Number.isFinite(Number(r.marketCapUsd)) ? Number(r.marketCapUsd) : 0,
    }))
  }
}
