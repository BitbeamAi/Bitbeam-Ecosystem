import nodemailer from "nodemailer"

export interface AlertConfig {
  email?: {
    host: string
    port: number
    user: string
    pass: string
    from: string
    to: string[]
    secure?: boolean
  }
  console?: boolean
}

export interface AlertSignal {
  title: string
  message: string
  level: "info" | "warning" | "critical"
  timestamp?: number
}

export class AlertService {
  constructor(private cfg: AlertConfig) {}

  private async sendEmail(signal: AlertSignal) {
    if (!this.cfg.email) return
    const { host, port, user, pass, from, to, secure = false } = this.cfg.email
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
    await transporter.sendMail({
      from,
      to,
      subject: `[${signal.level.toUpperCase()}] ${signal.title}`,
      text: `${signal.message}\n\nSent at: ${new Date(
        signal.timestamp ?? Date.now()
      ).toISOString()}`,
    })
  }

  private logConsole(signal: AlertSignal) {
    if (!this.cfg.console) return
    console.log(
      `[Alert][${signal.level.toUpperCase()}] ${signal.title}\n${signal.message}\nTimestamp: ${
        signal.timestamp ?? Date.now()
      }`
    )
  }

  async dispatch(signals: AlertSignal[]) {
    for (const sig of signals) {
      await this.sendEmail(sig)
      this.logConsole(sig)
    }
  }
}
