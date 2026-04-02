/**
 * Analyze on-chain token activity: fetches recent activity and summarizes transfers.
 */
export interface ActivityRecord {
  timestamp: number
  signature: string
  source: string
  destination: string
  amount: number
}

type UiTokenAmount = {
  amount: string // raw string amount (base units)
  decimals: number
  uiAmount?: number | null
}

type TokenBalance = {
  accountIndex?: number
  owner?: string | null
  mint?: string
  uiTokenAmount: UiTokenAmount
}

type TxMeta = {
  preTokenBalances?: TokenBalance[]
  postTokenBalances?: TokenBalance[]
}

type TxResponse = {
  blockTime?: number | null
  meta?: TxMeta | null
}

/**
 * Lightweight JSON fetch with timeout.
 */
async function fetchJson<T>(url: string, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

/**
 * Convert UiTokenAmount to a JS number safely, preferring integer "amount/10^decimals".
 */
function toNumberAmount(uta: UiTokenAmount): number {
  const { amount, decimals, uiAmount } = uta
  if (uiAmount !== undefined && uiAmount !== null) return Number(uiAmount)
  // fallback: parse integer string and scale
  const int = Number(amount)
  if (!Number.isFinite(int)) return 0
  return int / Math.pow(10, decimals || 0)
}

export class TokenActivityAnalyzer {
  constructor(private rpcEndpoint: string) {}

  async fetchRecentSignatures(mint: string, limit = 100): Promise<string[]> {
    const url = `${this.rpcEndpoint}/getSignaturesForAddress/${encodeURIComponent(
      mint
    )}?limit=${encodeURIComponent(String(limit))}`
    const json = await fetchJson<any[]>(url)
    return json.map((e: any) => e.signature).filter(Boolean)
  }

  async analyzeActivity(mint: string, limit = 50): Promise<ActivityRecord[]> {
    const sigs = await this.fetchRecentSignatures(mint, limit)
    const out: ActivityRecord[] = []

    for (const sig of sigs) {
      try {
        const txUrl = `${this.rpcEndpoint}/getTransaction/${encodeURIComponent(sig)}`
        const tx = await fetchJson<TxResponse>(txUrl)

        const meta = tx.meta ?? undefined
        if (!meta) continue

        const pre = meta.preTokenBalances ?? []
        const post = meta.postTokenBalances ?? []

        // Build maps by accountIndex when available; fallback to array index
        const preMap = new Map<number, TokenBalance>()
        pre.forEach((b, i) => preMap.set(b.accountIndex ?? i, b))
        const postMap = new Map<number, TokenBalance>()
        post.forEach((b, i) => postMap.set(b.accountIndex ?? i, b))

        // Compare balances per index present in either side
        const idxSet = new Set<number>([
          ...Array.from(preMap.keys()),
          ...Array.from(postMap.keys()),
        ])

        for (const idx of idxSet) {
          const p = postMap.get(idx)
          const q = preMap.get(idx)

          const pAmt = p ? toNumberAmount(p.uiTokenAmount) : 0
          const qAmt = q ? toNumberAmount(q.uiTokenAmount) : 0
          const delta = pAmt - qAmt

          if (delta !== 0) {
            out.push({
              timestamp: (tx.blockTime ? tx.blockTime * 1000 : Date.now()),
              signature: sig,
              source: q?.owner ?? "unknown",
              destination: p?.owner ?? "unknown",
              amount: Math.abs(delta),
            })
          }
        }
      } catch {
        // skip malformed/failed transactions
        continue
      }
    }

    return out
  }
}
