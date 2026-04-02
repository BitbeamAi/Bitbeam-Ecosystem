import React from "react"

interface MarketSentimentWidgetProps {
  sentimentScore: number // 0..100
  trend: "Bullish" | "Bearish" | "Neutral"
  dominantToken: string
  totalVolume24h: number
  updatedAt?: number
}

const getSentimentColor = (score: number) => {
  if (score >= 70) return "#4caf50"
  if (score >= 40) return "#ff9800"
  return "#f44336"
}

const getTrendMarker = (trend: "Bullish" | "Bearish" | "Neutral") => {
  switch (trend) {
    case "Bullish":
      return "↑"
    case "Bearish":
      return "↓"
    default:
      return "–"
  }
}

export const MarketSentimentWidget: React.FC<MarketSentimentWidgetProps> = ({
  sentimentScore,
  trend,
  dominantToken,
  totalVolume24h,
  updatedAt,
}) => {
  // clamp the score defensively
  const score = Math.max(0, Math.min(100, Math.round(sentimentScore)))

  return (
    <div className="p-4 bg-white rounded shadow market-sentiment-widget">
      <h3 className="text-lg font-semibold mb-2">Market Sentiment</h3>
      <div className="flex items-center gap-4 sentiment-info">
        <div
          aria-label={`Sentiment score ${score} percent`}
          className="flex items-center justify-center w-16 h-16 rounded-full text-white font-bold score-circle"
          style={{ backgroundColor: getSentimentColor(score) }}
        >
          {score}%
        </div>
        <ul className="sentiment-details space-y-1">
          <li>
            <strong>Trend:</strong> {getTrendMarker(trend)} {trend}
          </li>
          <li>
            <strong>Dominant Token:</strong> {dominantToken}
          </li>
          <li>
            <strong>24h Volume:</strong> ${totalVolume24h.toLocaleString()}
          </li>
          {updatedAt ? (
            <li className="text-sm text-gray-500">
              Last update: {new Date(updatedAt).toLocaleTimeString()}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}

export default MarketSentimentWidget
