export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectIntervalMs?: number
}

export type WebSocketMessage<T = any> = {
  topic: string
  payload: T
  timestamp: number
}

export class ResilientWebSocket {
  private socket?: WebSocket
  private url: string
  private protocols?: string[]
  private reconnectInterval: number
  private isManuallyClosed = false

  constructor(config: WebSocketConfig) {
    this.url = config.url
    this.protocols = config.protocols
    this.reconnectInterval = config.reconnectIntervalMs ?? 5000
  }

  connect(
    onMessage: (msg: WebSocketMessage) => void,
    onOpen?: () => void,
    onClose?: () => void
  ): void {
    this.isManuallyClosed = false

    this.socket = this.protocols
      ? new WebSocket(this.url, this.protocols)
      : new WebSocket(this.url)

    this.socket.onopen = () => {
      onOpen?.()
    }

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WebSocketMessage
        onMessage(msg)
      } catch {
        console.warn("Received invalid message:", event.data)
      }
    }

    this.socket.onclose = () => {
      onClose?.()
      if (!this.isManuallyClosed) {
        setTimeout(
          () => this.connect(onMessage, onOpen, onClose),
          this.reconnectInterval
        )
      }
    }

    this.socket.onerror = () => {
      this.socket?.close()
    }
  }

  send<T = any>(topic: string, payload: T): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ topic, payload, timestamp: Date.now() })
      this.socket.send(msg)
    } else {
      console.warn("WebSocket not open. Message dropped:", { topic, payload })
    }
  }

  disconnect(): void {
    this.isManuallyClosed = true
    this.socket?.close()
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}
