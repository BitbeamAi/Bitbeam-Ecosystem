/**
 * Detect volume-based patterns in a series of activity amounts.
 */
export interface PatternMatch {
  index: number
  window: number
  average: number
  values: number[]
}

export function detectVolumePatterns(
  volumes: number[],
  windowSize: number,
  threshold: number,
  normalize = false
): PatternMatch[] {
  if (!Array.isArray(volumes) || volumes.length === 0) return []
  if (windowSize <= 0) throw new Error("windowSize must be > 0")
  if (threshold < 0) throw new Error("threshold must be >= 0")

  const matches: PatternMatch[] = []

  for (let i = 0; i + windowSize <= volumes.length; i++) {
    const slice = volumes.slice(i, i + windowSize)
    const sum = slice.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
    const avg = sum / windowSize

    const val = normalize ? avg / (Math.max(...slice) || 1) : avg

    if (val >= threshold) {
      matches.push({
        index: i,
        window: windowSize,
        average: Number(avg.toFixed(6)),
        values: slice,
      })
    }
  }

  return matches
}
