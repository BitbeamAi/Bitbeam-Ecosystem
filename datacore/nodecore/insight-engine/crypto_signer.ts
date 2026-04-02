export class SigningEngine {
  private keyPair!: CryptoKeyPair

  /**
   * Create a SigningEngine and generate keys asynchronously.
   */
  static async create(): Promise<SigningEngine> {
    const engine = new SigningEngine()
    engine.keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    ) as CryptoKeyPair
    return engine
  }

  async sign(data: string): Promise<string> {
    const enc = new TextEncoder().encode(data)
    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      this.keyPair.privateKey,
      enc
    )
    return Buffer.from(sig).toString("base64")
  }

  async verify(data: string, signature: string): Promise<boolean> {
    const enc = new TextEncoder().encode(data)
    const sig = Buffer.from(signature, "base64")
    return crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      this.keyPair.publicKey,
      sig,
      enc
    )
  }

  async exportPublicKey(): Promise<string> {
    const spki = await crypto.subtle.exportKey("spki", this.keyPair.publicKey)
    return Buffer.from(spki).toString("base64")
  }
}

// Example usage:
;(async () => {
  const signer = await SigningEngine.create()
  const msg = "hello world"
  const sig = await signer.sign(msg)
  const ok = await signer.verify(msg, sig)
  console.log({ sig, ok })
})()
