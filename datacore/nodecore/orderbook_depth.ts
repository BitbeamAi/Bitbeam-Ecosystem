/**
 * Analyze on-chain orderbook depth for a given market.
 */
export interface Order {
  price: number
  size: number
}

export interface DepthMetrics {
  averageBidDepth: number
  averageAskDepth: number
  spread: number
}

type OrderbookResponse = { bids: Order[]; asks: Order[] }

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n)
}

function avgSize(list: Order[]): number {
  if (!list.length) return 0
  let sum = 0
  for (const o of list) {
    const s = isFiniteNumber(o?.size) ? o.size : 0
    sum += s
  }
  return sum / list.length
}

async function fetchJson<T>(url: string, timeoutMs = 15_000): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

export class TokenDepthAnalyzer {
  constructor(private rpcEndpoint: string, private marketId: string) {}

  async fetchOrderbook(depth = 50): Promise<OrderbookResponse> {
    const d = Math.max(1, Math.floor(depth))
    const url = `${this.rpcEndpoint.replace(/\/+$/, "")}/orderbook/${encodeURIComponent(
      this.marketId
    )}?depth=${encodeURIComponent(String(d))}`
    const ob = await fetchJson<OrderbookResponse>(url)
    return {
      bids: Array.isArray(ob.bids) ? ob.bids : [],
      asks: Array.isArray(ob.asks) ? ob.asks : [],
    }
  }

  async analyze(depth = 50): Promise<DepthMetrics> {
    const { bids, asks } = await this.fetchOrderbook(depth)

    const bestBid = isFiniteNumber(bids[0]?.price) ? bids[0].price : 0
    const bestAsk = isFiniteNumber(asks[0]?.price) ? asks[0].price : 0

    const spread = bestAsk > 0 && bestBid > 0 ? Math.max(0, bestAsk - bestBid) : 0

    return {
      averageBidDepth: Number(avgSize(bids).toFixed(6)),
      averageAskDepth: Number(avgSize(asks).toFixed(6)),
      spread: Number(spread.toFixed(6)),
    }
  }
}
