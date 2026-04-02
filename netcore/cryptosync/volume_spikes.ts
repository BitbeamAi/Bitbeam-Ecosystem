export interface VolumePoint {
  timestamp: number
  volumeUsd: number
}

export interface SpikeEvent {
  timestamp: number
  volume: number
  spikeRatio: number
}

/**
 * Detects spikes in trading volume compared to a rolling average window.
 *
 * @param points - array of time/volume points
 * @param windowSize - number of previous points to average
 * @param spikeThreshold - ratio above average considered a spike
 * @param minVolumeUsd - optional minimum absolute volume required to count as spike
 */
export function detectVolumeSpikes(
  points: VolumePoint[],
  windowSize: number = 10,
  spikeThreshold: number = 2.0,
  minVolumeUsd: number = 0
): SpikeEvent[] {
  const events: SpikeEvent[] = []
  if (!Array.isArray(points) || points.length <= windowSize) return events

  const volumes = points.map((p) =>
    Number.isFinite(p.volumeUsd) && p.volumeUsd >= 0 ? p.volumeUsd : 0
  )

  for (let i = windowSize; i < volumes.length; i++) {
    const window = volumes.slice(i - windowSize, i)
    const sum = window.reduce((s, v) => s + v, 0)
    const avg = sum / (window.length || 1)

    const curr = volumes[i]
    const ratio = avg > 0 ? curr / avg : Infinity

    if (ratio >= spikeThreshold && curr >= minVolumeUsd) {
      events.push({
        timestamp: points[i].timestamp,
        volume: Number(curr.toFixed(6)),
        spikeRatio: Number(ratio.toFixed(2)),
      })
    }
  }

  return events
}
