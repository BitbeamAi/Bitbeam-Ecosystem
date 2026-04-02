export interface PricePoint {
  timestamp: number
  price: number
}

export interface TokenMetrics {
  averagePrice: number
  volatility: number // standard deviation
  maxPrice: number
  minPrice: number
  medianPrice: number
  returnsVolatility: number // stdev of log returns
}

export class TokenAnalysisCalculator {
  constructor(private data: PricePoint[]) {}

  private safePrices(): number[] {
    return this.data.map(p => p.price).filter(p => Number.isFinite(p) && p >= 0)
  }

  getAveragePrice(): number {
    const prices = this.safePrices()
    if (!prices.length) return 0
    const sum = prices.reduce((acc, p) => acc + p, 0)
    return sum / prices.length
  }

  getVolatility(): number {
    const prices = this.safePrices()
    if (!prices.length) return 0
    const avg = this.getAveragePrice()
    const variance = prices.reduce((acc, p) => acc + (p - avg) ** 2, 0) / prices.length
    return Math.sqrt(variance)
  }

  getMaxPrice(): number {
    const prices = this.safePrices()
    return prices.length ? Math.max(...prices) : 0
  }

  getMinPrice(): number {
    const prices = this.safePrices()
    return prices.length ? Math.min(...prices) : 0
  }

  getMedianPrice(): number {
    const prices = this.safePrices().sort((a, b) => a - b)
    if (!prices.length) return 0
    const mid = Math.floor(prices.length / 2)
    return prices.length % 2 === 0
      ? (prices[mid - 1] + prices[mid]) / 2
      : prices[mid]
  }

  getReturnsVolatility(): number {
    const prices = this.safePrices()
    if (prices.length < 2) return 0
    const logReturns = []
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] > 0 && prices[i] > 0) {
        logReturns.push(Math.log(prices[i] / prices[i - 1]))
      }
    }
    if (!logReturns.length) return 0
    const avg = logReturns.reduce((a, b) => a + b, 0) / logReturns.length
    const variance =
      logReturns.reduce((a, b) => a + (b - avg) ** 2, 0) / logReturns.length
    return Math.sqrt(variance)
  }

  computeMetrics(): TokenMetrics {
    return {
      averagePrice: Number(this.getAveragePrice().toFixed(6)),
      volatility: Number(this.getVolatility().toFixed(6)),
      maxPrice: this.getMaxPrice(),
      minPrice: this.getMinPrice(),
      medianPrice: this.getMedianPrice(),
      returnsVolatility: Number(this.getReturnsVolatility().toFixed(6)),
    }
  }
}
