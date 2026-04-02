export interface PricePoint {
  timestamp: number
  priceUsd: number
}

export interface TrendResult {
  startTime: number
  endTime: number
  trend: "upward" | "downward" | "neutral"
  changePct: number
}

/**
 * Analyze a series of price points to determine overall trend segments.
 * - minSegmentLength: minimum length (in points) to emit a segment
 * - tolerancePct: ignore micro moves under this % when deciding direction
 * - minChangePct: require at least this % move across the segment to emit it
 */
export function analyzePriceTrends(
  points: PricePoint[],
  minSegmentLength: number = 5,
  tolerancePct: number = 0.1,
  minChangePct: number = 0
): TrendResult[] {
  const results: TrendResult[] = []
  if (!Array.isArray(points) || points.length < minSegmentLength) return results

  // ensure input is sorted by time
  const data = [...points].sort((a, b) => a.timestamp - b.timestamp)

  // helper to compute direction with tolerance (returns -1, 0, 1)
  const dir = (a: number, b: number): -1 | 0 | 1 => {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
    if (a <= 0 || b <= 0) return b > a ? 1 : b < a ? -1 : 0
    const pct = ((b - a) / a) * 100
    if (Math.abs(pct) < tolerancePct) return 0
    return pct > 0 ? 1 : -1
  }

  let segStart = 0
  let lastDir: -1 | 0 | 1 = 0

  for (let i = 1; i < data.length; i++) {
    const d = dir(data[i - 1].priceUsd, data[i].priceUsd)
    // initialize direction on first meaningful move
    if (lastDir === 0 && d !== 0) lastDir = d

    const isLastPoint = i === data.length - 1
    const nextDir = !isLastPoint ? dir(data[i].priceUsd, data[i + 1].priceUsd) : 0
    const segLen = i - segStart + 1

    const directionChanged =
      (lastDir !== 0 && nextDir !== lastDir && nextDir !== 0) ||
      (lastDir !== 0 && nextDir === 0) ||
      (lastDir === 0 && d === 0 && isLastPoint)

    const canEmit = segLen >= minSegmentLength && (directionChanged || isLastPoint)

    if (canEmit) {
      const start = data[segStart]
      const end = data[i]
      const startPrice = start.priceUsd
      const endPrice = end.priceUsd

      const changePct =
        startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0

      const trend: TrendResult["trend"] =
        changePct > 0 ? "upward" : changePct < 0 ? "downward" : "neutral"

      if (Math.abs(changePct) >= minChangePct) {
        results.push({
          startTime: start.timestamp,
          endTime: end.timestamp,
          trend,
          changePct: Math.round(changePct * 100) / 100,
        })
      }

      segStart = i
      lastDir = d || nextDir || 0
    } else {
      // keep tracking direction as it stabilizes
      if (d !== 0) lastDir = d
    }
  }

  return results
}
