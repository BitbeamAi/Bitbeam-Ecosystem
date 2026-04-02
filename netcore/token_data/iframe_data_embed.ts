import type { TokenDataPoint } from "./token_data_fetcher"

export interface DataIframeConfig {
  containerId: string
  iframeUrl: string              // where the iframe is hosted
  token: string                  // token symbol/identifier
  refreshMs?: number             // optional polling interval
  targetOrigin?: string          // postMessage target origin (defaults to iframe origin)
  dataApiBase?: string           // optional: base URL for data API (defaults to iframe origin)
}

export class TokenDataIframeEmbedder {
  private iframe?: HTMLIFrameElement
  private intervalId?: number
  private destroyed = false

  constructor(private cfg: DataIframeConfig) {}

  async init(): Promise<void> {
    const container = document.getElementById(this.cfg.containerId)
    if (!container) throw new Error(`Container not found: ${this.cfg.containerId}`)

    const url = new URL(this.cfg.iframeUrl, window.location.href)
    const targetOrigin = this.cfg.targetOrigin ?? `${url.origin}`
    const dataApiBase = this.cfg.dataApiBase ?? `${url.origin}`

    // create iframe
    this.iframe = document.createElement("iframe")
    this.iframe.src = url.toString()
    this.iframe.style.border = "none"
    this.iframe.width = "100%"
    this.iframe.height = "100%"
    this.iframe.referrerPolicy = "no-referrer"
    this.iframe.onload = () => this.postTokenData(targetOrigin, dataApiBase)
    container.appendChild(this.iframe)

    // periodic refresh (optional)
    if (this.cfg.refreshMs && this.cfg.refreshMs > 0) {
      this.intervalId = window.setInterval(
        () => this.postTokenData(targetOrigin, dataApiBase),
        this.cfg.refreshMs
      )
      // pause polling when tab hidden, resume when visible
      document.addEventListener("visibilitychange", this.handleVisibility(targetOrigin, dataApiBase))
    }
  }

  private handleVisibility =
    (targetOrigin: string, dataApiBase: string) => () => {
      if (!this.intervalId) return
      if (document.hidden) {
        window.clearInterval(this.intervalId)
        this.intervalId = undefined
      } else if (!this.intervalId && this.cfg.refreshMs && this.cfg.refreshMs > 0) {
        this.intervalId = window.setInterval(
          () => this.postTokenData(targetOrigin, dataApiBase),
          this.cfg.refreshMs
        )
      }
    }

  private async postTokenData(targetOrigin: string, dataApiBase: string): Promise<void> {
    if (this.destroyed || !this.iframe?.contentWindow) return

    // dynamic import kept, but path normalized to snake_case
    const { TokenDataFetcher } = await import("./token_data_fetcher")
    const fetcher = new TokenDataFetcher(dataApiBase)
    const data: TokenDataPoint[] = await fetcher.fetchHistory(this.cfg.token)

    // send to iframe (scoped to targetOrigin)
    this.iframe.contentWindow.postMessage(
      { type: "TOKEN_DATA", token: this.cfg.token, data },
      targetOrigin
    )
  }

  destroy(): void {
    this.destroyed = true
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    document.removeEventListener("visibilitychange", this.handleVisibility as any)
    if (this.iframe?.parentElement) {
      this.iframe.parentElement.removeChild(this.iframe)
    }
    this.iframe = undefined
  }
}
