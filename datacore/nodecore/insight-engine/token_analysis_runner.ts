type AnalysisConfig = {
  rpcUrl: string
  dexApiUrl: string
  mint: string
  market: string
  activityLimit?: number
  depthLimit?: number
}

export async function runAnalysisPipeline(cfg: AnalysisConfig) {
  const startedAt = Date.now()

  // 1) Analyze activity
  const activityAnalyzer = new TokenActivityAnalyzer(cfg.rpcUrl)
  const records = await activityAnalyzer.analyzeActivity(
    cfg.mint,
    cfg.activityLimit ?? 20
  )

  // 2) Analyze depth
  const depthAnalyzer = new TokenDepthAnalyzer(cfg.dexApiUrl, cfg.market)
  const depthMetrics = await depthAnalyzer.analyze(cfg.depthLimit ?? 30)

  // 3) Detect patterns
  const volumes = records.map((r) => r.amount)
  const patterns = detectVolumePatterns(volumes, 5, 100)

  // 4) Execute a custom task
  const engine = new ExecutionEngine()
  engine.register("report", async (params: { records: unknown[] }) => ({
    recordCount: params.records.length,
  }))
  engine.enqueue("task_report_summary", "report", { records })
  const taskResults = await engine.runAll()

  // 5) Sign the results
  const signer = new SigningEngine()
  const payload = JSON.stringify({ depthMetrics, patterns, taskResults })
  const signature = await signer.sign(payload)
  const signatureValid = await signer.verify(payload, signature)

  if (!signatureValid) {
    throw new Error("Signature verification failed")
  }

  const finishedAt = Date.now()
  return {
    records,
    depthMetrics,
    patterns,
    taskResults,
    signature,
    signatureValid,
    durationMs: finishedAt - startedAt,
  }
}

// Optional: convenience IIFE usage (can be removed if you prefer pure export)
;(async () => {
  try {
    const result = await runAnalysisPipeline({
      rpcUrl: "https://solana.rpc",
      dexApiUrl: "https://dex.api",
      mint: "MintPubkeyHere",
      market: "MarketPubkeyHere",
      activityLimit: 20,
      depthLimit: 30,
    })
    console.log(result)
  } catch (err) {
    console.error("Pipeline failed:", (err as Error).message)
  }
})()
